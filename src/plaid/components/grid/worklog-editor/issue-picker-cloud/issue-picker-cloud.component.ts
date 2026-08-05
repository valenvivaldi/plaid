import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {Issue} from '../../../../model/issue';
import {Observable, Subject} from 'rxjs';
import {IssueFacade} from '../../../../core/issue/issue.facade';
import {debounceTime, switchMap, tap} from 'rxjs/operators';

/**
 * Presents a dropdown listing recent and favorite issues, searches through all issues, gives ability to add and remove
 * favorite issues, delegates selected issue to parent component.
 */
@Component({
    selector: 'plaid-issue-picker-cloud',
    templateUrl: './issue-picker-cloud.component.html',
    styleUrls: ['./issue-picker-cloud.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class IssuePickerCloudComponent implements OnInit {
  private _open = false;
  searchInputSubject = new Subject<string>();
  searchResults: Issue[] = [];
  favorites: Issue[] = [];
  suggestions: Issue[] = [];
  searching = false;

  @ViewChild('searchInput', {static: true})
  searchInput: ElementRef<HTMLInputElement>;

  @Input()
  set open(open: boolean) {
    this._open = open;
    if (open) {
      setTimeout(() => this.searchInput.nativeElement.focus());
    } else {
      this.searchInput.nativeElement.value = '';
      this.searchResults = [];
    }
  }
  get open(): boolean {
    return this._open;
  }

  @Output()
  openChange = new EventEmitter<boolean>();

  @Output()
  issueChange = new EventEmitter<Issue>();

  @Input()
  updateFavoritesAndSuggestionsAndEmitSuggestion: Observable<void>;

  /**
   * Whether keyboard navigation should be disabled due to modal or another cloud being open.
   */
  @Input()
  keysDisabled: boolean;

  /**
   * Username (assignee) to filter issues by. If empty, shows current user's issues.
   */
  @Input()
  assignee: string;

  /**
   * Whether to auto-select the first suggestion. Default is true for backward compatibility.
   * Set to false when you want manual selection only (e.g., in multi-select scenarios).
   */
  @Input()
  autoSelectFirstSuggestion = true;

  constructor(private issueFacade: IssueFacade, private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.searchInputSubject.pipe(
      debounceTime(250),
      tap(() => {
        this.searching = true;
        this.cdr.detectChanges();
      }),
      switchMap(s => this.issueFacade.quickSearch$(s, this.assignee))
    ).subscribe(res => {
      this.searching = false;
      if (this.searchInput.nativeElement.value) {
        this.searchResults = res;
      }
      this.cdr.detectChanges();
    });

    if (this.updateFavoritesAndSuggestionsAndEmitSuggestion != null) {
      this.updateFavoritesAndSuggestionsAndEmitSuggestion.subscribe(() => {
        // ensure @Input() assignee has been updated by Angular change detection
        // before we call facade.fetchFavoritesAndSuggestions
        setTimeout(() => {
          this.issueFacade.fetchFavoritesAndSuggestions(this.assignee);
        }, 0);
      });
    }

    this.issueFacade.getFavorites$().subscribe(favorites => {
      this.favorites = favorites;
      this.cdr.detectChanges();
    });
    this.issueFacade.getSuggestions$().subscribe(suggestions => {
      this.suggestions = suggestions;
      if (this.autoSelectFirstSuggestion) {
        if (suggestions.length > 0) {
          this.issueChange.emit(suggestions[0]);
        } else {
          this.issueChange.emit(undefined);
        }
      }
      this.cdr.detectChanges();
    });

    // Trigger initial fetch for current assignee to populate suggestions/favorites on mount
    setTimeout(() => {
      this.issueFacade.fetchFavoritesAndSuggestions(this.assignee);
    }, 0);
  }

  inputSearch(query: string): void {
    if (query) {
      this.searchInputSubject.next(query);
    } else {
      this.searching = false;
      this.searchResults = [];
    }
  }

  issueSelected(issue: Issue): void {
    this._open = false;
    this.openChange.emit(false);
    this.issueChange.emit(issue);
    this.searchResults = [];
    this.searchInput.nativeElement.value = '';
  }

  favoriteChange(issue: Issue, favorite: boolean): void {
    if (favorite) {
      this.issueFacade.addFavorite(issue);
    } else {
      this.issueFacade.removeFavorite(issue);
    }
  }

  get suggestionsWithoutFavorites(): Issue[] {
    return this.suggestions.filter(issue => !this.favorites.find(favorite => favorite.key === issue.key));
  }

  get suggestionsToShow(): Issue[] {
    // Show all suggestions (including favorites) organized by status
    // Favorites will appear both in "Favorites" section and in their status section
    return this.suggestions;
  }

  /**
   * Groups suggestions by status for organized display
   */
  get suggestionsByStatus(): { status: string; statusOrder: number; issues: Issue[] }[] {
    const toShow = this.suggestionsToShow;
    
    // Define status priority order (like Jira's workflow)
    // Using case-insensitive matching for flexibility
    const statusPriority: { [key: string]: number } = {
      'IN REVIEW': 1,
      'IN PROGRESS': 2,
      'QA': 3,
      'BLOCKED': 4,
      'TO DO': 5,
      'BACKLOG': 6,
      "WON'T FIX": 7
    };

    // Group issues by status
    const grouped = new Map<string, Issue[]>();
    toShow.forEach(issue => {
      const status = issue.fields?.status?.name || 'NO STATUS';
      if (!grouped.has(status)) {
        grouped.set(status, []);
      }
      grouped.get(status)!.push(issue);
    });

    // Convert to array and sort by status priority
    const result = Array.from(grouped.entries()).map(([status, issues]) => {
      const normalizedStatus = status.toUpperCase();
      return {
        status,
        statusOrder: statusPriority[normalizedStatus] || 999,
        issues
      };
    });

    // Sort groups by priority, then alphabetically for unlisted statuses
    result.sort((a, b) => {
      if (a.statusOrder !== b.statusOrder) {
        return a.statusOrder - b.statusOrder;
      }
      return a.status.localeCompare(b.status);
    });

    return result;
  }

}
