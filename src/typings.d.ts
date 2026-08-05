export {};

interface PlaidAuthInfo {
  jiraUrl: string;
  username: string;
  password: string;
  method?: 'basic' | 'oauth';
}

interface PlaidJiraRequest {
  url: string;
  method: string;
  body?: unknown;
}

interface PlaidJiraResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
}

declare global {
  interface Window {
    plaid?: {
      isElectron: boolean;
      openExternal(url: string): Promise<void>;
      request(request: PlaidJiraRequest): Promise<PlaidJiraResponse>;
      auth: {
        getProfile(): PlaidAuthInfo | null;
        set(authInfo: PlaidAuthInfo): PlaidAuthInfo;
        clear(): null;
      };
      oauth: {
        getConfiguration(): {configured: boolean; clientId: string; redirectUri: string};
        login(options: {jiraUrl: string; clientId?: string; clientSecret?: string}): Promise<PlaidAuthInfo>;
      };
      theme: {
        getShouldUseDarkColors(): boolean;
        setSource(source: 'system' | 'light' | 'dark'): void;
        onUpdated(callback: (darkMode: boolean) => void): () => void;
      };
    };
  }
}
