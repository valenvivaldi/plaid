import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { QuickLogService, QuickLogConfig } from '../../../core/quick-log.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'plaid-quick-log-buttons',
    templateUrl: './quick-log-buttons.component.html',
    styleUrls: ['./quick-log-buttons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class QuickLogButtonsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  config: QuickLogConfig = {
    nextDayTasksDefaultMessage: '',
    problemsDefaultMessage: '',
    nextDayTasksEnabled: true,
    problemsEnabled: true
  };
  
  nextDayTasksLogged = false;
  problemsLogged = false;
  nextDayTasksError = '';
  problemsError = '';
  
  // Modal states
  showNextDayTasksModal = false;
  showProblemsModal = false;

  constructor(
    private quickLogService: QuickLogService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to configuration
    this.quickLogService.getConfig$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.config = config;
        this.cdr.detectChanges();
      });

    // Subscribe to next day tasks logging status
    this.quickLogService.getNextDayTasksLoggedToday$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(logged => {
        this.nextDayTasksLogged = logged;
        this.cdr.detectChanges();
      });

    // Subscribe to problems logging status
    this.quickLogService.getProblemsLoggedToday$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(logged => {
        this.problemsLogged = logged;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openNextDayTasksModal(): void {
    if (this.config.nextDayTasksEnabled) {
      this.nextDayTasksError = '';
      this.showNextDayTasksModal = true;
    }
  }

  openProblemsModal(): void {
    if (this.config.problemsEnabled) {
      this.problemsError = '';
      this.showProblemsModal = true;
    }
  }

  closeNextDayTasksModal(): void {
    this.nextDayTasksError = '';
    this.showNextDayTasksModal = false;
    this.cdr.detectChanges();
  }

  closeProblemsModal(): void {
    this.problemsError = '';
    this.showProblemsModal = false;
    this.cdr.detectChanges();
  }

  onNextDayTasksSubmit(message: string): void {
    this.nextDayTasksError = '';
    this.quickLogService.createQuickLog(message, 'next-day-tasks').subscribe({
      next: () => this.closeNextDayTasksModal(),
      error: error => {
        this.nextDayTasksError = error instanceof Error ? error.message : 'Could not create the Quick Log. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  onProblemsSubmit(message: string): void {
    this.problemsError = '';
    this.quickLogService.createQuickLog(message, 'problems').subscribe({
      next: () => this.closeProblemsModal(),
      error: error => {
        this.problemsError = error instanceof Error ? error.message : 'Could not create the Quick Log. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }
}
