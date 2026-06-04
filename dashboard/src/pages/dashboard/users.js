import { useState } from 'react';
import Layout from '../../components/Layout';
import { useDashboard } from '../../hooks/useDashboard';
import { guildApi } from '../../lib/api';

export default function UsersPage() {
  const { guilds, guildId, setGuildId, loading, fetchGuild } = useDashboard();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  async function search() {
    const data = await fetchGuild(`/users/search?q=${encodeURIComponent(query)}`);
    setResults(data || []);
  }

  async function viewUser(userId) {
    const data = await fetchGuild(`/users/${userId}`);
    setSelected(data);
  }

  async function adjustXp(amount) {
    await guildApi(guildId, '/users/xp', { method: 'POST', body: JSON.stringify({ userId: selected.user.user_id, amount }) });
    viewUser(selected.user.user_id);
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      <div className="flex gap-2 mb-6">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search username" className="bg-surface-light rounded px-3 py-2 flex-1" />
        <button onClick={search} className="bg-discord px-4 py-2 rounded">Search</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <ul className="space-y-1">
          {results.map((u) => (
            <li key={u.user_id}>
              <button onClick={() => viewUser(u.user_id)} className="w-full text-left bg-surface hover:bg-surface-light p-3 rounded border border-gray-800">
                {u.username} — Lv.{u.level}
              </button>
            </li>
          ))}
        </ul>
        {selected && (
          <div className="bg-surface p-4 rounded border border-gray-800">
            <h3 className="font-bold text-lg">{selected.user.username}</h3>
            <p className="text-gray-400 text-sm mt-2">Rank #{selected.rank} | Level {selected.user.level} | Prestige {selected.user.prestige}</p>
            <p className="mt-2">Total XP: {selected.user.total_xp.toLocaleString()}</p>
            <p>Coins: {selected.user.coins}</p>
            <p>Streak: {selected.user.streak_count} days</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => adjustXp(100)} className="bg-green-700 px-3 py-1 rounded text-sm">+100 XP</button>
              <button onClick={() => adjustXp(-100)} className="bg-red-700 px-3 py-1 rounded text-sm">-100 XP</button>
              <button onClick={() => guildApi(guildId, '/users/reset', { method: 'POST', body: JSON.stringify({ userId: selected.user.user_id }) }).then(() => viewUser(selected.user.user_id))}
                className="bg-gray-700 px-3 py-1 rounded text-sm">Reset</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
