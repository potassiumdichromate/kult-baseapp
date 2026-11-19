/**
 * Sample listings for demos, switched on with DEMO=1 (off with DEMO=0 or unset).
 *
 * They sit beside the real jobs from the Kult API and cover every Kult
 * platform: Warzone, Highway Hustle, Sports Prediction, Kult Dex and
 * Syndicates, in every state (posted, in progress, settled).
 *
 * They render like real listings, with three limits:
 * - No transaction hashes, escrow contract or ERC-8004 identity, so nothing
 *   here links to BaseScan or says it is on Base. Borrowing hashes from real
 *   jobs would make BaseScan vouch for jobs that never ran.
 * - Nothing is written to the backend, so no settlement or reputation loop
 *   ever sees these ids.
 * - Ids use a fixed `de30de30` prefix and only resolve while DEMO=1.
 */

import { keccak256, toHex } from 'viem';
import type {
  AgentProfile,
  AgentPublic,
  Job,
  JobDetail,
  JobScope,
  JobStatus,
  Negotiation,
  Predicate,
} from '../types';

export const DEMO = process.env.DEMO === '1';

const PREFIX = 'de30de30';
export const isDemoJobId = (id: string) => DEMO && id.toLowerCase().startsWith(`0x${PREFIX}`);
export const isDemoAgentId = (id: string) => DEMO && id.toLowerCase().startsWith(`${PREFIX}-`);

const jobId = (n: number) => `0x${PREFIX}${n.toString(16).padStart(56, '0')}`;
const agentId = (n: number) => `${PREFIX}-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
const negotiationId = (job: number, n: number) => `${PREFIX}-${job.toString(16).padStart(4, '0')}-4000-8000-${n.toString(16).padStart(12, '0')}`;

/** Same lifecycle groups the marketplace service uses for its scopes. */
const BY_SCOPE: Record<Exclude<JobScope, 'all'>, JobStatus[]> = {
  open: ['POSTED', 'NEGOTIATING'],
  active: ['ESCROWED', 'EXECUTING', 'DELIVERED'],
  completed: ['SETTLED', 'REFUNDED', 'DISPUTED', 'CANCELLED'],
};

// ── Agents ────────────────────────────────────────────────────────────────

interface AgentSeed {
  name: string;
  clan: string;
  archetype: string;
  elo: number;
  wins: number;
  losses: number;
  backstory: string;
  traits: Record<string, number>;
}

const AGENTS: AgentSeed[] = [
  { name: 'Kestrel-9', clan: 'BASE', archetype: 'Tactician', elo: 1284, wins: 41, losses: 12, backstory: 'Reads a firefight three moves ahead and coaches other agents to do the same.', traits: { combatSkill: 82, precision: 77, adaptability: 69, patience: 58 } },
  { name: 'Driftline', clan: 'SOLANA', archetype: 'Berserker', elo: 1196, wins: 33, losses: 15, backstory: 'Lives in the fast lane. Trains drivers to take risks that pay.', traits: { aggression: 88, adaptability: 64, precision: 61, patience: 31 } },
  { name: 'Oddsmith', clan: 'ZEROG', archetype: 'Analyst', elo: 1232, wins: 38, losses: 14, backstory: 'Prices every match before kickoff and keeps a public record of its calls.', traits: { intelligence: 86, patience: 74, precision: 71, creativity: 52 } },
  { name: 'Nyx Ledger', clan: 'ETHEREUM', archetype: 'Analyst', elo: 1251, wins: 36, losses: 11, backstory: 'Backtests every signal before it trades, then publishes the hit rate.', traits: { intelligence: 84, patience: 81, precision: 79, aggression: 22 } },
  { name: 'Sable Fox', clan: 'ZEROG', archetype: 'Support', elo: 1178, wins: 29, losses: 16, backstory: 'Runs intelligence for syndicates: who is bluffing, who is buying.', traits: { intelligence: 80, deception: 72, loyalty: 77, adaptability: 66 } },
  { name: 'Ironveil', clan: 'BASE', archetype: 'Defender', elo: 1163, wins: 27, losses: 14, backstory: 'Hard to kill and patient. Hired when a squad keeps losing the late game.', traits: { resilience: 89, combatSkill: 71, patience: 70, aggression: 45 } },
  { name: 'Mira Quant', clan: 'SOLANA', archetype: 'Analyst', elo: 1219, wins: 34, losses: 13, backstory: 'Turns order flow into calls on Kult Dex, long or short, never in between.', traits: { intelligence: 83, precision: 76, adaptability: 72, patience: 63 } },
  { name: 'Halcyon', clan: 'ETHEREUM', archetype: 'Tactician', elo: 1141, wins: 24, losses: 15, backstory: 'Plays the table, not the hand. Brokers deals between rival syndicates.', traits: { intelligence: 78, deception: 68, creativity: 74, loyalty: 60 } },
  { name: 'Brightwater', clan: 'BASE', archetype: 'Support', elo: 1122, wins: 22, losses: 16, backstory: 'Studies form, injuries and weather, and writes it all down.', traits: { intelligence: 75, patience: 77, precision: 66, creativity: 49 } },
  { name: 'Vantablack', clan: 'ZEROG', archetype: 'Berserker', elo: 1207, wins: 35, losses: 17, backstory: 'Takes the corners nobody else will and teaches the line afterwards.', traits: { aggression: 84, combatSkill: 73, precision: 68, resilience: 57 } },
];

const AGENT_IDS = AGENTS.map((_, i) => agentId(i + 1));

function demoProfile(index: number): AgentProfile {
  const a = AGENTS[index];
  return {
    agentId: AGENT_IDS[index],
    name: a.name,
    clan: a.clan,
    archetype: a.archetype,
    evolutionStage: 'GENESIS',
    retired: false,
    arena: { elo: a.elo, wins: a.wins, losses: a.losses, draws: 0 },
    operator: null,
    erc8004AgentId: null,
    demo: true,
  };
}

export function demoAgentProfile(id: string): AgentProfile | null {
  const index = AGENT_IDS.indexOf(id.toLowerCase());
  return index === -1 ? null : demoProfile(index);
}

export function demoAgentPublic(id: string): AgentPublic | null {
  const index = AGENT_IDS.indexOf(id.toLowerCase());
  if (index === -1) return null;
  return { backstory: AGENTS[index].backstory, traits: AGENTS[index].traits, autoBid: null, createdAt: null };
}

// ── Jobs ──────────────────────────────────────────────────────────────────

interface JobSeed {
  platform: 'warzone' | 'highway-hustle' | 'sports-prediction' | 'kult-dex' | 'syndicates';
  status: JobStatus;
  /** Indexes into AGENTS. */
  creator: number;
  provider?: number;
  bidders?: number[];
  target: Predicate;
  prompt: string;
  min: string;
  max: string;
  price?: string;
  /** How long ago it was posted. */
  hoursAgo: number;
  /** What the verifier measured, for settled or refunded jobs. */
  measured?: number;
}

const JOBS: JobSeed[] = [
  // Warzone
  { platform: 'warzone', status: 'NEGOTIATING', creator: 5, bidders: [0, 9], target: { metric: 'combatSkill', op: 'gte', value: 70 }, prompt: 'Train my Warzone agent to a combat skill of 70 or more before the weekend league', min: '0.60', max: '1.20', hoursAgo: 2 },
  { platform: 'warzone', status: 'EXECUTING', creator: 9, provider: 0, bidders: [0, 5], target: { metric: 'precision', op: 'gte', value: 65 }, prompt: 'Coach my agent on long-range engagements until precision reaches 65', min: '0.80', max: '1.50', price: '1.10', hoursAgo: 9 },
  { platform: 'warzone', status: 'SETTLED', creator: 1, provider: 5, bidders: [5, 0], target: { metric: 'resilience', op: 'gte', value: 60 }, prompt: 'Make my Warzone agent harder to kill in the final circle, resilience 60+', min: '0.50', max: '1.00', price: '0.75', hoursAgo: 30, measured: 64 },

  // Highway Hustle
  { platform: 'highway-hustle', status: 'POSTED', creator: 3, target: { metric: 'aggression', op: 'gte', value: 70 }, prompt: 'I want my Highway Hustle driver to overtake harder, aggression 70 or more', min: '0.40', max: '0.90', hoursAgo: 1 },
  { platform: 'highway-hustle', status: 'DELIVERED', creator: 7, provider: 1, bidders: [1, 9], target: { metric: 'wins', op: 'gte', value: 5 }, prompt: 'Win five Highway Hustle races in a row with my car', min: '1.00', max: '2.00', price: '1.60', hoursAgo: 14 },
  { platform: 'highway-hustle', status: 'SETTLED', creator: 0, provider: 9, bidders: [9, 1], target: { metric: 'adaptability', op: 'gte', value: 65 }, prompt: 'Teach my driver to handle rain and night tracks, adaptability 65+', min: '0.50', max: '1.00', price: '0.85', hoursAgo: 52, measured: 69 },

  // Sports Prediction
  { platform: 'sports-prediction', status: 'NEGOTIATING', creator: 6, bidders: [2, 8], target: { metric: 'predictionAccuracy', op: 'gte', value: 70 }, prompt: 'Call this weekend\'s Premier League results with at least 70% accuracy', min: '1.00', max: '2.50', hoursAgo: 3 },
  { platform: 'sports-prediction', status: 'ESCROWED', creator: 3, provider: 8, bidders: [8, 2], target: { metric: 'predictionAccuracy', op: 'gte', value: 65 }, prompt: 'Predict NBA game winners for the next 20 games, 65% or better', min: '1.50', max: '3.00', price: '2.20', hoursAgo: 7 },
  { platform: 'sports-prediction', status: 'SETTLED', creator: 4, provider: 2, bidders: [2, 8], target: { metric: 'predictionAccuracy', op: 'gte', value: 60 }, prompt: 'Pick the Champions League group stage winners at 60% accuracy or more', min: '1.00', max: '2.00', price: '1.40', hoursAgo: 70, measured: 68 },

  // Kult Dex
  { platform: 'kult-dex', status: 'POSTED', creator: 2, target: { metric: 'dexAccuracy', op: 'gte', value: 60 }, prompt: 'Run a trading desk on Kult Dex and call ETH direction at 60% accuracy over 30 signals', min: '2.00', max: '4.00', hoursAgo: 1.5 },
  { platform: 'kult-dex', status: 'EXECUTING', creator: 4, provider: 6, bidders: [6, 3], target: { metric: 'dexAccuracy', op: 'gte', value: 62 }, prompt: 'Give my desk SOL signals for a week, at least 62% of them right', min: '2.50', max: '5.00', price: '3.80', hoursAgo: 20 },
  { platform: 'kult-dex', status: 'REFUNDED', creator: 7, provider: 3, bidders: [3, 6], target: { metric: 'dexAccuracy', op: 'gte', value: 65 }, prompt: 'BTC breakout calls for the week, 65% accuracy or I get my USDC back', min: '2.00', max: '4.00', price: '3.00', hoursAgo: 96, measured: 58 },

  // Syndicates
  { platform: 'syndicates', status: 'NEGOTIATING', creator: 0, bidders: [4, 7], target: { metric: 'intelligence', op: 'gte', value: 75 }, prompt: 'Scout the rival syndicate before Friday\'s heist and raise our intelligence to 75', min: '0.80', max: '1.60', hoursAgo: 4 },
  { platform: 'syndicates', status: 'EXECUTING', creator: 1, provider: 7, bidders: [7, 4], target: { metric: 'intelligence', op: 'gte', value: 70 }, prompt: 'Run intelligence for my syndicate this season, intelligence 70 or more', min: '1.20', max: '2.40', price: '1.90', hoursAgo: 11 },
  { platform: 'syndicates', status: 'SETTLED', creator: 8, provider: 4, bidders: [4, 7], target: { metric: 'intelligence', op: 'gte', value: 72 }, prompt: 'Find out who is leaking our plans inside the syndicate, intelligence 72+', min: '1.00', max: '2.00', price: '1.50', hoursAgo: 44, measured: 77 },
];

const HOUR = 3_600_000;

/** Time to deliver once funded: a session for games, a match week for sports, a week of signals. */
const WINDOW: Record<JobSeed['platform'], number> = {
  warzone: 6 * 3_600,
  'highway-hustle': 6 * 3_600,
  'sports-prediction': 3 * 86_400,
  'kult-dex': 7 * 86_400,
  syndicates: 7 * 86_400,
};
const toBaseUnits = (amount: string) => {
  const [whole, fraction = ''] = amount.split('.');
  return (BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0').slice(0, 6))).toString();
};
const price = (amount: string) => ({ baseUnits: toBaseUnits(amount), display: amount });

/** Anchored to the current hour, so "2h ago" stays put between page loads. */
function anchor(): number {
  return Math.floor(Date.now() / HOUR) * HOUR;
}

const reached = (status: JobStatus, stage: JobStatus[]) => stage.includes(status);

function buildJob(seed: JobSeed, index: number, now: number): Job {
  const created = now - seed.hoursAgo * HOUR;
  const funded = reached(seed.status, ['ESCROWED', 'EXECUTING', 'DELIVERED', 'SETTLED', 'REFUNDED']) ? created + 1.5 * HOUR : null;
  const delivered = funded && reached(seed.status, ['DELIVERED', 'SETTLED', 'REFUNDED']) ? Math.min(funded + 4 * HOUR, now - 0.5 * HOUR) : null;
  const settled = delivered && reached(seed.status, ['SETTLED', 'REFUNDED']) ? Math.min(delivered + 0.5 * HOUR, now) : null;
  const iso = (t: number | null) => (t === null ? null : new Date(t).toISOString());

  return {
    id: jobId(index + 1),
    status: seed.status,
    gameId: seed.platform,
    prompt: seed.prompt,
    creatorAgentId: AGENT_IDS[seed.creator],
    creatorErc8004Id: null,
    requirementsHash: keccak256(toHex(`${seed.platform}|${seed.prompt}`)),
    target: seed.target,
    providerRequirements: [],
    budget: { minBaseUnits: toBaseUnits(seed.min), maxBaseUnits: toBaseUnits(seed.max), min: seed.min, max: seed.max, currency: 'USDC' },
    executionWindowSeconds: WINDOW[seed.platform],
    parse: null,
    agreedPrice: seed.price && seed.provider !== undefined ? price(seed.price) : null,
    providerAgentId: seed.provider !== undefined ? AGENT_IDS[seed.provider] : null,
    providerErc8004Id: null,
    verifiedValue: settled ? (seed.measured ?? null) : null,
    verdict: settled
      ? {
          accepted: seed.status === 'SETTLED',
          reason: seed.status === 'SETTLED' ? 'Target met' : 'Target not met, budget returned',
          reportHash: null,
        }
      : null,
    tx: { post: null, fund: null, executing: null, deliver: null, verdict: null, reputation: null },
    fundedAt: iso(funded),
    deliveredAt: iso(delivered),
    settledAt: iso(settled),
    createdAt: new Date(created).toISOString(),
    demo: true,
  };
}

function allJobs(): Job[] {
  const now = anchor();
  return JOBS.map((seed, i) => buildJob(seed, i, now));
}

export function demoJobs(scope: JobScope): { jobs: Job[]; counts: { open: number; active: number; completed: number } } {
  const jobs = allJobs();
  const inScope = (s: Exclude<JobScope, 'all'>) => jobs.filter((j) => BY_SCOPE[s].includes(j.status));
  return {
    jobs: scope === 'all' ? jobs : inScope(scope),
    counts: { open: inScope('open').length, active: inScope('active').length, completed: inScope('completed').length },
  };
}

export function demoJobDetail(id: string): JobDetail | null {
  const job = allJobs().find((j) => j.id === id.toLowerCase());
  return job ? { job, verification: null, onChain: null } : null;
}

export function demoNegotiations(id: string): Negotiation[] {
  const index = allJobs().findIndex((j) => j.id === id.toLowerCase());
  if (index === -1) return [];
  const seed = JOBS[index];
  const created = anchor() - seed.hoursAgo * HOUR;

  return (seed.bidders ?? []).map((bidder, n): Negotiation => {
    const won = bidder === seed.provider && seed.price !== undefined;
    const ask = won
      ? seed.price!
      : (Number(seed.min) + ((Number(seed.max) - Number(seed.min)) * (n + 1)) / 3).toFixed(2);
    const agreed = won ? price(seed.price!) : null;
    const lost = seed.provider !== undefined && !won;
    return {
      id: negotiationId(index + 1, n + 1),
      jobId: jobId(index + 1),
      providerAgentId: AGENT_IDS[bidder],
      providerErc8004Id: null,
      state: won ? 'AGREED' : lost ? 'DECLINED' : 'OPEN',
      turn: won || lost ? null : 'CREATOR',
      agreedPrice: agreed,
      messages: [
        { seq: 1, role: 'PROVIDER', kind: 'PROPOSE', price: price(ask), note: null },
        ...(won ? [{ seq: 2, role: 'CREATOR' as const, kind: 'ACCEPT', price: price(ask), note: null }] : []),
      ],
      createdAt: new Date(created + (n + 1) * 20 * 60_000).toISOString(),
    };
  });
}

/** Real and sample jobs together, newest first, trimmed to `limit`. */
export function mergeJobs(real: Job[], scope: JobScope, limit: number): Job[] {
  const byNewest = (a: Job, b: Job) => b.createdAt.localeCompare(a.createdAt);
  return [...real, ...demoJobs(scope).jobs].sort(byNewest).slice(0, limit);
}
