type ApiError = {
    status: number;
    code?: string;
    message?: string;
  };
  
  async function apiFetch<T>(
    path: string,
    init: RequestInit & { json?: unknown } = {}
  ): Promise<T> {
    const { json, headers, ...rest } = init;
  
    const res = await fetch(`/api${path}`, {
      ...rest,
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        ...(headers ?? {}),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // empty body is OK
    }
  
    if (!res.ok) {
      const err: ApiError = {
        status: res.status,
        code: data?.code,
        message: data?.message ?? res.statusText,
      };
      throw err;
    }
  
    return data as T;
  }
  
  
  export function apiGet<T>(path: string, init?: RequestInit) {
    return apiFetch<T>(path, { ...init, method: 'GET' });
  }
  
  export function apiPost<T>(path: string, json?: unknown, init?: RequestInit) {
    return apiFetch<T>(path, { ...init, method: 'POST', json });
  }
  
  export function apiPut<T>(path: string, json?: unknown, init?: RequestInit) {
    return apiFetch<T>(path, { ...init, method: 'PUT', json });
  }
  
  export function apiDelete<T>(path: string, init?: RequestInit) {
    return apiFetch<T>(path, { ...init, method: 'DELETE' });
  }
  