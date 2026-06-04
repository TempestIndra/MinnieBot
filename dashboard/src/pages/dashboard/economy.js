import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useDashboard } from '../../hooks/useDashboard';
import { guildApi } from '../../lib/api';

export default function EconomyPage() {
  const { guilds, guildId, setGuildId, loading, fetchGuild } = useDashboard();
  const [shop, setShop] = useState([]);
  const [roleId, setRoleId] = useState('');
  const [cost, setCost] = useState(100);

  const load = () => fetchGuild('/shop').then(setShop);
  useEffect(() => { if (guildId) load(); }, [guildId]);

  async function addItem(e) {
    e.preventDefault();
    await guildApi(guildId, '/shop', { method: 'POST', body: JSON.stringify({ roleId, cost: parseInt(cost, 10), name: 'Shop Role' }) });
    load();
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
      <h2 className="text-2xl font-bold mb-6">Role Shop</h2>
      <form onSubmit={addItem} className="flex gap-3 mb-6">
        <input value={roleId} onChange={(e) => setRoleId(e.target.value)} placeholder="Role ID" className="bg-surface-light rounded px-3 py-2" />
        <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="bg-surface-light rounded px-3 py-2 w-28" />
        <button type="submit" className="bg-discord px-4 py-2 rounded">Add to Shop</button>
      </form>
      <ul className="space-y-2">
        {shop.map((item) => (
          <li key={item.id} className="bg-surface p-3 rounded border border-gray-800 flex justify-between">
            <span>Role {item.role_id} — {item.cost} coins</span>
            <button className="text-red-400 text-sm" onClick={() => guildApi(guildId, '/shop', { method: 'DELETE', body: JSON.stringify({ roleId: item.role_id }) }).then(load)}>Remove</button>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
