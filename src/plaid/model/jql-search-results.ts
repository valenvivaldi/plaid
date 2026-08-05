import {Issue} from './issue';

export interface JqlSearchResults {
  isLast?: boolean;
  nextPageToken?: string;
  issues?: Issue[];
  warningMessages?: string[];
  names?: {};
  schema?: {};
}
