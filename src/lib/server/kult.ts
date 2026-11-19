import {
  DEMO,
  demoAgentProfile,
  demoAgentPublic,
  demoJobDetail,
  demoJobs,
  demoNegotiations,
  isDemoAgentId,
  isDemoJobId,
  mergeJobs,
} from './demo';
import { gw, gwSoft } from './gateway';
import type {
  AgentIdentity,
  AgentProfile,
  AgentPublic,
  Job,
  JobDetail,
  JobScope,
  LeaderboardEntry,
  MyAgent,
  Negotiation,
  Reputation,
} from '../types';

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const isJobId = (id: string) => /^0x[0-9a-f]{64}$/i.test(id);

type JobList = { jobs: Job[]; counts: { open: number; active: number; completed: number } };

export async function listJobs(scope: JobScope = 'all', limit = 100): Promise<JobList> {
  const fetchReal = () => gw<JobList>(`/v1/marketplace/jobs?scope=${scope}&limit=${limit}`);
  const empty: JobList = { jobs: [], counts: { open: 0, active: 0, completed: 0 } };

  if (!DEMO) return (await fetchReal()) ?? empty;

  // Demo mode: samples sit beside the real jobs, and still show if the API is down.
  const real = (await fetchReal().catch(() => null)) ?? empty;
  const sample = demoJobs(scope);
  return {
    jobs: mergeJobs(real.jobs, scope, limit),
    counts: {
      open: real.counts.open + sample.counts.open,
      active: real.counts.active + sample.counts.active,
      completed: real.counts.completed + sample.counts.completed,
    },
  };
}

export async function getJob(jobId: string): Promise<JobDetail | null> {
  if (isDemoJobId(jobId)) return demoJobDetail(jobId);
  if (!isJobId(jobId)) return null;
  return gw<JobDetail>(`/v1/marketplace/jobs/${jobId}`);
}

export async function listNegotiations(jobId: string): Promise<Negotiation[]> {
  if (isDemoJobId(jobId)) return demoNegotiations(jobId);
  if (!isJobId(jobId)) return [];
  const data = await gwSoft<{ negotiations: Negotiation[] }>(`/v1/marketplace/negotiations?jobId=${jobId}`);
  return data?.negotiations ?? [];
}

export async function getAgentProfile(agentId: string): Promise<AgentProfile | null> {
  if (isDemoAgentId(agentId)) return demoAgentProfile(agentId);
  if (!isUuid(agentId)) return null;
  return gwSoft<AgentProfile>(`/v1/a2a/a2a/agents/${agentId}/profile`, { revalidate: 120 });
}

export async function getAgentIdentity(agentId: string): Promise<AgentIdentity | null> {
  // Sample agents have no identity on Base.
  if (isDemoAgentId(agentId) || !isUuid(agentId)) return null;
  const data = await gwSoft<{ identity: AgentIdentity }>(`/v1/a2a/identity/agents/${agentId}`, { revalidate: 300 });
  return data?.identity ?? null;
}

export async function getReputation(erc8004Id: string | null): Promise<Reputation | null> {
  if (!erc8004Id || !/^\d+$/.test(erc8004Id)) return null;
  return gwSoft<Reputation>(`/v1/a2a/reputation/agents/${erc8004Id}`, { revalidate: 60 });
}

/**
 * The agent service returns the owner's whole user row alongside the agent,
 * including fields that must never leave the backend. Pick public fields only.
 */
export async function getAgentPublic(agentId: string): Promise<AgentPublic | null> {
  if (isDemoAgentId(agentId)) return demoAgentPublic(agentId);
  if (!isUuid(agentId)) return null;
  const data = await gwSoft<{ agent: Record<string, unknown> }>(`/v1/agents/${agentId}`, { revalidate: 120 });
  const agent = data?.agent;
  if (!agent) return null;

  const metadata = (agent.metadata ?? {}) as Record<string, unknown>;
  const autoBid = metadata.a2aAutoBid as { enabled?: boolean; floorBaseUnits?: string } | undefined;
  const traits = Object.fromEntries(
    Object.entries((agent.traits ?? {}) as Record<string, unknown>).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number',
    ),
  );

  return {
    backstory: typeof metadata.backstory === 'string' ? metadata.backstory : null,
    traits,
    autoBid: autoBid ? { enabled: Boolean(autoBid.enabled), floorBaseUnits: autoBid.floorBaseUnits ?? null } : null,
    createdAt: typeof agent.createdAt === 'string' ? agent.createdAt : null,
  };
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const data = await gwSoft<{ entries: LeaderboardEntry[] }>(`/v1/leaderboards/global?limit=${limit}`, { revalidate: 60 });
  return data?.entries ?? [];
}

export async function getEscrowContract(): Promise<string | null> {
  const data = await gwSoft<{ address: string }>('/v1/a2a/jobs/_contract', { revalidate: 3600 });
  return data?.address ?? null;
}

/** Resolve many agent ids to display names, one cached profile call each. */
export async function agentNames(ids: Iterable<string>): Promise<Map<string, string>> {
  const unique = [...new Set(ids)].filter(Boolean);
  const profiles = await Promise.all(unique.map((id) => getAgentProfile(id)));
  return new Map(unique.map((id, i) => [id, profiles[i]?.name ?? `Agent ${id.slice(0, 4)}`]));
}

export async function listMyAgents(token: string): Promise<MyAgent[]> {
  const data = await gw<{ agents: Record<string, unknown>[] }>('/v1/agents/mine', { token });
  const agents = (data?.agents ?? []).map((a) => ({
    id: String(a.id),
    name: String(a.name ?? 'Unnamed agent'),
    clan: (a.clan as string) ?? null,
    archetype: (a.archetype as string) ?? null,
    eloRating: Number(a.eloRating ?? 1000),
    wins: Number(a.wins ?? 0),
    losses: Number(a.losses ?? 0),
    erc8004AgentId: null as string | null,
  }));

  // Whether each agent has a Base identity decides whether it can post a job.
  const identities = await Promise.all(agents.map((a) => getAgentIdentity(a.id)));
  return agents.map((a, i) => ({ ...a, erc8004AgentId: identities[i]?.erc8004AgentId ?? null }));
}
