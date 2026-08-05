import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

/**
 * Dumb component, presents error modal and delegates actions to parent component.
 */
@Component({
    selector: 'plaid-error-modal',
    templateUrl: './error-modal.component.html',
    styleUrls: ['../connection-issue-resolver.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ErrorModalComponent {
  @Input() open: boolean;
  @Input() error: HttpErrorResponse;
  @Output() errorChange = new EventEmitter<HttpErrorResponse>();
  @Output() closeModal = new EventEmitter<void>();

  constructor(private sanitizer: DomSanitizer) {}

  get applicationErrorBody(): string {
    return JSON.stringify(this.error && this.error.error ? this.error.error : null);
  }

  get isHtmlError(): boolean {
    if (!this.error || !this.error.error) {
      return false;
    }
    const errorBody = this.error.error;
    return typeof errorBody === 'string' && (errorBody.trim().startsWith('<!DOCTYPE') || errorBody.trim().startsWith('<html'));
  }

  get sanitizedHtmlError(): SafeHtml {
    if (this.isHtmlError && typeof this.error.error === 'string') {
      // Usamos bypassSecurityTrustHtml porque el HTML viene de Jira/Atlassian (fuente confiable)
      return this.sanitizer.bypassSecurityTrustHtml(this.error.error);
    }
    return '';
  }
}
