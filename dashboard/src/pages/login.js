import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getLoginUrl, getMe } from '../lib/api';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (router.query.error) {
      setError(String(router.query.error));
      setChecking(false);
      return;
    }
    getMe()
      .then(() => router.replace('/dashboard'))
      .catch(() => setChecking(false));
  }, [router.query.error, router]);

  async function handleLogin() {
    setError(null);
    try {
      const { url } = await getLoginUrl();
      window.location.href = url;
    } catch (e) {
      setError(e.message || 'Could not start login. Is the API running (npm start)?');
    }
  }

  if (checking && !router.query.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <p className="text-gray-400">Checking session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <div className="bg-surface p-8 rounded-xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-discord mb-2">Minnie XP Dashboard</h1>
        <p className="text-gray-400 mb-6">Sign in with Discord (admin servers only).</p>
        <button
          onClick={handleLogin}
          className="w-full bg-discord hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition"
        >
          Login with Discord
        </button>
        {error && (
          <p className="text-red-400 mt-4 text-sm text-left bg-red-950/40 p-3 rounded border border-red-900">
            {error}
          </p>
        )}
        <p className="text-gray-500 text-xs mt-6 text-left">
          Requires Administrator on at least one server. API must run on port 4000 with{' '}
          <code className="text-gray-400">npm start</code>.
        </p>
      </div>
    </div>
  );
}
