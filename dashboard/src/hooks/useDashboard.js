import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getMe, guildApi } from '../lib/api';
import { joinGuild, getSocket } from '../lib/socket';

export function useDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [guildId, setGuildId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data.user);
        const q = router.query.guild;
        const g = q || data.user.guilds?.[0]?.id || '';
        setGuildId(g);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router.query.guild]);

  useEffect(() => {
    if (guildId) joinGuild(guildId);
  }, [guildId]);

  const fetchGuild = useCallback((path) => {
    if (!guildId) return Promise.resolve(null);
    return guildApi(guildId, path);
  }, [guildId]);

  useEffect(() => {
    const socket = getSocket();
    const onXp = () => {};
    socket.on('xp:update', onXp);
    return () => socket.off('xp:update', onXp);
  }, [guildId]);

  return {
    user,
    guilds: user?.guilds || [],
    guildId,
    setGuildId: (id) => {
      setGuildId(id);
      router.push({ query: { ...router.query, guild: id } }, undefined, { shallow: true });
    },
    loading,
    fetchGuild,
  };
}
