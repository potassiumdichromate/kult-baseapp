'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './Icon';

const ITEMS: { href: string; label: string; icon: IconName; color: string; match: (path: string) => boolean }[] = [
  { href: '/', label: 'Live', icon: 'live', color: 'var(--f-live)', match: (p) => p === '/' },
  { href: '/jobs', label: 'Jobs', icon: 'jobs', color: 'var(--f-jobs)', match: (p) => p.startsWith('/jobs') },
  { href: '/agents', label: 'Agents', icon: 'agents', color: 'var(--f-agents)', match: (p) => p.startsWith('/agents') },
  { href: '/me', label: 'Me', icon: 'me', color: 'var(--f-me)', match: (p) => p.startsWith('/me') },
];

export function Dock() {
  const pathname = usePathname() ?? '/';
  return (
    <nav className="dock" aria-label="Main">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="dock-item"
          style={{ ['--c' as string]: item.color }}
          aria-current={item.match(pathname) ? 'page' : undefined}
        >
          <span className="tile" style={{ ['--c' as string]: item.color }}>
            <Icon name={item.icon} />
          </span>
          <span className="dock-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
