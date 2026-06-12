import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Layout from '../../components/Layout';
import { useDashboard } from '../../hooks/useDashboard';

const XpLineChart = dynamic(() => import('../../components/XpLineChart'), { ssr: false });

function fillDateRange(xpByDay, days) {
  const map = new Map((xpByDay || []).map((d) => [d.date, d.xp]));
  const result = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, xp: map.get(key) || 0 });
  }
  return result;
}

function StatCard({ label, value }) {
  return (
    <div className="bg-surface rounded-lg p-4 border border-gray-800">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { guilds, guildId, setGuildId, loading, fetchGuild } = useDashboard();
  const [data, setData] = useState(null);
  const [range, setRange] = useState(30);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!guildId) return;
    setLoadingData(true);
    setError(null);
    fetchGuild(`/analytics?days=${range}`)
      .then(setData)
      .catch((err) => {
        setData(null);
        setError(err.message || 'Failed to load analytics');
      })
      .finally(() => setLoadingData(false));
  }, [guildId, range, fetchGuild]);

  if (loading) return <div className="p-8">Loading...</div>;

  const series = fillDateRange(data?.xpByDay, data?.days || range);
  const hasXp = series.some((d) => d.xp > 0);

  return (
    <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <select
          value={range}
          onChange={(e) => setRange(parseInt(e.target.value, 10))}
          className="bg-surface-light rounded px-3 py-2"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {error && (
        <p className="text-red-400 mb-4">{error}</p>
      )}

      {loadingData && <p className="text-gray-400 mb-4">Loading analytics...</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="XP (period)" value={(data?.period?.total_xp ?? 0).toLocaleString()} />
        <StatCard label="XP events (period)" value={(data?.period?.total_events ?? 0).toLocaleString()} />
        <StatCard label="Members tracked" value={(data?.stats?.user_count ?? 0).toLocaleString()} />
        <StatCard label="Total server XP" value={(data?.stats?.total_xp ?? 0).toLocaleString()} />
      </div>

      <div className="bg-surface p-6 rounded-lg border border-gray-800 max-w-4xl mb-8">
        <h3 className="font-semibold mb-4">XP over time</h3>
        {hasXp ? (
          <XpLineChart
            labels={series.map((d) => d.date)}
            values={series.map((d) => d.xp)}
          />
        ) : (
          <p className="text-gray-400">No XP logged in this period yet. Activity will appear after members earn voice or text XP.</p>
        )}
      </div>

      {data?.xpBySource?.length > 0 && (
        <div className="bg-surface rounded-lg border border-gray-800 overflow-hidden max-w-2xl">
          <h3 className="font-semibold p-4 border-b border-gray-800">XP by source</h3>
          <table className="w-full text-sm">
            <thead className="bg-surface-light">
              <tr>
                <th className="text-left p-3">Source</th>
                <th className="text-left p-3">XP</th>
                <th className="text-left p-3">Events</th>
              </tr>
            </thead>
            <tbody>
              {data.xpBySource.map((row) => (
                <tr key={row.source} className="border-t border-gray-800">
                  <td className="p-3 capitalize">{row.source}</td>
                  <td className="p-3">{row.xp.toLocaleString()}</td>
                  <td className="p-3">{row.events.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
