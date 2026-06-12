import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import NoBotServers from '../../components/NoBotServers';
import { useDashboard } from '../../hooks/useDashboard';
import { guildApi } from '../../lib/api';

export default function UsersPage() {
  const { guilds, guildId, setGuildId, loading, fetchGuild, inviteUrl } = useDashboard();
  const [query, setQuery] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [total, setTotal] = useState(0);

  const loadUsers = useCallback(async (searchQuery = '') => {
    if (!guildId) return;
    setError(null);
    setBusy(true);
    try {
      const path = searchQuery.trim()
        ? `/users/search?q=${encodeURIComponent(searchQuery.trim())}`
        : '/users';
      const data = await fetchGuild(path);
      if (!data) {
        setResults([]);
        return;
      }
      if (data.users) {
        setResults(data.users);
        setTotal(data.total ?? data.users.length);
      } else if (Array.isArray(data)) {
        setResults(data);
        setTotal(data.length);
      } else {
        setResults([]);
      }
    } catch (e) {
      setError(e.message);
      setResults([]);
    } finally {
      setBusy(false);
    }
  }, [guildId, fetchGuild]);

  useEffect(() => {
    if (guildId) {
      setSelected(null);
      loadUsers();
    }
  }, [guildId, loadUsers]);

  async function search() {
    await loadUsers(query);
  }

  async function viewUser(userId) {
    if (!guildId) return;
    setError(null);
    setBusy(true);
    try {
      const data = await fetchGuild(`/users/${userId}`);
      setSelected(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function importByDiscordId() {
    if (!guildId || !discordId.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const data = await guildApi(guildId, '/users/resolve', {
        method: 'POST',
        body: JSON.stringify({ userId: discordId.trim() }),
      });
      setSelected(data);
      await loadUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function adjustXp(amount) {
    if (!selected?.user) return;
    setError(null);
    try {
      await guildApi(guildId, '/users/xp', {
        method: 'POST',
        body: JSON.stringify({ userId: selected.user.user_id, amount }),
      });
      await viewUser(selected.user.user_id);
      await loadUsers(query);
    } catch (e) {
      setError(e.message);
    }
  }

  async function resetUser() {
    if (!selected?.user || !confirm(`Reset all data for ${selected.user.username}?`)) return;
    setError(null);
    try {
      await guildApi(guildId, '/users/reset', {
        method: 'POST',
        body: JSON.stringify({ userId: selected.user.user_id }),
      });
      await viewUser(selected.user.user_id);
      await loadUsers(query);
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  if (!guilds.length) {
    return (
      <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
        <NoBotServers inviteUrl={inviteUrl} />
      </Layout>
    );
  }

  return (
    <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
      <h2 className="text-2xl font-bold mb-2">User Management</h2>
      <p className="text-gray-400 text-sm mb-6">
        Shows members who have earned XP with Minnie. Search by name, or load someone by Discord user ID.
      </p>

      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-950/40 border border-red-900 rounded p-3">{error}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search username..."
          className="bg-surface-light rounded px-3 py-2 flex-1 min-w-[200px]"
        />
        <button type="button" onClick={search} disabled={busy} className="bg-discord px-4 py-2 rounded disabled:opacity-50">
          Search
        </button>
        <button type="button" onClick={() => loadUsers()} disabled={busy} className="bg-surface-light px-4 py-2 rounded border border-gray-700">
          Show all
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <input
          value={discordId}
          onChange={(e) => setDiscordId(e.target.value)}
          placeholder="Discord user ID (17–20 digits)"
          className="bg-surface-light rounded px-3 py-2 flex-1 min-w-[240px] font-mono text-sm"
        />
        <button type="button" onClick={importByDiscordId} disabled={busy} className="bg-indigo-700 px-4 py-2 rounded disabled:opacity-50">
          Load from server
        </button>
      </div>

      <p className="text-gray-500 text-xs mb-4">{total} tracked member{total === 1 ? '' : 's'} in this server</p>

      <div className="grid md:grid-cols-2 gap-6">
        <ul className="space-y-1 max-h-[480px] overflow-y-auto">
          {busy && !results.length ? (
            <li className="text-gray-500 p-3">Loading...</li>
          ) : results.length ? (
            results.map((u) => (
              <li key={u.user_id}>
                <button
                  type="button"
                  onClick={() => viewUser(u.user_id)}
                  className={`w-full text-left p-3 rounded border transition ${
                    selected?.user?.user_id === u.user_id
                      ? 'bg-discord/20 border-discord'
                      : 'bg-surface hover:bg-surface-light border-gray-800'
                  }`}
                >
                  <span className="font-medium">{u.username}</span>
                  <span className="text-gray-400 text-sm block">
                    Lv.{u.level} · {u.total_xp.toLocaleString()} XP
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="text-gray-500 p-3">
              No tracked users yet. Members appear after they send messages or join voice with XP enabled.
            </li>
          )}
        </ul>

        {selected?.user && (
          <div className="bg-surface p-4 rounded border border-gray-800 h-fit">
            <h3 className="font-bold text-lg">{selected.user.username}</h3>
            <p className="text-gray-500 text-xs font-mono mt-1">{selected.user.user_id}</p>
            <p className="text-gray-400 text-sm mt-3">
              Rank #{selected.rank} · Level {selected.user.level}
            </p>
            <div className="mt-3 space-y-1 text-sm">
              <p>Total XP: <strong>{selected.user.total_xp.toLocaleString()}</strong></p>
              <p>Voice XP: {selected.user.voice_xp.toLocaleString()} · Text XP: {selected.user.text_xp.toLocaleString()}</p>
              <p>Coins: {selected.user.coins.toLocaleString()} · Streak: {selected.user.streak_count} days</p>
              <p>Messages: {selected.user.message_count.toLocaleString()}</p>
              {selected.xpToNext != null && (
                <p className="text-gray-400">Next level in {selected.xpToNext.toLocaleString()} XP</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" onClick={() => adjustXp(100)} className="bg-green-700 px-3 py-1.5 rounded text-sm">
                +100 XP
              </button>
              <button type="button" onClick={() => adjustXp(-100)} className="bg-red-700 px-3 py-1.5 rounded text-sm">
                -100 XP
              </button>
              <button type="button" onClick={resetUser} className="bg-gray-700 px-3 py-1.5 rounded text-sm">
                Reset user
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
