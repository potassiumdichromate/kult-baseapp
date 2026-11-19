import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';
import { AgentAvatar, BackLink, ChainLink, ExternalLink, Money, Notice, SectionHead, StatusWord, Tag } from '@/components/ui';
import {
  addressUrl,
  dateTime,
  duration,
  gameName,
  metricValue,
  predicate,
  shortHash,
  usdc,
} from '@/lib/format';
import { GATEWAY_URL } from '@/lib/server/gateway';
import { getAgentProfile, getJob, listNegotiations } from '@/lib/server/kult';
import type { AgentProfile, Job, Negotiation } from '@/lib/types';

export const revalidate = 15;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const detail = await getJob(params.id).catch(() => null);
  if (!detail) return { title: 'Job' };
  const { job } = detail;
  const title = job.target ? predicate(job.target) : 'A job on Base';
  return {
    title,
    description: `${gameName(job.gameId)} · ${usdc(job.budget.min)}–${usdc(job.budget.max)} USDC in escrow on Base`,
  };
}

type StepState = 'done' | 'current' | 'pending';
interface Step {
  title: string;
  note: string | null;
  tx: string | null;
  state: StepState;
}

function lifecycle(job: Job, bidCount: number): Step[] {
  const refunded = job.status === 'REFUNDED' || job.verdict?.accepted === false;
  const steps: Omit<Step, 'state'>[] = [
    { title: job.demo ? 'Posted' : 'Posted on Base', note: dateTime(job.createdAt), tx: job.tx.post },
    {
      title: job.providerAgentId ? 'Provider chosen' : 'Taking bids',
      note: job.agreedPrice
        ? `Agreed at ${usdc(job.agreedPrice.display)} USDC`
        : bidCount
          ? `${bidCount} ${bidCount === 1 ? 'agent has' : 'agents have'} bid`
          : 'Matching agents are notified',
      tx: null,
    },
    { title: 'Funded in escrow', note: job.fundedAt ? dateTime(job.fundedAt) : 'USDC moves into escrow on Base', tx: job.tx.fund },
    { title: 'Work in progress', note: `${duration(job.executionWindowSeconds)} to deliver once funded`, tx: job.tx.executing },
    { title: 'Delivered', note: job.deliveredAt ? dateTime(job.deliveredAt) : null, tx: job.tx.deliver },
    {
      title: refunded ? 'Refunded' : 'Verified and paid',
      note: job.verdict
        ? job.verifiedValue !== null && job.target
          ? `Measured ${metricValue(job.target.metric, job.verifiedValue)} against a target of ${metricValue(job.target.metric, job.target.value)}`
          : job.verdict.reason
        : 'A verifier re-runs the test before any USDC moves',
      tx: job.tx.verdict,
    },
  ];

  // A real step is done when its Base transaction exists. A sample job has no
  // transactions, so its steps follow the recorded times instead.
  const sample = Boolean(job.demo);
  const doneFlags = [
    Boolean(job.tx.post) || sample,
    Boolean(job.providerAgentId || job.agreedPrice),
    Boolean(job.tx.fund) || (sample && Boolean(job.fundedAt)),
    Boolean(job.tx.executing || job.tx.deliver) || (sample && Boolean(job.fundedAt)),
    Boolean(job.tx.deliver) || (sample && Boolean(job.deliveredAt)),
    Boolean(job.tx.verdict) || (sample && Boolean(job.settledAt)),
  ];
  const terminal = ['SETTLED', 'REFUNDED', 'CANCELLED', 'FAILED'].includes(job.status);
  const firstOpen = doneFlags.findIndex((d) => !d);

  return steps.map((s, i) => ({
    ...s,
    state: doneFlags[i] ? 'done' : !terminal && i === firstOpen ? 'current' : 'pending',
  }));
}

function lastPrice(n: Negotiation): string | null {
  const priced = [...n.messages].reverse().find((m) => m.price);
  return priced?.price ? usdc(priced.price.display) : null;
}

export default async function JobPage({ params }: { params: { id: string } }) {
  const detail = await getJob(params.id).catch(() => null);
  if (!detail) notFound();
  const { job, verification, onChain } = detail;

  const negotiations = await listNegotiations(job.id);
  const agentIds = [job.creatorAgentId, ...negotiations.map((n) => n.providerAgentId)];
  if (job.providerAgentId) agentIds.push(job.providerAgentId);
  const profiles = new Map<string, AgentProfile | null>();
  await Promise.all([...new Set(agentIds)].map(async (id) => profiles.set(id, await getAgentProfile(id))));

  const creator = profiles.get(job.creatorAgentId);
  const creatorName = creator?.name ?? 'Agent';
  const steps = lifecycle(job, negotiations.length);
  // The stored document re-hashes to the committed hash, and Base holds that same hash.
  const hashMatches =
    Boolean(verification?.valid) && onChain?.requirementsHash?.toLowerCase() === job.requirementsHash.toLowerCase();

  return (
    <>
      <BackLink href="/jobs">Job board</BackLink>

      <header className="page-head">
        <div className="row wrap" style={{ gap: 8 }}>
          <Tag>{gameName(job.gameId)}</Tag>
          {job.demo ? <Tag tone="dim">Sample</Tag> : null}
          <StatusWord status={job.status} />
        </div>
        <h1>{job.target ? predicate(job.target) : 'Target to be confirmed'}</h1>
        <p className="muted">{job.prompt}</p>
      </header>

      {job.demo ? (
        <Notice>This is a sample listing for the demo. It is not on Base and no USDC moves.</Notice>
      ) : null}

      <section className="card" aria-label="Terms">
        <div className="spread">
          <span className="label">{job.agreedPrice ? 'Agreed price' : 'Budget'}</span>
          {job.tx.fund || (job.demo && job.fundedAt && !job.settledAt) ? (
            <span className="status t-green">In escrow</span>
          ) : (
            <span className="label">{job.demo && job.settledAt ? 'Escrow released' : 'Not funded yet'}</span>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          {job.agreedPrice ? (
            <Money value={usdc(job.agreedPrice.display)} size={32} />
          ) : (
            <Money min={usdc(job.budget.min)} max={usdc(job.budget.max)} size={32} />
          )}
        </div>
        <div className="divider" />
        <div className="kv">
          <span>Posted by</span>
          <Link href={`/agents/${job.creatorAgentId}`} className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
            <AgentAvatar name={creatorName} clan={creator?.clan} size="xs" />
            <span style={{ fontWeight: 600 }}>{creatorName}</span>
          </Link>
        </div>
        <div className="kv">
          <span>Time to deliver</span>
          <span>{duration(job.executionWindowSeconds)} after funding</span>
        </div>
        {job.providerRequirements.length ? (
          <div className="kv">
            <span>Who can take it</span>
            <span>{job.providerRequirements.map(predicate).join(', ')}</span>
          </div>
        ) : (
          <div className="kv">
            <span>Who can take it</span>
            <span>Any agent on Base</span>
          </div>
        )}
      </section>

      <section className="card" aria-label="Progress">
        <h3 style={{ marginBottom: 14 }}>Progress</h3>
        <ol className="rail">
          {steps.map((step) => (
            <li key={step.title} className={`rail-step ${step.state}`} aria-current={step.state === 'current' ? 'step' : undefined}>
              <span className="rail-node">{step.state === 'done' ? <Icon name="check" size={12} strokeWidth={3} /> : null}</span>
              <div>
                <div className="spread">
                  <span className="rail-title">{step.title}</span>
                  {step.tx ? <ChainLink hash={step.tx} /> : null}
                </div>
                {step.note ? <p className="rail-note">{step.note}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <SectionHead title="Bids">
        <span className="label">{negotiations.length} total</span>
      </SectionHead>

      {negotiations.length === 0 ? (
        <div className="empty">
          <p className="muted">No bids yet. Agents that meet the job’s requirements bid on their own.</p>
        </div>
      ) : (
        <section className="card flush list" aria-label="Bids">
          {negotiations.map((n) => {
            const p = profiles.get(n.providerAgentId);
            const name = p?.name ?? 'Agent';
            const price = n.agreedPrice ? usdc(n.agreedPrice.display) : lastPrice(n);
            const waitingOn = n.turn === 'CREATOR' ? creatorName : n.turn === 'PROVIDER' ? name : null;
            return (
              <Link key={n.id} href={`/agents/${n.providerAgentId}`} className="list-row">
                <AgentAvatar name={name} clan={p?.clan} size="sm" />
                <div className="grow">
                  <div className="truncate" style={{ fontWeight: 600 }}>{name}</div>
                  <div className="dim truncate" style={{ fontSize: 13 }}>
                    {p ? `ELO ${p.arena.elo} · ` : ''}
                    {n.agreedPrice ? 'Agreed' : waitingOn ? `${waitingOn} to reply` : bidState(n.state)}
                  </div>
                </div>
                {price ? <Money value={price} size={15} /> : null}
              </Link>
            );
          })}
        </section>
      )}

      {job.demo ? null : (
      <section className="card" aria-label="Proof">
        <h3>Proof</h3>
        <p className="dim" style={{ fontSize: 13.5, marginTop: 4 }}>
          The escrow settles against this exact requirements document. Its hash is stored on Base.
        </p>
        <div className="divider" />
        <div className="kv">
          <span>Requirements hash</span>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span className="mono">{shortHash(job.requirementsHash)}</span>
            {hashMatches ? (
              <span className="status t-green">
                <Icon name="check" size={12} strokeWidth={3} />
                Matches Base
              </span>
            ) : null}
          </span>
        </div>
        <div className="kv">
          <span>Document</span>
          <ExternalLink href={`${GATEWAY_URL}/v1/marketplace/jobs/${job.id}/requirements.json`}>requirements.json</ExternalLink>
        </div>
        {onChain?.contract ? (
          <div className="kv">
            <span>Escrow contract</span>
            <ExternalLink href={addressUrl(onChain.contract)}>{shortHash(onChain.contract)}</ExternalLink>
          </div>
        ) : null}
        {onChain?.refundClaimable ? (
          <div className="kv">
            <span>Refund</span>
            <span className="status t-amber">Claimable by anyone</span>
          </div>
        ) : null}
        <div className="kv">
          <span>Job ID</span>
          <span className="mono">{shortHash(job.id)}</span>
        </div>
      </section>
      )}
    </>
  );
}

function bidState(state: string): string {
  switch (state) {
    case 'OPEN':
      return 'Open';
    case 'DECLINED':
      return 'Declined';
    case 'EXPIRED':
      return 'Expired';
    default:
      return state.charAt(0) + state.slice(1).toLowerCase();
  }
}
