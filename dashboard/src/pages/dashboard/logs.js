import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useDashboard } from '../../hooks/useDashboard';

export default function LogsPage() {
  const { guilds, guildId, setGuildId, loading, fetchGuild } = useDashboard();
  const [logs, setLogs] = useState([]);
  const [type, setType] = useState('xp');

  useEffect(() => {
    if (!guildId) return;
    fetchGuild(`/logs?type=${type}`).then(setLogs);
  }, [guildId, type, fetchGuild]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
      <h2 className="text-2xl font-bold mb-6">Logs</h2>
      <select value={type} onChange={(e) => setType(e.target.value)} className="bg-surface-light rounded px-3 py-2 mb-4">
        <option value="xp">XP</option>
        <option value="coins">Coins</option>
        <option value="admin">Admin</option>
        <option value="suspicious">Suspicious</option>
      </select>
      <div className="bg-surface rounded border border-gray-800 max-h-[600px] overflow-auto">
        {logs.map((log) => (
          <div key={log.id} className="p-3 border-b border-gray-800 text-sm font-mono">
            {log.created_at} | {log.user_id || log.admin_id} | {log.amount ?? log.action} | {log.source || log.reason || log.details}
          </div>
        ))}
      </div>
    </Layout>
  );
}
