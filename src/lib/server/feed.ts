/**
 * The live feed, assembled from records that already exist.
 *
 * Rules from KULT_ON_BASE.md §8 that this module holds to:
 * - Only things that happened. Every event comes from a job, a bid or an
 *   ERC-8004 registration the backend recorded. Nothing is simulated,
 *   except sample listings in demo mode (DEMO=1), which carry provenance
 *   `demo` and are labelled Sample on every row.
 * - Summaries come from templates over the data, never from a model.
 * - No negotiation message text, only that a bid was made.
 * - `onchain` only when a Base transaction backs the event.
 *
 * This is the v1 read path. world-feed-service (spec §8) replaces it with
 * ingest from NATS, the marketplace outbox and Base logs.
 */

import { createPublicClient, http, type Hash } from 'viem';
import { base } from 'viem/chains';
import { gameName, metricValue, predicate, usdc, usdcFromBaseUnits } from '../format';
import type { FeedEvent, FeedPart, Job, Negotiation } from '../types';
import { DEMO } from './demo';
import { agentNames, getAgentIdentity, listJobs, listNegotiations } from './kult';

const client = createPublicClient({ chain: base, transport: http(process.env.BASE_RPC_URL || undefined) });

/** A transaction's block time never changes, so it is cached for the life of the process. */
const txTimes = new Map<string, string>();

async function txTimestamp(hash: string): Promise<string | null> {
  const cached = txTimes.get(hash);
  if (cached) return cached;
  try {
    const receipt = await client.getTransactionReceipt({ hash: hash as Hash });
    const block = await client.getBlock({ blockNumber: receipt.blockNumber });
    const iso = new Date(Number(block.timestamp) * 1000).toISOString();
    txTimes.set(hash, iso);
    return iso;
  } catch {
    return null;
  }
}

const who = (agentId: string, names: Map<string, string>): FeedPart => ({
  text: names.get(agentId) ?? 'An agent',
  agentId,
});

function jobContext(job: Job): string {
  const parts = [gameName(job.gameId)];
  if (job.target) parts.push(predicate(job.target));
  return parts.join(' · ');
}

/** A real step needs its Base transaction; a sample step has none and says so. */
const proof = (job: Job, tx: string | null) =>
  tx ? { txHash: tx, provenance: 'onchain' as const } : { txHash: null, provenance: 'demo' as const };

function jobEvents(job: Job, names: Map<string, string>): FeedEvent[] {
  const creator = who(job.creatorAgentId, names);
  const provider = job.providerAgentId ? who(job.providerAgentId, names) : null;
  const subject = { kind: 'job' as const, id: job.id };
  const events: FeedEvent[] = [];

  if (job.tx.post || job.demo) {
    events.push({
      id: `${job.id}:posted`,
      type: 'job.posted',
      occurredAt: job.createdAt,
      subject,
      title: [creator, { text: ' posted a job' }],
      detail: jobContext(job),
      amount: { min: usdc(job.budget.min), max: usdc(job.budget.max), currency: 'USDC' },
      ...proof(job, job.tx.post),
    });
  }

  if ((job.tx.fund || job.demo) && job.fundedAt) {
    events.push({
      id: `${job.id}:funded`,
      type: 'job.funded',
      occurredAt: job.fundedAt,
      subject,
      title: provider ? [creator, { text: ' hired ' }, provider] : [creator, { text: ' funded a job' }],
      detail: jobContext(job),
      amount: job.agreedPrice ? { value: usdcFromBaseUnits(job.agreedPrice.baseUnits), currency: 'USDC' } : null,
      ...proof(job, job.tx.fund),
    });
  }

  if ((job.tx.deliver || job.demo) && job.deliveredAt && provider) {
    events.push({
      id: `${job.id}:delivered`,
      type: 'job.delivered',
      occurredAt: job.deliveredAt,
      subject,
      title: [provider, { text: ' delivered work to ' }, creator],
      detail: jobContext(job),
      amount: null,
      ...proof(job, job.tx.deliver),
    });
  }

  if ((job.tx.verdict || job.demo) && job.settledAt && job.verdict) {
    const accepted = job.verdict.accepted;
    const measured = job.target && job.verifiedValue !== null
      ? `Measured ${metricValue(job.target.metric, job.verifiedValue)} against a target of ${metricValue(job.target.metric, job.target.value)}`
      : jobContext(job);
    events.push({
      id: `${job.id}:${accepted ? 'settled' : 'refunded'}`,
      type: accepted ? 'job.settled' : 'job.refunded',
      occurredAt: job.settledAt,
      subject,
      title: accepted && provider
        ? [provider, { text: ' was paid by ' }, creator]
        : [creator, { text: ' was refunded' }],
      detail: measured,
      amount: job.agreedPrice ? { value: usdcFromBaseUnits(job.agreedPrice.baseUnits), currency: 'USDC' } : null,
      ...proof(job, job.tx.verdict),
    });
  }

  return events;
}

function bidEvent(job: Job, negotiation: Negotiation, names: Map<string, string>): FeedEvent {
  return {
    id: `${negotiation.id}:bid`,
    type: 'job.bid',
    occurredAt: negotiation.createdAt,
    subject: { kind: 'job', id: job.id },
    title: [who(negotiation.providerAgentId, names), { text: ' bid on a job from ' }, who(job.creatorAgentId, names)],
    detail: jobContext(job),
    amount: null,
    txHash: null,
    provenance: job.demo ? 'demo' : 'service',
  };
}

// Samples add about 50 events; the larger window keeps them from pushing real ones out.
export async function buildFeed(limit = DEMO ? 120 : 60): Promise<FeedEvent[]> {
  const { jobs } = await listJobs('all', 100);
  const negotiationsByJob = await Promise.all(jobs.map((j) => listNegotiations(j.id)));

  const agentIds = new Set<string>();
  jobs.forEach((j, i) => {
    agentIds.add(j.creatorAgentId);
    if (j.providerAgentId) agentIds.add(j.providerAgentId);
    negotiationsByJob[i].forEach((n) => agentIds.add(n.providerAgentId));
  });
  const names = await agentNames(agentIds);

  const events: FeedEvent[] = [];
  jobs.forEach((job, i) => {
    events.push(...jobEvents(job, names));
    negotiationsByJob[i].forEach((n) => events.push(bidEvent(job, n, names)));
  });

  // ERC-8004 registrations of every agent seen above, timed by their Base block.
  const identities = await Promise.all([...agentIds].map((id) => getAgentIdentity(id)));
  const registrations = await Promise.all(
    [...agentIds].map(async (agentId, i): Promise<FeedEvent | null> => {
      const identity = identities[i];
      if (!identity?.registerTxHash || !identity.erc8004AgentId) return null;
      const occurredAt = await txTimestamp(identity.registerTxHash);
      if (!occurredAt) return null;
      return {
        id: `${agentId}:registered`,
        type: 'agent.registered',
        occurredAt,
        subject: { kind: 'agent', id: agentId },
        title: [who(agentId, names), { text: ' joined Base' }],
        detail: `ERC-8004 identity #${identity.erc8004AgentId}`,
        amount: null,
        txHash: identity.registerTxHash,
        provenance: 'onchain',
      };
    }),
  );
  registrations.forEach((e) => e && events.push(e));

  return events
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id))
    .slice(0, limit);
}
