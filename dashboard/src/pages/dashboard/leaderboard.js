import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useDashboard } from '../../hooks/useDashboard';
import { getSocket } from '../../lib/socket';

export default function LeaderboardPage() {
  const { guilds, guildId, setGuildId, loading, fetchGuild } = useDashboard();
  const [rows, setRows] = useState([]);
  const [type, setType] = useState('alltime');
  const [source, setSource] = useState('total');

  const load = () => fetchGuild(`/leaderboard?type=${type}&source=${source}&limit=25`).then(setRows);
  useEffect(() => { if (guildId) load(); }, [guildId, type, source]);

  useEffect(() => {
    const s = getSocket();
    const refresh = () => load();
    s.on('leaderboard:update', refresh);
    s.on('xp:update', refresh);
    return () => { s.off('leaderboard:update', refresh); s.off('xp:update', refresh); };
  }, [guildId, type, source]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
      <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
      <div className="flex gap-3 mb-4">
        <select value={type} onChange={(e) => setType(e.target.value)} className="bg-surface-light rounded px-3 py-2">
          <option value="weekly">Weekly</option>
          <option value="season">Season</option>
          <option value="alltime">All Time</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="bg-surface-light rounded px-3 py-2">
          <option value="total">Total</option>
          <option value="voice">Voice</option>
          <option value="text">Text</option>
        </select>
      </div>
      <table className="w-full bg-surface rounded border border-gray-800 text-sm">
        <thead className="bg-surface-light">
          <tr><th className="p-3 text-left">#</th><th className="p-3 text-left">User</th><th className="p-3 text-left">Level</th><th className="p-3 text-left">XP</th><th className="p-3 text-left">Voice</th><th className="p-3 text-left">Text</th></tr>
        </thead>
        <tbody>
          {rows.map((u, i) => (
            <tr key={u.user_id} className="border-t border-gray-800">
              <td className="p-3">{i + 1}</td>
              <td className="p-3">{u.username}</td>
              <td className="p-3">{u.level}</td>
              <td className="p-3">{u.total_xp.toLocaleString()}</td>
              <td className="p-3">{u.voice_xp.toLocaleString()}</td>
              <td className="p-3">{u.text_xp.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
