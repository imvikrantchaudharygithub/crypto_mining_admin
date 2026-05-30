const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const TOKEN = process.env.NEXT_PUBLIC_DEV_TOKEN ?? '';

const buildErrorMessage = (err: any, status: number): string => {
  const message = err?.message;
  const detail = err?.error;
  if (message && detail && message !== detail) return `${message}: ${detail}`;
  return detail || message || `HTTP ${status}`;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(buildErrorMessage(err, res.status));
  }
  return res.json();
}

export async function apiUpload<T>(path: string, body: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}` },
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    throw new Error(buildErrorMessage(err, res.status));
  }
  return res.json();
}
