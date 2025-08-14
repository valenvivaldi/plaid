import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Theme} from '../model/theme';
import {FavoriteKeys} from '../model/favorite-keys';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly WORKING_HOURS_START_MINUTES = 'WORKING_HOURS_START_MINUTES';
  private readonly WORKING_HOURS_END_MINUTES = 'WORKING_HOURS_END_MINUTES';
  private readonly WORKING_DAYS_START = 'WORKING_DAYS_START';
  private readonly WORKING_DAYS_END = 'WORKING_DAYS_END';
  private readonly HIDE_WEEKEND = 'HIDE_WEEKEND';
  private readonly REFRESH_INTERVAL = 'REFRESH_INTERVAL';
  private readonly THEME = 'THEME';
  private readonly DAYS_SHOWN = 'DAYS_SHOWN';
  private readonly SHOW_TODAY = 'SHOW_TODAY';
  private readonly FAVORITE_KEYS = 'FAVORITE_KEYS';

  private workingHoursStartMinutes: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem(this.WORKING_HOURS_START_MINUTES) || 540));
  private workingHoursEndMinutes: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem(this.WORKING_HOURS_END_MINUTES) || 1020));
  private workingDaysStart: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem(this.WORKING_DAYS_START) || 1));
  private workingDaysEnd: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem(this.WORKING_DAYS_END) || 5));
  private hideWeekend: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(localStorage.getItem(this.HIDE_WEEKEND) === '1');
  private visibleDaysStart: BehaviorSubject<number> = new BehaviorSubject<number>(
    localStorage.getItem(this.HIDE_WEEKEND) === '1' ? Number(localStorage.getItem(this.WORKING_DAYS_START) || 1) : 0
  );
  private visibleDaysEnd: BehaviorSubject<number> = new BehaviorSubject<number>(
    localStorage.getItem(this.HIDE_WEEKEND) === '1' ? Number(localStorage.getItem(this.WORKING_DAYS_END) || 5) : 6
  );
  private refreshIntervalMinutes: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem(this.REFRESH_INTERVAL) || 0));
  private theme: BehaviorSubject<Theme> =
    new BehaviorSubject<Theme>((localStorage.getItem(this.THEME) || 'system') as Theme);
  private showToday: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(localStorage.getItem(this.SHOW_TODAY) === '1');
  private favoriteKeys: BehaviorSubject<FavoriteKeys> =
    new BehaviorSubject<FavoriteKeys>((JSON.parse(localStorage.getItem(this.FAVORITE_KEYS) || '{}')) as FavoriteKeys);

  setWorkingHoursStartMinutes(value: number): void {
    this.workingHoursStartMinutes.next(value);
    localStorage.setItem(this.WORKING_HOURS_START_MINUTES, value.toString());
  }

  getWorkingHoursStartMinutes$(): Observable<number> {
    return this.workingHoursStartMinutes.asObservable();
  }

  setWorkingHoursEndMinutes(value: number): void {
    this.workingHoursEndMinutes.next(value);
    localStorage.setItem(this.WORKING_HOURS_END_MINUTES, value.toString());
  }

  getWorkingHoursEndMinutes$(): Observable<number> {
    return this.workingHoursEndMinutes.asObservable();
  }

  setWorkingDaysStart(value: number): void {
    this.workingDaysStart.next(value);
    if (this.showToday.getValue()) {
      // When showToday is true, update visible days to reflect the single day
      const singleDay = this.getVisibleDaysStartForShowToday();
      this.visibleDaysStart.next(singleDay);
      this.visibleDaysEnd.next(singleDay);
    } else if (this.hideWeekend.getValue()) {
      this.visibleDaysStart.next(value);
    }
    localStorage.setItem(this.WORKING_DAYS_START, value.toString());
  }

  getWorkingDaysStart$(): Observable<number> {
    return this.workingDaysStart.asObservable();
  }

  getVisibleDaysStart(): number {
    if (this.showToday.getValue()) {
      return this.getVisibleDaysStartForShowToday();
    }
    return this.visibleDaysStart.getValue();
  }

  getVisibleDaysStart$(): Observable<number> {
    return this.visibleDaysStart.asObservable();
  }

  setWorkingDaysEnd(value: number): void {
    this.workingDaysEnd.next(value);
    if (this.showToday.getValue()) {
      // When showToday is true, update visible days to reflect the single day
      const singleDay = this.getVisibleDaysStartForShowToday();
      this.visibleDaysStart.next(singleDay);
      this.visibleDaysEnd.next(singleDay);
    } else if (this.hideWeekend.getValue()) {
      this.visibleDaysEnd.next(value);
    }
    localStorage.setItem(this.WORKING_DAYS_END, value.toString());
  }

  getWorkingDaysEnd$(): Observable<number> {
    return this.workingDaysEnd.asObservable();
  }

  getVisibleDaysEnd(): number {
    if (this.showToday.getValue()) {
      return this.getVisibleDaysEndForShowToday();
    }
    return this.visibleDaysEnd.getValue();
  }

  getVisibleDaysEnd$(): Observable<number> {
    return this.visibleDaysEnd.asObservable();
  }

  setHideWeekend(value: boolean): void {
    this.hideWeekend.next(value);
    if (this.showToday.getValue()) {
      // When showToday is true, update visible days to reflect the single day
      const singleDay = this.getVisibleDaysStartForShowToday();
      this.visibleDaysStart.next(singleDay);
      this.visibleDaysEnd.next(singleDay);
    } else {
      if (this.workingDaysStart.getValue() !== 0) {
        this.visibleDaysStart.next(value ? this.workingDaysStart.getValue() : 0);
      }
      if (this.workingDaysEnd.getValue() !== 6) {
        this.visibleDaysEnd.next(value ? this.workingDaysEnd.getValue() : 6);
      }
    }
    localStorage.setItem(this.HIDE_WEEKEND, value ? '1' : '0');
  }

  getHideWeekend$(): Observable<boolean> {
    return this.hideWeekend.asObservable();
  }

  getRefreshIntervalMinutes$(): Observable<number> {
    return this.refreshIntervalMinutes.asObservable();
  }

  setRefreshIntervalMinutes(value: number): void {
    this.refreshIntervalMinutes.next(value);
    localStorage.setItem(this.REFRESH_INTERVAL, value.toString());
  }

  getTheme$(): Observable<Theme> {
    return this.theme.asObservable();
  }

  setTheme(value: Theme): void {
    this.theme.next(value);
    localStorage.setItem(this.THEME, value);
  }

  getShowToday$(): Observable<boolean> {
    return this.showToday.asObservable();
  }

  setShowToday(value: boolean): void {
    this.showToday.next(value);
    localStorage.setItem(this.SHOW_TODAY, value.toString());
    
    // When showToday changes, we need to update the visible days
    // This will trigger the AppStateService to recalculate the date range
    if (value) {
      // When enabling showToday, update visible days to reflect the single day
      const singleDay = this.getVisibleDaysStartForShowToday();
      this.visibleDaysStart.next(singleDay);
      this.visibleDaysEnd.next(singleDay);
    } else {
      // When disabling showToday, restore normal visible days based on hideWeekend
      if (this.hideWeekend.getValue()) {
        this.visibleDaysStart.next(this.workingDaysStart.getValue());
        this.visibleDaysEnd.next(this.workingDaysEnd.getValue());
      } else {
        this.visibleDaysStart.next(0);
        this.visibleDaysEnd.next(6);
      }
    }
  }

  getFavoriteKeys$(): Observable<FavoriteKeys> {
    return this.favoriteKeys.asObservable();
  }

  setFavoriteKeys(value: FavoriteKeys): void {
    this.favoriteKeys.next(value);
    localStorage.setItem(this.FAVORITE_KEYS, JSON.stringify(value));
  }

  private getVisibleDaysStartForShowToday(): number {
    const today = new Date().getDay();
    const workingDaysStart = this.workingDaysStart.getValue();
    const workingDaysEnd = this.workingDaysEnd.getValue();
    
    // If today is a working day, return today
    if (today >= workingDaysStart && today <= workingDaysEnd) {
      return today;
    }
    
    // If today is not a working day, find the next working day
    let nextWorkingDay = today;
    while (nextWorkingDay < workingDaysStart || nextWorkingDay > workingDaysEnd) {
      nextWorkingDay = (nextWorkingDay + 1) % 7;
    }
    return nextWorkingDay;
  }

  private getVisibleDaysEndForShowToday(): number {
    // When showToday is true, start and end should be the same day
    return this.getVisibleDaysStartForShowToday();
  }
}
