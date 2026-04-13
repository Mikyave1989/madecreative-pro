const API_URL = import.meta.env.VITE_API_URL || 'https://api.madecreative.pro';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mc_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mc_refresh_token');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('mc_token', access);
  localStorage.setItem('mc_refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('mc_token');
  localStorage.removeItem('mc_refresh_token');
  localStorage.removeItem('mc_user');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/portal/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      localStorage.setItem('mc_token', data.data.accessToken);
      if (data.data.refreshToken) {
        localStorage.setItem('mc_refresh_token', data.data.refreshToken);
      }
      return data.data.accessToken;
    }
  } catch {
    // refresh failed
  }
  return null;
}

export async function apiClient<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  let token = getToken();

  const doFetch = async (authToken: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  };

  let res = await doFetch(token);

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    } else {
      clearTokens();
      return { success: false, error: 'Session expired' };
    }
  }

  const data = await res.json();
  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/portal/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.success && data.data) {
    setTokens(data.data.accessToken, data.data.refreshToken);
    localStorage.setItem('mc_user', JSON.stringify(data.data.user));
    return { success: true, user: data.data.user };
  }

  return { success: false, error: data.error || 'Login failed' };
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('mc_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export { API_URL };
