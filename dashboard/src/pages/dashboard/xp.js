import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useDashboard } from '../../hooks/useDashboard';
import { guildApi } from '../../lib/api';

export default function XpConfigPage() {
  const { guilds, guildId, setGuildId, loading, fetchGuild } = useDashboard();
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [capDisabled, setCapDisabled] = useState(false);

  useEffect(() => {
    if (!guildId) return;
    fetchGuild('/settings').then((s) => {
      setSettings(s);
      setCapDisabled(!s.daily_xp_cap || s.daily_xp_cap <= 0);
    });
  }, [guildId, fetchGuild]);

  async function save(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const capValue = capDisabled ? 0 : parseInt(form.get('daily_xp_cap'), 10);
    await guildApi(guildId, '/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        voice_xp_rate: parseFloat(form.get('voice_xp_rate')),
        text_xp_min: parseInt(form.get('text_xp_min'), 10),
        text_xp_max: parseInt(form.get('text_xp_max'), 10),
        text_cooldown: parseInt(form.get('text_cooldown'), 10),
        daily_xp_cap: capValue,
        min_message_length: parseInt(form.get('min_message_length'), 10),
        anti_spam_window: parseInt(form.get('anti_spam_window'), 10),
        anti_spam_max_messages: parseInt(form.get('anti_spam_max_messages'), 10),
        max_level: 0,
        level_up_channel_id: (form.get('level_up_channel_id') || '').trim() || null,
        log_channel_id: (form.get('log_channel_id') || '').trim() || null,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchGuild('/settings').then((s) => {
      setSettings(s);
      setCapDisabled(!s.daily_xp_cap || s.daily_xp_cap <= 0);
    });
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <Layout guildId={guildId} guilds={guilds} onGuildChange={setGuildId}>
      <h2 className="text-2xl font-bold mb-6">XP Configuration</h2>
      {settings && (
        <form onSubmit={save} className="max-w-lg space-y-4 bg-surface p-6 rounded-lg border border-gray-800">
          <Field label="Voice XP / minute" name="voice_xp_rate" defaultValue={settings.voice_xp_rate} type="number" step="0.1" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Text XP Min" name="text_xp_min" defaultValue={settings.text_xp_min} type="number" />
            <Field label="Text XP Max" name="text_xp_max" defaultValue={settings.text_xp_max} type="number" />
          </div>
          <Field label="Text Cooldown (sec)" name="text_cooldown" defaultValue={settings.text_cooldown} type="number" />
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={capDisabled}
                onChange={(e) => setCapDisabled(e.target.checked)}
              />
              <span className="text-sm">Disable daily XP cap</span>
            </label>
            {!capDisabled && (
              <Field
                label="Daily XP Cap"
                name="daily_xp_cap"
                defaultValue={settings.daily_xp_cap > 0 ? settings.daily_xp_cap : 500}
                type="number"
                min={1}
              />
            )}
            {capDisabled && (
              <p className="text-sm text-gray-400">Members can earn unlimited XP per day.</p>
            )}
          </div>
          <Field label="Min Message Length" name="min_message_length" defaultValue={settings.min_message_length} type="number" />
          <Field label="Anti-Spam Window (sec)" name="anti_spam_window" defaultValue={settings.anti_spam_window} type="number" />
          <Field label="Max Messages in Window" name="anti_spam_max_messages" defaultValue={settings.anti_spam_max_messages} type="number" />
          <p className="text-sm text-gray-400">Levels are unlimited (no max level cap). Prestige is disabled.</p>

          <div className="pt-4 border-t border-gray-800 space-y-4">
            <h3 className="font-semibold">Announcements</h3>
            <p className="text-sm text-gray-400">
              Level-up messages are posted when a member gains a level. Right-click a channel in Discord → Copy Channel ID.
            </p>
            <Field
              label="Level-up channel"
              name="level_up_channel_id"
              defaultValue={settings.level_up_channel_id || ''}
              placeholder="Channel ID for level-up messages"
            />
            <Field
              label="Log channel (fallback if level-up channel is empty)"
              name="log_channel_id"
              defaultValue={settings.log_channel_id || ''}
              placeholder="Optional"
            />
          </div>

          <button type="submit" className="bg-discord px-4 py-2 rounded font-medium">Save Settings</button>
          {saved && <span className="text-green-400 ml-2">Saved!</span>}
        </form>
      )}
    </Layout>
  );
}

function Field({ label, name, defaultValue, type = 'text', step, min, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-400">{label}</span>
      <input name={name} type={type} step={step} min={min} defaultValue={defaultValue} placeholder={placeholder}
        className="mt-1 w-full bg-surface-light rounded px-3 py-2 border border-gray-700" />
    </label>
  );
}
