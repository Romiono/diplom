import { env } from '@shared/config/env';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: { message: string | string[]; error?: string },
  ) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message);
  }
}

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('ton-marketplace-auth');
    if (!raw) return null;
    return (JSON.parse(raw) as { state?: { token?: string } })?.state?.token ?? null;
  } catch {
    return null;
  }
};

const clearAuth = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('ton-marketplace-auth');
  } catch {}
};

const serverSideBase =
  typeof window === 'undefined'
    ? (process.env.API_INTERNAL_URL ?? env.apiUrl)
    : env.apiUrl;

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = init.body instanceof FormData;

  const res = await fetch(`${serverSideBase}${path}`, {
    ...init,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    if (res.status === 401) clearAuth();
    throw new ApiError(res.status, body as { message: string | string[]; error?: string });
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
