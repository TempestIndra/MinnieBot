import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import NoBotServers from '../../components/NoBotServers';
import { useDashboard } from '../../hooks/useDashboard';
import { guildApi } from '../../lib/api';

function StatCard({ label, value }) {
  return (
    <div className="bg-surface rounded-lg p-4 border border-gray-800">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function parseAllowedRoleIds(value) {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join(', ') : '';
  } catch {
    return value;
  }
}

export default function OverviewPage() {
  const { user, isDev, guilds, guildId, setGuildId, loading, fetchGuild, inviteUrl } = useDashboard();
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);

  const currentGuild = guilds.find((g) => g.id === guildId);
  const canManageAccess = isDev || currentGuild?.access === 'admin';

  useEffect(() => {
    if (!guildId) return;
    fetchGuild('/overview').then(setData).catch(console.error);
    fetchGuild('/settings').then(setSettings).catch(console.error);
  }, [guildId, fetchGuild]);

  async function saveAccess(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const allowed = (form.get('dashboard_allowed_role_ids') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    await guildApi(guildId, '/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        dashboard_min_role_id: form.get('dashboard_min_role_id') || null,
        dashboard_allowed_role_ids: allowed.length ? JSON.stringify(allowed) : null,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchGuild('/settings').then(setSettings);
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
      <h2 className="text-2xl font-bold mb-6">Server Overview</h2>
      {isDev && (
        <p className="mb-4 text-sm text-amber-400">Developer access — all bot servers are available.</p>
      )}
      {!guildId ? (
        <p className="text-gray-400">Select a server to manage.</p>
      ) : (
        <>
          {canManageAccess && settings && (
            <form onSubmit={saveAccess} className="mb-8 max-w-2xl space-y-4 bg-surface p-6 rounded-lg border border-gray-800">
              <h3 className="font-semibold text-lg">Web dashboard access</h3>
              <p className="text-sm text-gray-400">
                Server Administrators always have access. Add roles below to let members with those roles
                (or any role ranked above the minimum role) use this dashboard. Set{' '}
                <code className="text-gray-300">DASHBOARD_DEV_USER_IDS</code> in .env for full developer access.
              </p>
              <label className="block">
                <span className="text-sm text-gray-400">Minimum role (this role or any role above it in Discord)</span>
                <input
                  name="dashboard_min_role_id"
                  defaultValue={settings.dashboard_min_role_id || ''}
                  placeholder="Discord Role ID"
                  className="mt-1 w-full bg-surface-light rounded px-3 py-2 border border-gray-700"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-400">Extra allowed role IDs (comma-separated)</span>
                <input
                  name="dashboard_allowed_role_ids"
                  defaultValue={parseAllowedRoleIds(settings.dashboard_allowed_role_ids)}
                  placeholder="123456789, 987654321"
                  className="mt-1 w-full bg-surface-light rounded px-3 py-2 border border-gray-700"
                />
              </label>
              <button type="submit" className="bg-discord px-4 py-2 rounded font-medium">Save access rules</button>
              {saved && <span className="text-green-400 ml-2">Saved!</span>}
            </form>
          )}

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
