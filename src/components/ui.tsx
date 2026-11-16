import Link from 'next/link';
import type { ReactNode } from 'react';
import { clanTone, initials, jobStatus, shortHash, txUrl, type Tone } from '@/lib/format';
import type { JobStatus } from '@/lib/types';
import { Icon, type IconName } from './Icon';

const TONE_COLOR: Record<Tone, string> = {
  pink: 'var(--pink)',
  blue: 'var(--blue)',
  green: 'var(--green)',
  gold: 'var(--gold)',
  red: 'var(--red)',
  violet: 'var(--violet-deep)',
  dim: '#5d5480',
};

export function ScreenHead({ eyebrow, title, children }: { eyebrow: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="screen-head">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children ? <p className="muted">{children}</p> : null}
    </header>
  );
}

export function Money({ value, min, max, currency = 'USDC', size }: {
  value?: string;
  min?: string;
  max?: string;
  currency?: string;
  size?: number;
}) {
  const amount = value ?? (min === max ? min : `${min}–${max}`);
  return (
    <span className="money" style={size ? { fontSize: size } : undefined}>
      {amount}
      <span className="cur">{currency}</span>
    </span>
  );
}

export function StatusWord({ status }: { status: JobStatus }) {
  const s = jobStatus(status);
  return (
    <span className={`status t-${s.tone}`}>
      <span className={`dot${s.live ? ' live' : ''}`} />
      {s.label}
    </span>
  );
}

export function Tag({ tone = 'violet', children }: { tone?: Tone | 'base'; children: ReactNode }) {
  return <span className={`tag t-${tone}`}>{children}</span>;
}

export function AgentAvatar({ name, clan, size }: { name: string; clan?: string | null; size?: 'xs' | 'sm' | 'lg' }) {
  return (
    <span className={`avatar${size ? ` ${size}` : ''}`} style={{ ['--c' as string]: TONE_COLOR[clanTone(clan ?? null)] }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function IconTile({ name, color, small }: { name: IconName; color: string; small?: boolean }) {
  return (
    <span className={`tile${small ? ' sm' : ''}`} style={{ ['--c' as string]: color }} aria-hidden="true">
      <Icon name={name} />
    </span>
  );
}

export function ChainLink({ hash, label = 'BaseScan' }: { hash: string; label?: string }) {
  return (
    <a className="chain-link" href={txUrl(hash)} target="_blank" rel="noreferrer" aria-label={`View transaction ${shortHash(hash)} on BaseScan`}>
      {label}
      <Icon name="external" size={13} />
    </a>
  );
}

export function QuietLink({ href, children = 'View' }: { href: string; children?: ReactNode }) {
  return (
    <Link className="quiet" href={href}>
      {children}
      <Icon className="arrow" name="arrow" size={14} />
    </Link>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children ? <p className="muted">{children}</p> : null}
      {action}
    </div>
  );
}

export function Notice({ tone = 'blue', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={`notice t-${tone}`}>
      <Icon name="info" size={17} />
      <div>{children}</div>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="quiet" style={{ alignSelf: 'flex-start' }}>
      <Icon name="back" size={14} />
      {children}
    </Link>
  );
}
