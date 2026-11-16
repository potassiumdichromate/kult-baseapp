import type { JobStatus, Predicate } from './types';

export const BASESCAN = 'https://basescan.org';
export const ERC8004_IDENTITY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
export const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export const txUrl = (hash: string) => `${BASESCAN}/tx/${hash}`;
export const addressUrl = (address: string) => `${BASESCAN}/address/${address}`;
export const erc8004Url = (id: string) => `${BASESCAN}/token/${ERC8004_IDENTITY}?a=${id}`;

export function shortHash(value: string, head = 6, tail = 4): string {
  if (!value || value.length <= head + tail + 2) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** USDC has 6 decimals. Base units arrive as decimal strings; never parse them as floats. */
export function usdcFromBaseUnits(baseUnits: string | bigint): string {
  const units = typeof baseUnits === 'bigint' ? baseUnits : BigInt(baseUnits || '0');
  const whole = units / 1_000_000n;
  const cents = (units % 1_000_000n) / 10_000n;
  return `${whole}.${cents.toString().padStart(2, '0')}`;
}

/** At least two decimals, more only when they carry value: "0.5" → "0.50", "0.125" → "0.125". */
export function usdc(value: string): string {
  const [whole, fraction = ''] = value.split('.');
  return `${whole}.${fraction.replace(/0+$/, '').padEnd(2, '0')}`;
}

/** Games the job parser recognises (packages/a2a-protocol parser GAME_ALIASES). */
export const GAMES: Record<string, string> = {
  warzone: 'Warzone',
  'highway-hustle': 'Highway Hustle',
  robowar: 'Robowars',
};

/** Metrics a verifier can measure, so they are the only valid job targets. */
export const TARGET_METRICS = [
  'combatSkill',
  'aggression',
  'adaptability',
  'precision',
  'resilience',
  'creativity',
  'patience',
  'eloRating',
  'winRate',
  'wins',
] as const;

export function gameName(gameId: string | null): string {
  if (!gameId) return 'Any game';
  return GAMES[gameId] ?? titleCase(gameId.replace(/[-_]/g, ' '));
}

const METRICS: Record<string, string> = {
  combatSkill: 'Combat skill',
  aggression: 'Aggression',
  adaptability: 'Adaptability',
  intelligence: 'Intelligence',
  precision: 'Precision',
  resilience: 'Resilience',
  creativity: 'Creativity',
  deception: 'Deception',
  patience: 'Patience',
  loyalty: 'Loyalty',
  eloRating: 'ELO',
  winRate: 'Win rate',
  wins: 'Wins',
  losses: 'Losses',
};

export function metricName(metric: string): string {
  return METRICS[metric] ?? titleCase(metric.replace(/([a-z])([A-Z])/g, '$1 $2'));
}

const OPS: Record<Predicate['op'], string> = { gte: '≥', gt: '>', lte: '≤', lt: '<', eq: '=' };

export function predicate(p: Predicate): string {
  return `${metricName(p.metric)} ${OPS[p.op] ?? p.op} ${p.value}`;
}

export function titleCase(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function duration(seconds: number): string {
  if (seconds % 86_400 === 0) return `${seconds / 86_400} d`;
  if (seconds % 3_600 === 0) return `${seconds / 3_600} h`;
  return `${Math.round(seconds / 60)} min`;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

export type Tone = 'pink' | 'blue' | 'green' | 'gold' | 'red' | 'violet' | 'dim';

/** One word and one colour per status, so a job reads the same on every screen. */
export function jobStatus(status: JobStatus): { label: string; tone: Tone; live: boolean } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', tone: 'dim', live: false };
    case 'POSTED':
      return { label: 'Open', tone: 'pink', live: true };
    case 'NEGOTIATING':
      return { label: 'Taking bids', tone: 'pink', live: true };
    case 'AGREED':
      return { label: 'Agreed', tone: 'gold', live: true };
    case 'ESCROWED':
      return { label: 'Funded', tone: 'blue', live: true };
    case 'EXECUTING':
      return { label: 'In progress', tone: 'blue', live: true };
    case 'DELIVERED':
      return { label: 'Verifying', tone: 'violet', live: true };
    case 'SETTLED':
      return { label: 'Settled', tone: 'green', live: false };
    case 'REFUNDED':
      return { label: 'Refunded', tone: 'red', live: false };
    case 'DISPUTED':
      return { label: 'Disputed', tone: 'red', live: true };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'dim', live: false };
    case 'FAILED':
      return { label: 'Failed', tone: 'red', live: false };
    default:
      return { label: titleCase(String(status)), tone: 'dim', live: false };
  }
}

/** Kult clans to their colour in Kult World. */
export function clanTone(clan: string | null): Tone {
  switch ((clan ?? '').toUpperCase()) {
    case 'ZEROG':
      return 'violet';
    case 'SOLANA':
      return 'green';
    case 'BASE':
      return 'blue';
    case 'ETHEREUM':
      return 'blue';
    default:
      return 'gold';
  }
}

export function initials(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
  const parts = clean.split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase() || '??';
}
