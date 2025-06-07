export interface User {
  id: number;
  username: string;
  created_at: string;
  oidc_id?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  error?: string;
}

export interface AuthConfig {
  authRequired: boolean;
  allowNewAccounts: boolean;
  hasUsers: boolean;
  disableAccounts: boolean;
  disableInternalAccounts: boolean;
  allowPasswordChanges: boolean;
}