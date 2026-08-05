import {beforeEach, describe, expect, it, vi} from 'vitest';
import {of} from 'rxjs';
import {AppStateService} from './app-state.service';

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
});
