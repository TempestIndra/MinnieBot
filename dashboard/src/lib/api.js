/**
 * Browser: same-origin /api (proxied to Express).
 * Auth: Bearer token in sessionStorage (set after OAuth on /auth/complete).
 */
function getApiBase() {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BROWSER_API_URL ?? '';
  }
  return process.env.API_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
}

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('minnie_token');
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') sessionStorage.removeItem('minnie_token');
}

export async function api(path, options = {}) {
  const base = getApiBase();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}/api${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    clearAuthToken();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.hint || err.error || 'API error');
  }
  return res.json();
}

export function getLoginUrl() {
  return api('/auth/login');
}

export function getMe() {
  return api('/auth/me');
}

export function logout() {
  clearAuthToken();
  return api('/auth/logout', { method: 'POST' }).catch(() => {});
}

export function guildApi(guildId, path, options) {
  return api(`/guilds/${guildId}${path}`, options);
}
