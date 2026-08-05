import '@angular/compiler';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {firstValueFrom, of} from 'rxjs';
import {HttpErrorResponse, HttpRequest} from '@angular/common/http';
import {AppStateService} from './app-state.service';
import {AuthInterceptor} from './auth/auth.interceptor';

describe('AppStateService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => '0',
      setItem: vi.fn()
    });
  });

  it('initializes its date range after preferences are injected', () => {
    const preferences = {
      getShowToday$: () => of(false),
      getVisibleDaysStart: () => 1,
      getVisibleDaysEnd: () => 5
    };

    const service = new AppStateService(preferences as never);
    let range;
    const subscription = service.getVisibleDateRange$().subscribe(value => range = value);

    expect(range).toBeDefined();
    expect(range.start.getDay()).toBe(1);
    expect(range.end.getDay()).toBe(5);
    subscription.unsubscribe();
    service.ngOnDestroy();
  });
  it("propagates Jira 403 errors without waiting for a new login", async () => {
    const authState = {setError: vi.fn()};
    const interceptor = new AuthInterceptor(authState as any, {} as any);
    const error = new HttpErrorResponse({status: 403, error: {message: "Forbidden"}});
    const request = new HttpRequest("POST", "/rest/api/3/issue/ISSUE-1/transitions");

    const result = (interceptor as any).handleError(request, {} as any, error);

    await expect(firstValueFrom(result)).rejects.toBe(error);
    expect(authState.setError).toHaveBeenCalledWith(error);
  });
});
