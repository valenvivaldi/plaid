import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, OnChanges} from '@angular/core';
import {Issue} from '../../../model/issue';
import {Transition} from '../../../model/transition';
import {IssueFacade} from '../../../core/issue/issue.facade';

/**
 * Dumb component presenting the details of an issue for the worklog panel and issue selector.
 */
@Component({
    selector: 'plaid-issue-details',
    templateUrl: './issue-details.component.html',
    styleUrls: ['./issue-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class IssueDetailsComponent implements OnInit, OnChanges {
  @Input()
  jiraURL!: string;

  @Input()
  issue!: Issue;

  /**
   * When true, the status badge becomes clickable and opens a menu of available Jira transitions. Enabled only where
   * changing the status makes sense (the worklog grid), not in read-only contexts like the issue picker.
   */
  @Input()
  editableStatus = false;

  statusMenuOpen = false;
  loadingTransitions = false;
  applyingTransitionId: string | null = null;
  transitions: Transition[] = [];

  // Viewport coordinates for the fixed-position menu (so it escapes the panel's overflow: hidden).
  menuTop = 0;
  menuLeft = 0;
  private anchorRect: DOMRect | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private issueFacade: IssueFacade
  ) {}

  ngOnInit() {}

  ngOnChanges() {}

  /**
   * Builds the Jira "browse" URL for an issue key. Returns null when the Jira URL or key is missing, so that the
   * plaidExtHref directive stays inert (no pointer cursor, no navigation) instead of opening a broken link.
   */
  getIssueUrl(issueKey: string): string | null {
    return this.jiraURL && issueKey ? `${this.jiraURL}/browse/${issueKey}` : null;
  }

  getComponents(): string {
    return this.issue?.fields?.components?.map(c => c.name).join(', ') || '';
  }

  /**
   * Opens the status menu, lazily fetching the available transitions from Jira on each open so the list reflects the
   * issue's current state.
   */
  openStatusMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.loadingTransitions || this.statusMenuOpen || !this.issue?.key) {
      return;
    }
    this.anchorRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.loadingTransitions = true;
    this.cdr.markForCheck();
    const key = this.issue.key;
    this.issueFacade.getTransitions$(key).subscribe(transitions => {
      this.transitions = transitions;
      this.loadingTransitions = false;
      this.positionMenu();
      this.statusMenuOpen = true;
      this.cdr.markForCheck();
    });
  }

  closeStatusMenu(): void {
    this.statusMenuOpen = false;
    this.cdr.markForCheck();
  }

  /**
   * Applies the chosen transition. On success the displayed status is updated in place from the transition's target,
   * avoiding a refetch.
   */
  applyTransition(transition: Transition): void {
    if (this.applyingTransitionId || !this.issue?.key) {
      return;
    }
    this.applyingTransitionId = transition.id;
    this.cdr.markForCheck();
    this.issueFacade.transitionIssue$(this.issue.key, transition.id).subscribe(success => {
      if (success && transition.to && this.issue.fields) {
        this.issue.fields.status = {
          name: transition.to.name,
          statusCategory: transition.to.statusCategory
        };
      }
      this.applyingTransitionId = null;
      this.statusMenuOpen = false;
      this.cdr.markForCheck();
    });
  }

  /**
   * Positions the fixed menu below the status badge, flipping above it when there is not enough room downward.
   */
  private positionMenu(): void {
    const rect = this.anchorRect;
    if (!rect) {
      return;
    }
    const itemHeight = 28;
    const menuHeight = Math.max(1, this.transitions.length) * itemHeight + 8;
    const menuWidth = 200;
    this.menuLeft = Math.max(4, Math.min(rect.left, window.innerWidth - menuWidth - 4));
    if (window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight) {
      this.menuTop = rect.top - menuHeight - 2;
    } else {
      this.menuTop = rect.bottom + 2;
    }
  }
}
