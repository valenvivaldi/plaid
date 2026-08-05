import {ChangeDetectionStrategy, Component, Input, EventEmitter, Output} from '@angular/core';
import {AuthInfo} from '../../../model/auth-info';
import {HttpErrorResponse} from '@angular/common/http';

/**
 * Dumb component, presents login modal and delegates actions to parent component.
 */
@Component({
    selector: 'plaid-login-modal',
    templateUrl: './login-modal.component.html',
    styleUrls: ['./login-modal.component.scss', '../connection-issue-resolver.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class LoginModalComponent {
  @Input() open: boolean;
  @Input() fetching: boolean;
  @Input() activeLoginMethod: 'oauth' | 'basic' | null = null;
  @Input() authInfo: AuthInfo;
  @Input() error: HttpErrorResponse;
  @Input() oauthError = '';
  @Input() oauthConfiguration = {configured: false, clientId: '', redirectUri: ''};
  @Output() login = new EventEmitter<void>();
  @Output() atlassianLogin = new EventEmitter<{clientId?: string; clientSecret?: string}>();
  @Output() closeModal = new EventEmitter<void>();

  httpNoticeVisible = false;
  oauthClientSecret = '';

  onUrlChange(): void {
    if (this.authInfo.jiraUrl && this.authInfo.jiraUrl.length > 0) {
      // Remove trailing slash
      if (this.authInfo.jiraUrl[this.authInfo.jiraUrl.length - 1] === '/') {
        this.authInfo.jiraUrl = this.authInfo.jiraUrl.substr(0, this.authInfo.jiraUrl.length - 1);
      }
      // Add protocol if missing
      if (this.authInfo.jiraUrl.substr(0, 7) !== 'http://' && this.authInfo.jiraUrl.substr(0, 8) !== 'https://') {
        this.authInfo.jiraUrl = 'https://' + this.authInfo.jiraUrl;
      }
      // Display http notice if applicable
      this.httpNoticeVisible = this.authInfo.jiraUrl.substr(0, 7) === 'http://';
    }
  }

  loginWithAtlassian(): void {
    this.onUrlChange();
    this.atlassianLogin.emit({
      clientId: this.oauthConfiguration.clientId,
      clientSecret: this.oauthClientSecret
    });
  }

  get oauthReady(): boolean {
    return Boolean(this.authInfo.jiraUrl && this.oauthConfiguration.clientId &&
      (this.oauthConfiguration.configured || this.oauthClientSecret));
  }
}
