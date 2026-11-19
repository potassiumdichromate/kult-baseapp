/** Shapes returned by the Kult gateway, trimmed to the fields this app reads. */

export type JobStatus =
  | 'DRAFT'
  | 'POSTED'
  | 'NEGOTIATING'
  | 'AGREED'
  | 'ESCROWED'
  | 'EXECUTING'
  | 'DELIVERED'
  | 'SETTLED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'FAILED';

export type JobScope = 'open' | 'active' | 'completed' | 'all';

export interface Predicate {
  metric: string;
  op: 'gte' | 'gt' | 'lte' | 'lt' | 'eq';
  value: number;
}

export interface Job {
  id: string;
  status: JobStatus;
  gameId: string | null;
  prompt: string;
  creatorAgentId: string;
  creatorErc8004Id: string | null;
  requirementsHash: string;
  target: Predicate | null;
  providerRequirements: Predicate[];
  budget: { minBaseUnits: string; maxBaseUnits: string; min: string; max: string; currency: 'USDC' };
  executionWindowSeconds: number;
  parse: { method: string; confidence: number; warnings: string[] } | null;
  agreedPrice: Price | null;
  providerAgentId: string | null;
  providerErc8004Id: string | null;
  verifiedValue: number | null;
  verdict: { accepted: boolean; reason: string | null; reportHash: string | null } | null;
  tx: {
    post: string | null;
    fund: string | null;
    executing: string | null;
    deliver: string | null;
    verdict: string | null;
    reputation: string | null;
  };
  fundedAt: string | null;
  deliveredAt: string | null;
  settledAt: string | null;
  createdAt: string;
  /** A sample listing shown only in demo mode (DEMO=1). */
  demo?: boolean;
}

export interface JobOnChain {
  exists: boolean;
  status: string;
  creatorWallet: string;
  providerWallet: string;
  requirementsHash: string;
  refundClaimable: boolean;
  executionDeadline: number;
  contract: string;
}

export interface JobDetail {
  job: Job;
  verification: { valid: boolean; computedHash: string } | null;
  onChain: JobOnChain | null;
}

export interface Price {
  baseUnits: string;
  display: string;
}

export interface NegotiationMessage {
  seq: number;
  role: 'CREATOR' | 'PROVIDER';
  kind: 'PROPOSE' | 'COUNTER' | 'ACCEPT' | 'DECLINE' | string;
  price: Price | null;
  note: string | null;
}

export interface Negotiation {
  id: string;
  jobId: string;
  providerAgentId: string;
  providerErc8004Id: string | null;
  state: string;
  turn: 'CREATOR' | 'PROVIDER' | null;
  agreedPrice: Price | null;
  messages: NegotiationMessage[];
  createdAt: string;
}

export interface AgentProfile {
  agentId: string;
  name: string;
  clan: string | null;
  archetype: string | null;
  evolutionStage: string | null;
  retired: boolean;
  arena: { elo: number; wins: number; losses: number; draws: number };
  operator: { kind: string; name: string | null; since: string | null } | null;
  erc8004AgentId: string | null;
  /** A sample agent shown only in demo mode (DEMO=1). */
  demo?: boolean;
}

export interface AgentIdentity {
  status: string;
  eoaAddress: string | null;
  ownerWallet: string | null;
  erc8004AgentId: string | null;
  agentURI: string | null;
  registerTxHash: string | null;
}

export interface Reputation {
  totalFeedback: number;
  distinctClients: number;
  averageValue: number | null;
  completionRatePercent: number | null;
}

/** Only the public fields of an agent record. Never the owner's user row. */
export interface AgentPublic {
  backstory: string | null;
  traits: Record<string, number>;
  autoBid: { enabled: boolean; floorBaseUnits: string | null } | null;
  createdAt: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  agentId: string;
  name: string;
  clan: string | null;
  archetype: string | null;
  eloRating: number;
  wins: number;
  losses: number;
  draws: number;
}

/** onchain: a Base transaction backs it. service: a Kult record. demo: a sample listing. */
export type Provenance = 'onchain' | 'service' | 'demo';

/** A run of text in a feed line; runs with an agentId render as a link to that agent. */
export interface FeedPart {
  text: string;
  agentId?: string;
}

export type FeedType =
  | 'job.posted'
  | 'job.bid'
  | 'job.funded'
  | 'job.delivered'
  | 'job.settled'
  | 'job.refunded'
  | 'agent.registered';

export interface FeedEvent {
  id: string;
  type: FeedType;
  occurredAt: string;
  subject: { kind: 'job' | 'agent'; id: string };
  title: FeedPart[];
  detail: string | null;
  amount: { min?: string; max?: string; value?: string; currency: 'USDC' } | null;
  txHash: string | null;
  provenance: Provenance;
}

export interface SessionUser {
  userId: string;
  walletAddress: string;
}

export interface MyAgent {
  id: string;
  name: string;
  clan: string | null;
  archetype: string | null;
  eloRating: number;
  wins: number;
  losses: number;
  erc8004AgentId: string | null;
}

export interface ParsedRequirements {
  gameId: string | null;
  target: Predicate | null;
  providerRequirements: Predicate[];
  method: string;
  confidence: number;
  warnings: string[];
}
