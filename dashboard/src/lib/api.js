const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function api(path, options = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

export function getLoginUrl() {
  return api('/auth/login');
}

export function getMe() {
  return api('/auth/me');
}

export function guildApi(guildId, path, options) {
  return api(`/guilds/${guildId}${path}`, options);
}
