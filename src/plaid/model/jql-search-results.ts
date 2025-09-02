import {Issue} from './issue';

export interface JqlSearchResults {
  isLast?: boolean;
  issues?: Issue[];
  warningMessages?: string[];
  names?: {};
  schema?: {};
}
