import '@angular/compiler';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {BehaviorSubject, firstValueFrom, of} from 'rxjs';
import {QuickLogService} from './quick-log.service';
import {User} from '../model/user';

describe('QuickLogService', () => {
  const currentUser = {accountId: 'account-1', displayName: 'Test User'} as User;
  let taskCode$: BehaviorSubject<string>;
  let addWorklog$: ReturnType<typeof vi.fn>;
  let storage: Map<string, string>;

  beforeEach(() => {
    taskCode$ = new BehaviorSubject('PLAID-123');
    addWorklog$ = vi.fn(() => of({id: 'worklog-1'}));
    storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear()
    });
  });

  function createService(): QuickLogService {
    const worklogFacade = {addWorklog$};
    const authFacade = {getAuthenticatedUser$: () => of(currentUser)};
    const preferences = {
      getQuickLogNextDayTaskCode$: () => taskCode$,
      getQuickLogProblemsTaskCode$: () => taskCode$,
      getQuickLogTimeMinutes$: () => of(9 * 60),
      getQuickLogNextDayMessage$: () => of('Next day'),
      getQuickLogProblemsMessage$: () => of('Problems'),
      getQuickLogNextDayEnabled$: () => of(true),
      getQuickLogProblemsEnabled$: () => of(true),
      setQuickLogNextDayMessage: vi.fn(),
      setQuickLogProblemsMessage: vi.fn(),
      setQuickLogNextDayEnabled: vi.fn(),
      setQuickLogProblemsEnabled: vi.fn()
    };

    return new QuickLogService(worklogFacade as never, authFacade as never, preferences as never);
  }

  it('creates a worklog against the configured Jira issue', async () => {
    const service = createService();

    await firstValueFrom(service.createQuickLog('Daily note', 'next-day-tasks'));

    expect(addWorklog$).toHaveBeenCalledOnce();
    const [worklog, started, duration, comment] = addWorklog$.mock.calls[0];
    expect(worklog.issueId).toBe('PLAID-123');
    expect(started).toBeInstanceOf(Date);
    expect(started.getHours()).toBe(9);
    expect(duration).toBe(60);
    expect(comment).toBe('Daily note');
    expect(storage.get('NEXT_DAY_TASKS_LOGGED_TODAY')).toBe(new Date().toDateString());
  });

  it('rejects an invalid issue key without sending a worklog', async () => {
    taskCode$.next('not-an-issue');
    const service = createService();

    await expect(firstValueFrom(service.createQuickLog('Daily note', 'problems')))
      .rejects.toThrow('Configure a valid Jira issue key');
    expect(addWorklog$).not.toHaveBeenCalled();
  });
});
