import { useEffect, useState } from 'react';
import { Chart, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import Layout from '../../components/Layout';
import { useDashboard } from '../../hooks/useDashboard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AnalyticsPage() {
  const { guilds, guildId, setGuildId, loading, fetchGuild } = useDashboard();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!guildId) return;
    fetchGuild('/analytics').then(setData);
  }, [guildId, fetchGuild]);

  if (loading) return <div className="p-8">Loading...</div>;

  const chartData = {
    labels: data?.xpByDay?.map((d) => d.date) || [],
    datasets: [{ label: 'XP Earned', data: data?.xpByDay?.map((d) => d.xp) || [], borderColor: '#5865F2', tension: 0.3 }],
  };

  return (
    <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
      <h2 className="text-2xl font-bold mb-6">Analytics</h2>
      <div className="bg-surface p-6 rounded-lg border border-gray-800 max-w-3xl">
        {data?.xpByDay?.length ? <Line data={chartData} options={{ responsive: true, plugins: { legend: { labels: { color: '#ccc' } } }, scales: { x: { ticks: { color: '#888' } }, y: { ticks: { color: '#888' } } } }} /> : <p className="text-gray-400">No analytics data yet.</p>}
      </div>
    </Layout>
  );
}
