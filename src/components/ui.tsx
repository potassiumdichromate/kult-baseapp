import Link from 'next/link';
import type { ReactNode } from 'react';
import { clanTone, initials, jobStatus, shortHash, txUrl, type Tone } from '@/lib/format';
import type { JobStatus } from '@/lib/types';
import { Icon, type IconName } from './Icon';

const TONE_COLOR: Record<Tone, string> = {
  violet: 'var(--violet)',
  blue: 'var(--blue)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  dim: 'var(--dim)',
};

export function PageHead({ title, action, children }: { title: ReactNode; action?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="spread" style={{ alignItems: 'flex-end' }}>
        <h1>{title}</h1>
        {action}
      </div>
      {children ? <p className="muted">{children}</p> : null}
    </header>
  );
}

export function SectionHead({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {children}
    </div>
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
  return <span className={`status t-${s.tone}`}>{s.label}</span>;
}

export function Tag({ tone, children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`tag${tone ? ` t-${tone}` : ''}`}>{children}</span>;
}

export function AgentAvatar({ name, clan, size }: { name: string; clan?: string | null; size?: 'xs' | 'sm' | 'lg' }) {
  return (
    <span className={`avatar${size ? ` ${size}` : ''}`} style={{ ['--c' as string]: TONE_COLOR[clanTone(clan ?? null)] }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function IconCircle({ name }: { name: IconName }) {
  return (
    <span className="icon-circle" aria-hidden="true">
      <Icon name={name} />
    </span>
  );
}

export function ExternalLink({ href, children, label }: { href: string; children: ReactNode; label?: string }) {
  return (
    <a className="link" href={href} target="_blank" rel="noreferrer" aria-label={label}>
      {children}
      <Icon name="external" size={12} />
    </a>
  );
}

export function ChainLink({ hash, label = 'BaseScan' }: { hash: string; label?: string }) {
  return (
    <ExternalLink href={txUrl(hash)} label={`View transaction ${shortHash(hash)} on BaseScan`}>
      {label}
    </ExternalLink>
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

export function Notice({ tone, children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={`notice${tone ? ` t-${tone}` : ''}`}>
      <Icon name="info" size={16} />
      <div>{children}</div>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="back">
      <Icon name="back" size={16} />
      {children}
    </Link>
  );
}
