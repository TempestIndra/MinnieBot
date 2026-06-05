import Link from 'next/link';
import { useRouter } from 'next/router';
import { logout } from '../lib/api';

const NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/xp', label: 'XP Config' },
  { href: '/dashboard/levels', label: 'Levels' },
  { href: '/dashboard/channels', label: 'Channels' },
  { href: '/dashboard/economy', label: 'Economy' },
  { href: '/dashboard/leaderboard', label: 'Leaderboard' },
  { href: '/dashboard/users', label: 'Users' },
  { href: '/dashboard/logs', label: 'Logs' },
  { href: '/dashboard/analytics', label: 'Analytics' },
];

export default function Layout({ children, guildId, guilds, onGuildChange }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-surface border-r border-gray-800 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-discord">Minnie XP</h1>
          <button
            type="button"
            onClick={() => logout().then(() => router.push('/login'))}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Logout
          </button>
        </div>
        <select
          className="bg-surface-light rounded px-3 py-2 text-sm"
          value={guildId || ''}
          onChange={(e) => onGuildChange?.(e.target.value)}
        >
          <option value="">Select server</option>
          {guilds?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={guildId ? `${item.href}?guild=${guildId}` : item.href}
              className={`px-3 py-2 rounded text-sm hover:bg-surface-light ${
                router.pathname === item.href ? 'bg-surface-light text-white' : 'text-gray-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
