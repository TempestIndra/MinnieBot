import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useDashboard } from '../../hooks/useDashboard';
import { guildApi } from '../../lib/api';

export default function ChannelsPage() {
  const { guilds, guildId, setGuildId, loading, fetchGuild } = useDashboard();
  const [rules, setRules] = useState(null);
  const [channelId, setChannelId] = useState('');
  const [multiplier, setMultiplier] = useState(1.5);

  const load = () => fetchGuild('/channels/rules').then(setRules);
  useEffect(() => { if (guildId) load(); }, [guildId]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
      <h2 className="text-2xl font-bold mb-6">Channel & Category Rules</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <RulePanel title="Whitelist Channel" channelId={channelId} setChannelId={setChannelId}
          onApply={() => guildApi(guildId, '/channels/whitelist', { method: 'POST', body: JSON.stringify({ channelId }) }).then(load)} />
        <RulePanel title="Blacklist Channel" channelId={channelId} setChannelId={setChannelId}
          onApply={() => guildApi(guildId, '/channels/blacklist', { method: 'POST', body: JSON.stringify({ channelId }) }).then(load)} />
      </div>
      <div className="flex gap-3 mb-8">
        <input value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="Channel ID" className="bg-surface-light rounded px-3 py-2" />
        <input type="number" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} step="0.1" className="bg-surface-light rounded px-3 py-2 w-24" />
        <button onClick={() => guildApi(guildId, '/channels/bonus', { method: 'POST', body: JSON.stringify({ channelId, multiplier: parseFloat(multiplier) }) }).then(load)}
          className="bg-discord px-4 py-2 rounded">Set Bonus</button>
      </div>
      <pre className="bg-surface p-4 rounded text-xs overflow-auto border border-gray-800">{JSON.stringify(rules, null, 2)}</pre>
    </Layout>
  );
}

function RulePanel({ title, channelId, setChannelId, onApply }) {
  return (
    <div className="bg-surface p-4 rounded border border-gray-800">
      <h3 className="font-medium mb-2">{title}</h3>
      <input value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="Channel ID" className="w-full bg-surface-light rounded px-3 py-2 mb-2" />
      <button onClick={onApply} className="bg-discord px-3 py-1 rounded text-sm">Apply</button>
    </div>
  );
}
