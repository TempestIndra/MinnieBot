import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useDashboard } from '../../hooks/useDashboard';
import { guildApi } from '../../lib/api';

export default function LevelsPage() {
  const { guilds, guildId, setGuildId, loading, fetchGuild } = useDashboard();
  const [roles, setRoles] = useState([]);
  const [level, setLevel] = useState(5);
  const [roleId, setRoleId] = useState('');

  const load = () => fetchGuild('/level-roles').then(setRoles);
  useEffect(() => { if (guildId) load(); }, [guildId]);

  async function addRole(e) {
    e.preventDefault();
    await guildApi(guildId, '/level-roles', { method: 'POST', body: JSON.stringify({ level: parseInt(level, 10), roleId }) });
    setRoleId('');
    load();
  }

  async function remove(lvl) {
    await guildApi(guildId, '/level-roles', { method: 'DELETE', body: JSON.stringify({ level: lvl }) });
    load();
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
      <h2 className="text-2xl font-bold mb-6">Level Role Rewards</h2>
      <form onSubmit={addRole} className="flex gap-3 mb-6">
        <input type="number" value={level} onChange={(e) => setLevel(e.target.value)} className="bg-surface-light rounded px-3 py-2 w-24" placeholder="Level" />
        <input value={roleId} onChange={(e) => setRoleId(e.target.value)} className="bg-surface-light rounded px-3 py-2 flex-1" placeholder="Discord Role ID" />
        <button type="submit" className="bg-discord px-4 py-2 rounded">Add</button>
      </form>
      <ul className="space-y-2">
        {roles.map((r) => (
          <li key={r.id} className="flex justify-between bg-surface p-3 rounded border border-gray-800">
            <span>Level <strong>{r.level}</strong> → <code>{r.role_id}</code></span>
            <button onClick={() => remove(r.level)} className="text-red-400 text-sm">Remove</button>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
