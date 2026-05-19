const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const TOKEN = process.env.NEXT_PUBLIC_DEV_TOKEN ?? '';

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
    throw new Error((err as any)?.message ?? `HTTP ${res.status}`);
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
    throw new Error((err as any)?.message ?? (err as any)?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
