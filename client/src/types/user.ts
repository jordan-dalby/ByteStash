export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  error?: string;
}

export interface AuthConfig {
  authRequired: boolean;
  allowNewAccounts: boolean;
}