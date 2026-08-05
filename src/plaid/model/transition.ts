/**
 * A Jira workflow transition available for an issue, as returned by GET /rest/api/3/issue/{key}/transitions.
 */
export interface Transition {
  id: string;
  name: string;
  /** Target status the issue moves to when this transition is applied. */
  to?: {
    name: string;
    statusCategory?: {
      colorName: string;
    };
  };
}
