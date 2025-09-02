import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {Issue} from '../../model/issue';
import {SearchResults} from '../../model/search-results';
import {JqlSearchResults} from '../../model/jql-search-results';

@Injectable({ providedIn: 'root' })
export class IssueApi {
  private readonly getIssueUrl = '/rest/api/3/issue/{issueIdOrKey}';
  private readonly searchUrl = '/rest/api/3/search/jql';

  constructor(private http: HttpClient) { }

  getIssue$(issueIdOrKey: string): Observable<Issue | null> {
    // Also fetch original time estimate to detect missing estimations
    return this.http.get<Issue>(
      this.getIssueUrl.replace('{issueIdOrKey}', issueIdOrKey) +
      '?fields=components,issuetype,parent,priority,summary,status,timeoriginalestimate'
    ).pipe(catchError(() => of(null)));
  }

  search$(jql: string, limit: number = 15): Observable<SearchResults> {
    return this.http.post<JqlSearchResults>(this.searchUrl, {
      jql,
      maxResults: limit,
      fields: [
        'components',
        'issuetype',
        'parent',
        'priority',
        'summary',
        'status'
      ]
    }).pipe(
      map((jqlResults: JqlSearchResults): SearchResults => {
        // Convertimos la respuesta del nuevo formato al antiguo para compatibilidad
        return {
          expand: '',
          startAt: 0,
          maxResults: limit,
          total: jqlResults.issues?.length || 0,
          issues: jqlResults.issues || [],
          warningMessages: jqlResults.warningMessages,
          names: jqlResults.names,
          schema: jqlResults.schema
        };
      })
    );
  }

  /**
   * Actualiza la estimación original (timetracking.originalEstimate) de un issue
   * @param issueKey clave del issue
   * @param estimateTexto texto de estimación (ej. "1h 30m")
   */
  updateOriginalEstimate$(issueKey: string, estimateTexto: string): Observable<any> {
    const url = this.getIssueUrl.replace('{issueIdOrKey}', issueKey);
    return this.http.put(url, {
      fields: {
        timetracking: {
          originalEstimate: estimateTexto
        }
      }
    });
  }
}
