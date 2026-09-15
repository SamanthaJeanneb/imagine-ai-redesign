/**
 * The signed-in workspace: who the account belongs to, and who is already in
 * the organization being joined. Built by `services/workspace`.
 */

export interface JoinMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface AccountUser {
  name: string;
  /** The login the account is under; shown in the account menu. */
  email?: string;
  avatarUrl?: string;
}
