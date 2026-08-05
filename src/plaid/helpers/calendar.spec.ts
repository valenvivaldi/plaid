import {afterAll, describe, expect, it} from 'vitest';
import {Calendar} from './calendar';

describe('Calendar.getStartOfNextDay', () => {
  const originalTimezone = process.env.TZ;

  afterAll(() => {
    process.env.TZ = originalTimezone;
  });

  it('uses the next local midnight across a daylight-saving boundary', () => {
    process.env.TZ = 'America/New_York';
    const start = new Date(2025, 2, 9, 0, 0, 0);
    const next = Calendar.getStartOfNextDay(start);

    expect(next.getDate()).toBe(10);
    expect(next.getHours()).toBe(0);
    expect(next.getTime() - start.getTime()).toBe(23 * 60 * 60 * 1000);
  });
});
