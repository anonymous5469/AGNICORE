const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('agnicore_token');
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(error.message || error.error || response.statusText);
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => 
    apiRequest<T>(path, { ...options, method: 'GET' }),
  
  post: <T>(path: string, body: unknown, options?: RequestInit) => 
    apiRequest<T>(path, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
};
