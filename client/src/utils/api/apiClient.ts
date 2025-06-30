import { EVENTS } from '../../constants/events';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiClient {
  private static instance: ApiClient;
  private basePath: string;

  private constructor() {
    this.basePath = (window as any).__BASE_PATH__ || '';
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private getHeaders(options: RequestOptions = {}): Headers {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (options.requiresAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('bytestashauth', `Bearer ${token}`);
      }
    }

    return headers;
  }

  private handleError(error: any): never {
    if (error instanceof Response) {
      if (error.status === 401 || error.status === 403) {
        window.dispatchEvent(new CustomEvent(EVENTS.AUTH_ERROR));
      }
    }
    throw error;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    try {
      const response = await fetch(`${this.basePath}${endpoint}`, {
        ...options,
        headers: this.getHeaders(options),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.dispatchEvent(new CustomEvent(EVENTS.AUTH_ERROR));
        }
        const error = await response.json().catch(() => ({}));
        error.status = response.status;
        throw error;
      }

      return response.json();
    } catch (error) {
      this.handleError(error);
    }
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  async patch<T>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = ApiClient.getInstance();