import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useDashboard } from '../../hooks/useDashboard';

function StatCard({ label, value }) {
  return (
    <div className="bg-surface rounded-lg p-4 border border-gray-800">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default function OverviewPage() {
  const { user, guilds, guildId, setGuildId, loading, fetchGuild } = useDashboard();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!guildId) return;
    fetchGuild('/overview').then(setData).catch(console.error);
  }, [guildId, fetchGuild]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
      <h2 className="text-2xl font-bold mb-6">Server Overview</h2>
      {!guildId ? (
        <p className="text-gray-400">Select a server to manage.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Members Tracked" value={data?.stats?.user_count ?? 0} />
            <StatCard label="Total XP" value={(data?.stats?.total_xp ?? 0).toLocaleString()} />
            <StatCard label="Total Messages" value={(data?.stats?.total_messages ?? 0).toLocaleString()} />
            <StatCard label="Voice Time (hrs)" value={Math.floor((data?.stats?.total_voice_time ?? 0) / 3600)} />
          </div>
          <h3 className="text-lg font-semibold mb-3">Top Users</h3>
          <div className="bg-surface rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-light">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Level</th>
                  <th className="text-left p-3">XP</th>
                </tr>
              </thead>
              <tbody>
                {data?.topUsers?.map((u, i) => (
                  <tr key={u.user_id} className="border-t border-gray-800">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">{u.username}</td>
                    <td className="p-3">{u.level} (P{u.prestige})</td>
                    <td className="p-3">{u.total_xp.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
}
