export interface User {
  accountId?: string;
  self?: string;
  key?: string;
  emailAddress?: string;
  avatarUrls?: {[key: string]: string};
  displayName?: string;
  active?: boolean;
  timeZone?: string;
}
