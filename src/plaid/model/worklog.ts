import {User} from './user';
import {Issue} from './issue';

// ADF (Atlassian Document Format) for comments in v3 API
export interface AdfDocument {
  type: 'doc';
  version: 1;
  content: AdfContent[];
}

export interface AdfContent {
  type: string;
  text?: string;
  content?: AdfContent[];
  attrs?: Record<string, unknown>;
  marks?: Array<{type: string; attrs?: Record<string, unknown>}>;
}

export interface Worklog {
  self?: string;
  author?: User;
  updateAuthor?: User;
  comment?: string | AdfDocument; // Support both string (v2) and ADF (v3)
  created?: string;
  updated?: string;
  visibility?: any;
  started?: string | number;
  timeSpent?: string;
  timeSpentSeconds?: number;
  id?: string;
  issueId?: string;
  issue?: Issue;

  _column?: number;
  _columns?: number;
  _deleting?: boolean;
}
