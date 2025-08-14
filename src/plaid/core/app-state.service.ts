import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {ConnectionIssueModalVisible} from '../components/connection-issue-resolver/connection-issue-modal-visible';
import {DateRange} from '../model/date-range';
import {UserPreferencesService} from './user-preferences.service';

@Injectable({ providedIn: 'root' })
export class AppStateService implements OnDestroy {
  private connectionIssueModalVisible: BehaviorSubject<ConnectionIssueModalVisible> =
    new BehaviorSubject<ConnectionIssueModalVisible>(ConnectionIssueModalVisible.NONE);
  private visibleDateRange: BehaviorSubject<DateRange> =
    new BehaviorSubject<DateRange>(this.getInitialVisibleDateRange());
  private showTodaySubscription: Subscription;
  private currentShowToday: boolean = localStorage.getItem('SHOW_TODAY') === '1';

  constructor(private userPrefsService: UserPreferencesService) {
    // Listen to showToday changes and recalculate visible date range
    this.showTodaySubscription = this.userPrefsService.getShowToday$().subscribe(showToday => {
      this.currentShowToday = showToday;
      this.updateVisibleDateRange(showToday);
    });
  }

  ngOnDestroy(): void {
    if (this.showTodaySubscription) {
      this.showTodaySubscription.unsubscribe();
    }
  }

  private getInitialVisibleDateRange(): DateRange {
    return this.calculateVisibleDateRange(this.currentShowToday);
  }

  private calculateVisibleDateRange(showToday: boolean): DateRange {
    const curTime: Date = new Date();
    
    if (showToday) {
      // Show only today, but respect working days settings
      const today = curTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const workingDaysStart = this.userPrefsService.getVisibleDaysStart();
      const workingDaysEnd = this.userPrefsService.getVisibleDaysEnd();
      
      // Check if today is within the working days range
      if (today >= workingDaysStart && today <= workingDaysEnd) {
        // Today is a working day, show only today
        const todayStart = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
        const todayEnd = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
        return { start: todayStart, end: todayEnd };
      } else {
        // Today is not a working day, find the next working day
        let nextWorkingDay = new Date(curTime);
        while (nextWorkingDay.getDay() < workingDaysStart || nextWorkingDay.getDay() > workingDaysEnd) {
          nextWorkingDay.setDate(nextWorkingDay.getDate() + 1);
        }
        const dayStart = new Date(nextWorkingDay.getFullYear(), nextWorkingDay.getMonth(), nextWorkingDay.getDate());
        const dayEnd = new Date(nextWorkingDay.getFullYear(), nextWorkingDay.getMonth(), nextWorkingDay.getDate());
        return { start: dayStart, end: dayEnd };
      }
    } else {
      // Show full week range
      const weekStart: Date = new Date(
        curTime.getFullYear(),
        curTime.getMonth(),
        curTime.getDate() - curTime.getDay() + this.userPrefsService.getVisibleDaysStart()
      );
      const weekEnd: Date = new Date(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        weekStart.getDate() + this.userPrefsService.getVisibleDaysEnd() - this.userPrefsService.getVisibleDaysStart()
      );
      return { start: weekStart, end: weekEnd };
    }
  }

  private updateVisibleDateRange(showToday: boolean): void {
    const newDateRange = this.calculateVisibleDateRange(showToday);
    this.visibleDateRange.next(newDateRange);
  }

  setConnectionIssueModalVisible(visible: ConnectionIssueModalVisible): void {
    this.connectionIssueModalVisible.next(visible);
  }

  getConnectionIssueModalVisible$(): Observable<ConnectionIssueModalVisible> {
    return this.connectionIssueModalVisible.asObservable();
  }

  setVisibleDateRange(range: DateRange): void {
    // If showToday is enabled, only allow single-day ranges
    if (this.currentShowToday) {
      // Calculate the correct single-day range based on current showToday logic
      const newDateRange = this.calculateVisibleDateRange(true);
      this.visibleDateRange.next(newDateRange);
    } else {
      // Normal behavior when showToday is false
      this.visibleDateRange.next(range);
    }
  }

  getVisibleDateRange$(): Observable<DateRange> {
    return this.visibleDateRange.asObservable();
  }
}
