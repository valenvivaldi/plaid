import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';

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

  get applicationErrorBody(): string {
    const body = this.error?.error ?? null;
    return typeof body === "string" ? body : JSON.stringify(body, null, 2);
  }
}
