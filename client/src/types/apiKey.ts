export interface ApiKey {
  id: string;
  name: string;
  key: string;
  last_used?: string;
  created_at: string;
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  created_at: string;
}
