import { Injectable } from '@angular/core';

import {AuthInfo} from '../../model/auth-info';

import {Theme} from '../../model/theme';
@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  get isElectron(): boolean {
    return window.plaid?.isElectron === true;
  }

  openExternal(url: string): void {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return;
    }
    if (window.plaid) {
      void window.plaid.openExternal(parsed.href);
    } else {
      window.open(parsed.href, '_blank', 'noopener,noreferrer');
    }
  }

  request(request: {url: string; method: string; body?: unknown}): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
  }> {
    if (!window.plaid) {
      return Promise.reject(new Error('Electron bridge is unavailable'));
    }
    return window.plaid.request(request);
  }

  getSavedAuthInfo(): AuthInfo | null {
    return window.plaid?.auth.getProfile() || null;
  }

  setAuthInfo(authInfo: AuthInfo): AuthInfo {
    return window.plaid?.auth.set(authInfo) || authInfo;
  }

  clearAuthInfo(): void {
    window.plaid?.auth.clear();
  }

  getOauthConfiguration(): {configured: boolean; clientId: string; redirectUri: string} {
    return window.plaid?.oauth.getConfiguration() || {
      configured: false, clientId: '', redirectUri: 'http://127.0.0.1:43817/oauth/callback'
    };
  }

  loginWithAtlassian(options: {jiraUrl: string; clientId?: string; clientSecret?: string}): Promise<AuthInfo> {
    return window.plaid?.oauth.login(options) ||
      Promise.reject(new Error('Atlassian browser login is only available in the desktop app'));
  }

  getSystemDarkMode(): boolean {
    return window.plaid?.theme.getShouldUseDarkColors() || false;
  }

  setThemeSource(theme: Theme): void {
    window.plaid?.theme.setSource(theme);
  }

  onSystemThemeUpdated(callback: (darkMode: boolean) => void): () => void {
    return window.plaid?.theme.onUpdated(callback) || (() => undefined);
  }
}
