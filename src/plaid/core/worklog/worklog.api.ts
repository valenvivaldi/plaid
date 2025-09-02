import {Injectable} from '@angular/core';
import {Worklog, AdfDocument} from '../../model/worklog';
import {HttpClient} from '@angular/common/http';
import {SearchResults} from '../../model/search-results';
import {JqlSearchResults} from '../../model/jql-search-results';
import {formatDate} from '@angular/common';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {WorklogWithPagination} from '../../model/worklog-with-pagination';
import {User} from '../../model/user';
import {DateRange} from '../../model/date-range';

@Injectable({ providedIn: 'root' })
export class WorklogApi {
  private readonly searchUrl = '/rest/api/3/search/jql';
  private readonly getWorklogsUrl = '/rest/api/3/issue/{issueIdOrKey}/worklog';
  private readonly addWorklogUrl = '/rest/api/3/issue/{issueIdOrKey}/worklog';
  private readonly updateWorklogUrl = '/rest/api/3/issue/{issueIdOrKey}/worklog/{id}';
  private readonly deleteWorklogUrl = '/rest/api/3/issue/{issueIdOrKey}/worklog/{id}';

  constructor(private http: HttpClient) { }

  /**
   * Converts a plain text comment to ADF format for v3 API
   */
  private convertTextToAdf(text: string): AdfDocument {
    if (!text) {
      return {
        type: 'doc',
        version: 1,
        content: []
      };
    }
    
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: text
            }
          ]
        }
      ]
    };
  }

  /**
   * Extracts plain text from ADF format
   */
  public extractTextFromAdf(adf: AdfDocument | string): string {
    if (typeof adf === 'string') {
      return adf;
    }
    
    if (!adf || !adf.content) {
      return '';
    }
    
    let result = '';
    for (const content of adf.content) {
      if (content.content) {
        for (const textContent of content.content) {
          if (textContent.type === 'text') {
            result += textContent.text;
          }
        }
      }
    }
    return result;
  }

  /**
   * Emits search results directly as fetched from API.
   */
  getIssuesForWorklogDateRange$(
    dateRange: DateRange,
    user: User,
    startAt = 0
  ): Observable<SearchResults> {
    const jql = 'worklogAuthor = currentUser() && worklogDate >= "'
      + formatDate(dateRange.start, 'yyyy-MM-dd', 'en-US') + '" && worklogDate <= "'
      + formatDate(dateRange.end, 'yyyy-MM-dd', 'en-US') + '"';
    
    const url = this.searchUrl
      + '?fields=components,issuetype,parent,priority,summary,status'
      + '&jql=' + encodeURIComponent(jql);

    // Para compatibilidad, convertimos la respuesta del nuevo formato al antiguo
    return this.http.get<JqlSearchResults>(url).pipe(
      map((jqlResults: JqlSearchResults): SearchResults => {
        // Simulamos el comportamiento de startAt/maxResults del endpoint anterior
        const maxResults = 50; // Default de Jira
        return {
          expand: '',
          startAt: startAt,
          maxResults: maxResults,
          total: jqlResults.isLast ? startAt + (jqlResults.issues?.length || 0) : startAt + maxResults + 1,
          issues: jqlResults.issues || [],
          warningMessages: jqlResults.warningMessages,
          names: jqlResults.names,
          schema: jqlResults.schema
        };
      })
    );
  }

  /**
   * Emits a page of work logs directly as fetched from API.
   */
  getWorklogsForIssue$(issueId: string, startAt = 0): Observable<WorklogWithPagination> {
    let url = this.getWorklogsUrl.replace('{issueIdOrKey}', issueId);
    if (startAt > 0) {
      url += '?startAt=' + startAt;
    }
    return this.http.get<WorklogWithPagination>(url);
  }

  /**
   * Adds new work log entry and returns observable emitting added entry
   */
  addWorklog$(issueId: string, started: Date, timeSpentSeconds: number, comment: string): Observable<Worklog> {
    const url: string = this.addWorklogUrl.replace('{issueIdOrKey}', issueId);
    const body = {
      started: started.toISOString().replace(/Z$/, '+0000'),
      timeSpentSeconds,
      comment: this.convertTextToAdf(comment)
    };
    return this.http.post<Worklog>(url, body);
  }

  /**
   * Updates work log entry and returns observable emitting updated entry
   */
  updateWorklog$(issueId: string, worklogId: string, started: Date, timeSpentSeconds: number, comment: string): Observable<Worklog> {
    const url: string = this.updateWorklogUrl.replace('{issueIdOrKey}', issueId).replace('{id}', worklogId);
    const body = {
      started: started.toISOString().replace(/Z$/, '+0000'),
      timeSpentSeconds,
      comment: this.convertTextToAdf(comment)
    };
    return this.http.put<Worklog>(url, body);
  }

  /**
   * Deletes work log entry and returns observable emitting when the deletion finishes.
   */
  deleteWorklog$(issueId: string, worklogId: string): Observable<void> {
    return this.http.delete<void>(this.deleteWorklogUrl.replace('{issueIdOrKey}', issueId).replace('{id}', worklogId));
  }
}
