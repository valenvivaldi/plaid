export interface AuthInfo {
  jiraUrl: string;
  username: string;
  password: string;
  method?: 'basic' | 'oauth';
}
