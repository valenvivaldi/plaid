import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, throwError } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { WorklogFacade } from './worklog/worklog.facade';
import { AuthFacade } from './auth/auth.facade';
import { UserPreferencesService } from './user-preferences.service';
import { Worklog } from '../model/worklog';

export interface QuickLogConfig {
  nextDayTasksDefaultMessage: string;
  problemsDefaultMessage: string;
  nextDayTasksEnabled: boolean;
  problemsEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class QuickLogService {
  private readonly NEXT_DAY_TASKS_LOGGED_TODAY = 'NEXT_DAY_TASKS_LOGGED_TODAY';
  private readonly PROBLEMS_LOGGED_TODAY = 'PROBLEMS_LOGGED_TODAY';

  private nextDayTasksLoggedToday: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private problemsLoggedToday: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private worklogFacade: WorklogFacade,
    private authFacade: AuthFacade,
    private userPreferencesService: UserPreferencesService
  ) {
    this.checkTodayStatus();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => this.checkTodayStatus());
    }
  }

  getConfig$(): Observable<QuickLogConfig> {
    return combineLatest([
      this.userPreferencesService.getQuickLogNextDayMessage$(),
      this.userPreferencesService.getQuickLogProblemsMessage$(),
      this.userPreferencesService.getQuickLogNextDayEnabled$(),
      this.userPreferencesService.getQuickLogProblemsEnabled$()
    ]).pipe(
      map(([nextDayTasksDefaultMessage, problemsDefaultMessage, nextDayTasksEnabled, problemsEnabled]) => ({
        nextDayTasksDefaultMessage,
        problemsDefaultMessage,
        nextDayTasksEnabled,
        problemsEnabled
      }))
    );
  }

  getNextDayTasksLoggedToday$(): Observable<boolean> {
    return this.nextDayTasksLoggedToday.asObservable();
  }

  getProblemsLoggedToday$(): Observable<boolean> {
    return this.problemsLoggedToday.asObservable();
  }

  updateConfig(newConfig: Partial<QuickLogConfig>): void {
    if (newConfig.nextDayTasksDefaultMessage !== undefined) {
      this.userPreferencesService.setQuickLogNextDayMessage(newConfig.nextDayTasksDefaultMessage);
    }
    if (newConfig.problemsDefaultMessage !== undefined) {
      this.userPreferencesService.setQuickLogProblemsMessage(newConfig.problemsDefaultMessage);
    }
    if (newConfig.nextDayTasksEnabled !== undefined) {
      this.userPreferencesService.setQuickLogNextDayEnabled(newConfig.nextDayTasksEnabled);
    }
    if (newConfig.problemsEnabled !== undefined) {
      this.userPreferencesService.setQuickLogProblemsEnabled(newConfig.problemsEnabled);
    }
  }

  private checkTodayStatus(): void {
    const today = new Date().toDateString();
    const lastNextDayTasksDate = localStorage.getItem(this.NEXT_DAY_TASKS_LOGGED_TODAY);
    const lastProblemsDate = localStorage.getItem(this.PROBLEMS_LOGGED_TODAY);

    this.nextDayTasksLoggedToday.next(lastNextDayTasksDate === today);
    this.problemsLoggedToday.next(lastProblemsDate === today);
  }

  markNextDayTasksAsLogged(): void {
    const today = new Date().toDateString();
    localStorage.setItem(this.NEXT_DAY_TASKS_LOGGED_TODAY, today);
    this.nextDayTasksLoggedToday.next(true);
  }

  markProblemsAsLogged(): void {
    const today = new Date().toDateString();
    localStorage.setItem(this.PROBLEMS_LOGGED_TODAY, today);
    this.problemsLoggedToday.next(true);
  }

  createQuickLog(comment: string, type: 'next-day-tasks' | 'problems'): Observable<void> {
    const taskCode$ = type === 'next-day-tasks'
      ? this.userPreferencesService.getQuickLogNextDayTaskCode$()
      : this.userPreferencesService.getQuickLogProblemsTaskCode$();

    return combineLatest([
      this.authFacade.getAuthenticatedUser$(),
      taskCode$,
      this.userPreferencesService.getQuickLogTimeMinutes$()
    ]).pipe(
      take(1),
      switchMap(([currentUser, taskCode, quickLogTimeMinutes]) => {
        if (!currentUser) {
          return throwError(() => new Error('User not authenticated'));
        }

        const issueKey = taskCode?.trim();
        if (!issueKey || !/^[A-Za-z][A-Za-z0-9_]*-[1-9][0-9]*$/.test(issueKey)) {
          return throwError(() => new Error('Configure a valid Jira issue key before using Quick Log'));
        }

        const started = new Date();
        started.setHours(Math.floor(quickLogTimeMinutes / 60), quickLogTimeMinutes % 60, 0, 0);
        const worklog: Worklog = {
          comment,
          started: started.toISOString(),
          timeSpentSeconds: 60,
          author: currentUser,
          issueId: issueKey,
          issue: {
            key: issueKey,
            fields: {
              summary: type === 'next-day-tasks' ? 'Next day tasks tracking' : 'Problems tracking'
            }
          }
        };

        return this.worklogFacade.addWorklog$(worklog, started, 60, comment).pipe(
          tap(() => {
            if (type === 'next-day-tasks') {
              this.markNextDayTasksAsLogged();
            } else {
              this.markProblemsAsLogged();
            }
          }),
          map(() => undefined)
        );
      })
    );
  }
}
