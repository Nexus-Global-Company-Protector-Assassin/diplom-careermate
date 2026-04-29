import { ApiError, classifyError } from '@/shared/lib/api-errors';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const NO_REFRESH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; refresh_token?: string };
    if (!data.access_token || !data.refresh_token) return null;
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    document.cookie = `access_token=${encodeURIComponent(data.access_token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    return data.access_token;
  } catch {
    return null;
  }
}

function clearSessionAndRedirect() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
  if (!window.location.pathname.startsWith('/auth') && window.location.pathname !== '/') {
    window.location.href = '/';
  }
}

class ApiClient {
  private buildHeaders(extra?: HeadersInit, token?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((extra as Record<string, string>) || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers = this.buildHeaders(options.headers, token);

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (err) {
      throw new ApiError('Нет соединения с сервером', 0, 'network');
    }

    if (response.status === 401 && !isRetry && !NO_REFRESH_ENDPOINTS.some((p) => endpoint.startsWith(p))) {
      if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
      const newToken = await refreshPromise;
      if (newToken) {
        return this.request<T>(endpoint, options, true);
      }
      clearSessionAndRedirect();
      throw new ApiError('Необходима авторизация', 401, 'auth');
    }

    if (!response.ok) {
      let errorMessage = response.statusText || 'Ошибка запроса';
      let errorBody: Record<string, unknown> | undefined;
      try {
        errorBody = await response.json();
        if (errorBody && typeof errorBody.message === 'string') errorMessage = errorBody.message;
        else if (errorBody && Array.isArray(errorBody.message)) errorMessage = (errorBody.message as string[])[0];
      } catch {
        // keep statusText
      }
      throw classifyError(response.status, errorMessage, errorBody);
    }

    try {
      const data = await response.json();
      return data as T;
    } catch {
      return null as T;
    }
  }

  public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public patch<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
