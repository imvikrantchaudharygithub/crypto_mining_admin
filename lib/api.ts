const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const DEV_TOKEN = process.env.NEXT_PUBLIC_DEV_TOKEN ?? '';

const TOKEN_KEY = 'cmm_admin_token';
const USER_KEY = 'cmm_admin_user';

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: 'super-admin' | 'editor' | 'support';
  avatar?: string;
};

/** Read the current JWT — prefers logged-in token, falls back to dev env token. */
export function getAuthToken(): string {
  if (typeof window === 'undefined') return DEV_TOKEN;
  return window.localStorage.getItem(TOKEN_KEY) || DEV_TOKEN;
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AdminUser): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

const buildErrorMessage = (err: any, status: number): string => {
  const message = err?.message;
  const detail = err?.error;
  if (message && detail && message !== detail) return `${message}: ${detail}`;
  return detail || message || `HTTP ${status}`;
};

const handleUnauthorized = (status: number): void => {
  if (typeof window === 'undefined') return;
  if (status !== 401) return;
  // Token rejected — clear session and bounce to login (unless we're already on it)
  clearAuthSession();
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    handleUnauthorized(res.status);
    const err = await res.json().catch(() => ({}));
    throw new Error(buildErrorMessage(err, res.status));
  }
  return res.json();
}

export async function apiUpload<T>(path: string, body: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  if (!res.ok) {
    handleUnauthorized(res.status);
    const err = await res.json().catch(() => ({} as any));
    throw new Error(buildErrorMessage(err, res.status));
  }
  return res.json();
}
