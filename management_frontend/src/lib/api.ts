const API_URL = (
  import.meta.env.PROD
    ? '/api'
    : (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api')
).replace(/\/$/, '');

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface CachedResponse {
  data: unknown;
  expiresAt: number;
}

const GET_CACHE_TTL_MS = 60_000;
const responseCache = new Map<string, CachedResponse>();
const pendingRequests = new Map<string, Promise<unknown>>();
let cacheGeneration = 0;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function performRequest<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!response.ok || !payload.success) {
    throw new ApiError(payload.message ?? 'Something went wrong. Please try again.', response.status);
  }

  return payload.data as T;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();

  if (method !== 'GET') {
    const data = await performRequest<T>(path, options);
    cacheGeneration += 1;
    responseCache.clear();
    pendingRequests.clear();
    return data;
  }

  const cached = responseCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.data as T;
  if (cached) responseCache.delete(path);

  const pending = pendingRequests.get(path);
  if (pending) return pending as Promise<T>;

  const requestGeneration = cacheGeneration;
  const request = performRequest<T>(path, options)
    .then((data) => {
      if (requestGeneration === cacheGeneration) {
        responseCache.set(path, { data, expiresAt: Date.now() + GET_CACHE_TTL_MS });
      }
      return data;
    })
    .finally(() => {
      if (pendingRequests.get(path) === request) pendingRequests.delete(path);
    });

  pendingRequests.set(path, request);
  return request;
}

export function prefetchApi(path: string) {
  void apiRequest<unknown>(path).catch(() => undefined);
}
