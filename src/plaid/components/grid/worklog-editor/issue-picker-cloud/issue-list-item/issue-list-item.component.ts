import {Component, EventEmitter, Input, Output, OnInit} from '@angular/core';
import {Issue} from '../../../../../model/issue';
import {AuthFacade} from '../../../../../core/auth/auth.facade';

/**
 * An item on a list of issues in the issue picker. Presents issue details and favorite button, delegates selection of
 * the item and adding/removing favorite status.
 */
@Component({
    selector: 'plaid-issue-list-item',
    templateUrl: './issue-list-item.component.html',
    styleUrls: ['./issue-list-item.component.scss'],
    standalone: false
})
export class IssueListItemComponent implements OnInit {
  jiraURL: string;

  @Input()
  issue: Issue;

  @Output()
  issueSelected = new EventEmitter<void>();

  @Output()
  favoriteChange = new EventEmitter<boolean>();

  @Input()
  keyboardNavigationEnabled: boolean;

  constructor(private authFacade: AuthFacade) {
  }

    ngOnInit() {
    // Obtener la URL de Jira cuando el componente se inicializa
    this.jiraURL = this.authFacade.getJiraURL();
  }

  onIssueDetailsClick(event: MouseEvent) {
    // Verificar si el click fue en un elemento con plaidExtHref
    const target = event.target as HTMLElement;
    const linkElement = target.closest('[plaidExtHref]');
    
    if (linkElement) {
      // Si es un link externo, no emitir el evento issueSelected
      return;
    }
    
    // Si no es un link externo, emitir el evento para seleccionar la issue
    this.issueSelected.emit();
  }

  toggleFavorite(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.issue._favorite = !this.issue._favorite;
    this.favoriteChange.emit(this.issue._favorite);
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.keyboardNavigationEnabled && (event.key === ' ' || event.key === 'Enter')) {
      this.issueSelected.emit();
    }
  }

}
