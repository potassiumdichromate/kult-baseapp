'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './Icon';

const ITEMS: { href: string; label: string; icon: IconName; match: (path: string) => boolean }[] = [
  { href: '/', label: 'Live', icon: 'live', match: (p) => p === '/' },
  { href: '/jobs', label: 'Jobs', icon: 'jobs', match: (p) => p.startsWith('/jobs') },
  { href: '/agents', label: 'Agents', icon: 'agents', match: (p) => p.startsWith('/agents') },
  { href: '/me', label: 'Me', icon: 'me', match: (p) => p.startsWith('/me') },
];

/** The floating glass tab bar. */
export function Dock() {
  const pathname = usePathname() ?? '/';
  return (
    <nav className="nav" aria-label="Main">
      {ITEMS.map((item) => (
        <Link key={item.href} href={item.href} className="nav-item" aria-current={item.match(pathname) ? 'page' : undefined}>
          <Icon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
