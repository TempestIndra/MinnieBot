import { useState } from 'react';
import { getLoginUrl } from '../lib/api';

export default function Login() {
  const [error, setError] = useState(null);

  async function handleLogin() {
    try {
      const { url } = await getLoginUrl();
      window.location.href = url;
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <div className="bg-surface p-8 rounded-xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-discord mb-2">Minnie XP Dashboard</h1>
        <p className="text-gray-400 mb-6">Sign in with Discord to manage your servers.</p>
        <button
          onClick={handleLogin}
          className="w-full bg-discord hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition"
        >
          Login with Discord
        </button>
        {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
      </div>
    </div>
  );
}
