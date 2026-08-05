import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {AuthInfo} from '../../model/auth-info';
import {ElectronService} from '../electron/electron.service';
import {User} from '../../model/user';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly AUTH_INFO = 'AUTH_INFO';
  private readonly AUTH_HEADER = 'AUTH_HEADER';

  private jiraURL: string = null;
  private error = new BehaviorSubject<HttpErrorResponse>(null);
  private authenticatedUser = new BehaviorSubject<User>(null);
  private authInfo = new BehaviorSubject<AuthInfo>(null);

  constructor(private electronService: ElectronService) {
    const saved = this.getAuthInfo();
    if (this.electronService.isElectron && !saved) {
      const legacy = this.getBrowserAuthInfo();
      if (legacy) {
        this.setAuthInfo(legacy);
        return;
      }
    }
    this.jiraURL = saved?.jiraUrl || null;
    this.authInfo.next(saved);
  }

  static getAuthHeaderKey(authInfo: AuthInfo): string {
    return 'Basic ' + btoa(authInfo.username + ':' + authInfo.password);
  }

  setAuthInfo(authInfo: AuthInfo): void {
    if (authInfo) {
      if (this.electronService.isElectron) {
        authInfo = this.electronService.setAuthInfo(authInfo);
        localStorage.removeItem(this.AUTH_INFO);
        localStorage.removeItem(this.AUTH_HEADER);
      } else {
        localStorage.setItem(this.AUTH_INFO, JSON.stringify(authInfo));
        localStorage.setItem(this.AUTH_HEADER, AuthState.getAuthHeaderKey(authInfo));
      }
    } else {
      if (this.electronService.isElectron) {
        this.electronService.clearAuthInfo();
      }
      localStorage.removeItem(this.AUTH_INFO);
      localStorage.removeItem(this.AUTH_HEADER);
    }
    this.jiraURL = authInfo?.jiraUrl || null;
    this.authInfo.next(authInfo);
  }

  useElectronAuthProfile(authInfo: AuthInfo): void {
    localStorage.removeItem(this.AUTH_INFO);
    localStorage.removeItem(this.AUTH_HEADER);
    this.jiraURL = authInfo.jiraUrl;
    this.authInfo.next(authInfo);
  }

  getAuthInfo(): AuthInfo {
    return this.electronService.isElectron
      ? this.electronService.getSavedAuthInfo()
      : this.getBrowserAuthInfo();
  }

  private getBrowserAuthInfo(): AuthInfo {
    try {
      const infoJson: string = localStorage.getItem(this.AUTH_INFO);
      return infoJson ? JSON.parse(infoJson) : null;
    } catch {
      return null;
    }
  }

  getAuthInfo$(): Observable<AuthInfo> {
    return this.authInfo.asObservable();
  }

  getAuthHeader(): string {
    return localStorage.getItem(this.AUTH_HEADER);
  }

  setError(authorized: HttpErrorResponse): void {
    this.error.next(authorized);
  }

  getError$(): Observable<HttpErrorResponse> {
    return this.error.asObservable();
  }

  getJiraURL(): string {
    return this.jiraURL;
  }

  getAuthenticatedUser$(): Observable<User> {
    return this.authenticatedUser.asObservable();
  }

  getAuthenticatedUser(): User {
    return this.authenticatedUser.value;
  }

  setAuthenticatedUser(user: User): void {
    this.authenticatedUser.next(user);
  }
}
