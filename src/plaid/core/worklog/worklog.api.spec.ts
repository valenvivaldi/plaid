import {firstValueFrom, of} from 'rxjs';
import '@angular/compiler';
import {describe, expect, it, vi} from 'vitest';
import {WorklogApi} from './worklog.api';

describe('WorklogApi', () => {
  it('sends Jira enhanced-search pagination tokens', async () => {
    const response = {isLast: true, issues: []};
    const http = {get: vi.fn(() => of(response))};
    const api = new WorklogApi(http as any);
    const range = {start: new Date(2026, 0, 1), end: new Date(2026, 0, 7)};

    await expect(firstValueFrom(api.getIssuesForWorklogDateRange$(range, {} as any, 'next token')))
      .resolves.toBe(response);

    const requestedUrl = http.get.mock.calls[0][0] as string;
    expect(requestedUrl).toContain('/rest/api/3/search/jql?');
    expect(requestedUrl).toContain('nextPageToken=next%20token');
    expect(requestedUrl).toContain('maxResults=100');
    expect(requestedUrl).not.toContain('startAt=');
  });

  it('extracts plain text from an ADF worklog comment', () => {
    const api = new WorklogApi({} as any);
    const text = api.extractTextFromAdf({
      type: 'doc',
      version: 1,
      content: [
        {type: 'paragraph', content: [{type: 'text', text: 'First'}]},
        {type: 'paragraph', content: [{type: 'text', text: ' second'}]}
      ]
    });

    expect(text).toBe('First second');
  });
});
