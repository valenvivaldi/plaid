import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {EMPTY, from, Observable, throwError} from 'rxjs';
import {catchError, filter, map, mergeMap, skip, take} from 'rxjs/operators';
import {AuthState} from './auth.state';
import {User} from '../../model/user';
import {ElectronService} from '../electron/electron.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authState: AuthState, private electronService: ElectronService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authInfo = this.authState.getAuthInfo();
    if (authInfo) {
      const url = request.url.substr(0, 7) !== 'http://' && request.url.substr(0, 8) !== 'https://'
        ? authInfo.jiraUrl + request.url
        : request.url;
      if (this.electronService.isElectron) {
        return this.handleElectronRequest(request, next, url);
      }
      const newRequest: HttpRequest<any> = request.clone({
        setHeaders: {Authorization: this.authState.getAuthHeader()},
        url
      });
      return next.handle(newRequest).pipe(
        catchError((error: HttpErrorResponse) => this.handleError(request, next, error))
      );
    } else {
      return this.handleError(request, next, null);
    }
  }

  private handleElectronRequest(
    request: HttpRequest<any>,
    next: HttpHandler,
    url: string
  ): Observable<HttpEvent<any>> {
    return from(this.electronService.request({
      url,
      method: request.method,
      body: request.body
    })).pipe(
      map(response => {
        if (response.status >= 200 && response.status < 300) {
          return new HttpResponse({
            body: response.body,
            headers: new HttpHeaders(response.headers),
            status: response.status,
            statusText: response.statusText,
            url
          });
        }
        throw new HttpErrorResponse({
          error: response.body,
          headers: new HttpHeaders(response.headers),
          status: response.status,
          statusText: response.statusText,
          url
        });
      }),
      catchError(error => this.handleError(request, next, error instanceof HttpErrorResponse
        ? error
        : new HttpErrorResponse({error, status: 0, url})))
    );
  }

  private handleError(request: HttpRequest<any>, next: HttpHandler, error: HttpErrorResponse | null): Observable<HttpEvent<any>> {
    if (!error || error.status !== 404 || request.method !== 'GET' ||
      !/\/rest\/api\/3\/issue\/[A-Za-z][A-Za-z0-9_]*-[1-9][0-9]*\?/.test(request.url)) {
      // 404 status when calling GET /rest/api/3/issue/{issueKey} is unfortunately our only way to tell if issue ID is
      // invalid. In any other case we report the error to authState to bring up application error modal.
      if (error) {
        this.authState.setError(error);
      }
    }

    if (!error || [0, 401].includes(error.status)) { // If the error is related to lack of connection or authentication:
      // Retry the request after authentication, except /rest/api/3/myself, because requests to this end point will be
      // retried in the process of authentication.
      return request.url === '/rest/api/3/myself'
        ? EMPTY
        : this.retryAfterAuthenticated(() => this.intercept(request, next));
    } else { // Otherwise let the error propagate
      return throwError(() => error);
    }
  }

  private retryAfterAuthenticated(event$fn: () => Observable<HttpEvent<any>>): Observable<HttpEvent<any>> {
    return this.authState.getAuthenticatedUser$().pipe(
      skip<User>(1),
      filter<User>((user: User) => user != null),
      take<User>(1),
      mergeMap<User, Observable<HttpEvent<any>>>(() => event$fn())
    );
  }
}
