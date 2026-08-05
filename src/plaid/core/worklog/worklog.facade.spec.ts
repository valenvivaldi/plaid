import {BehaviorSubject, firstValueFrom, of} from 'rxjs';
import {toArray} from 'rxjs/operators';
import {describe, expect, it, vi} from 'vitest';
import {WorklogFacade} from './worklog.facade';

const range = {start: new Date(2026, 0, 1), end: new Date(2026, 0, 7)};
const user = {self: 'https://jira.example/rest/api/3/user?accountId=me'};

function createFacade(worklogApi: any) {
  const worklogState = {
    setWorklogs: vi.fn(),
    setFetching: vi.fn(),
    getWorklogs$: vi.fn(() => of([])),
    getFetching$: vi.fn(() => of(false)),
    deleteWorklog: vi.fn(),
    addOrUpdateWorklog: vi.fn()
  };
  const authFacade = {
    reconnect: vi.fn(),
    getAuthenticatedUser$: vi.fn(() => new BehaviorSubject(null))
  };
  const appState = {
    getVisibleDateRange$: vi.fn(() => new BehaviorSubject(range))
  };
  const preferences = {
    getRefreshIntervalMinutes$: vi.fn(() => new BehaviorSubject(0))
  };

  const facade = new WorklogFacade(
    worklogState as any,
    worklogApi,
    authFacade as any,
    appState as any,
    preferences as any
  );
  return {facade, worklogState};
}

describe('WorklogFacade Jira pagination', () => {
  it('follows nextPageToken and stops on isLast', async () => {
    const first = {isLast: false, nextPageToken: 'page-2', issues: [{id: '1'}]};
    const second = {isLast: true, issues: [{id: '2'}]};
    const getIssues = vi.fn((_range, _user, token?: string) => of(token ? second : first));
    const {facade} = createFacade({getIssuesForWorklogDateRange$: getIssues});

    const pages = await firstValueFrom(
      (facade as any).streamAllIssuesForWorklogDateRange$(range, user).pipe(toArray())
    );

    expect(pages.map((page: any[]) => page.map(issue => issue.id))).toEqual([['1'], ['2']]);
    expect(getIssues).toHaveBeenCalledTimes(2);
    expect(getIssues.mock.calls[1][2]).toBe('page-2');
  });

  it('emits an empty list when Jira finds no issues', async () => {
    const worklogApi = {
      getIssuesForWorklogDateRange$: vi.fn(() => of({isLast: true, issues: []})),
      getWorklogsForIssue$: vi.fn()
    };
    const {facade} = createFacade(worklogApi);

    const emissions = await firstValueFrom(
      (facade as any).getWorklogsForDateRangeVerbose$(range, user).pipe(toArray())
    );

    expect(emissions).toEqual([[]]);
    expect(worklogApi.getWorklogsForIssue$).not.toHaveBeenCalled();
  });
  it("stops worklog pagination when Jira returns an empty page", async () => {
    const getWorklogs = vi.fn(() => of({startAt: 0, total: 10, worklogs: []}));
    const {facade} = createFacade({getWorklogsForIssue$: getWorklogs});

    const pages = await firstValueFrom(
      (facade as any).streamAllWorklogsForIssue$({id: "1"}).pipe(toArray())
    );

    expect(pages).toEqual([[]]);
    expect(getWorklogs).toHaveBeenCalledOnce();
  });

  it("does not refresh worklogs without an authenticated user", () => {
    const getIssues = vi.fn();
    const {facade} = createFacade({getIssuesForWorklogDateRange$: getIssues});

    facade.fetchWorklogsQuiet();

    expect(getIssues).not.toHaveBeenCalled();
  });
});
