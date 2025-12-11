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
  styleUrls: ['./issue-list-item.component.scss']
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
    console.log('===== IssueListItemComponent: INICIALIZACIÓN =====');
    console.log('IssueListItemComponent: Jira URL obtenida:', this.jiraURL);
    console.log('IssueListItemComponent: Issue key:', this.issue?.key);
    console.log('===== FIN INICIALIZACIÓN =====');
  }

  onIssueDetailsClick(event: MouseEvent) {
    console.log('===== IssueListItemComponent: CLICK DETECTADO =====');
    console.log('IssueListItemComponent: event.target:', event.target);
    console.log('IssueListItemComponent: event.currentTarget:', event.currentTarget);
    
    // Verificar si el click fue en un elemento con plaidExtHref
    const target = event.target as HTMLElement;
    console.log('IssueListItemComponent: target.tagName:', target.tagName);
    console.log('IssueListItemComponent: target.className:', target.className);
    
    const linkElement = target.closest('[plaidExtHref]');
    console.log('IssueListItemComponent: linkElement encontrado:', linkElement);
    
    if (linkElement) {
      console.log('IssueListItemComponent: ✅ Click en link externo, no emitiendo issueSelected');
      const href = linkElement.getAttribute('plaidExtHref');
      console.log('IssueListItemComponent: href del elemento:', href);
      // Si es un link externo, no emitir el evento issueSelected
      return;
    }
    
    console.log('IssueListItemComponent: ⚠️ Click normal, emitiendo issueSelected');
    // Si no es un link externo, emitir el evento para seleccionar la issue
    this.issueSelected.emit();
    console.log('===== FIN CLICK =====');
  }

  toggleFavorite(): void {
    this.issue._favorite = !this.issue._favorite;
    this.favoriteChange.emit(this.issue._favorite);
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.keyboardNavigationEnabled && (event.key === ' ' || event.key === 'Enter')) {
      this.issueSelected.emit();
    }
  }

}
