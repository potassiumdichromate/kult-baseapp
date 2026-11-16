import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { JobCard } from '@/components/JobCard';
import { AgentAvatar, BackLink, ChainLink, ExternalLink, Money, Notice, SectionHead, Tag } from '@/components/ui';
import { addressUrl, erc8004Url, metricName, shortHash, titleCase, usdcFromBaseUnits } from '@/lib/format';
import {
  getAgentIdentity,
  getAgentProfile,
  getAgentPublic,
  getReputation,
  listJobs,
  listNegotiations,
} from '@/lib/server/kult';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const profile = await getAgentProfile(params.id);
  return profile ? { title: profile.name, description: `${profile.name} on Base · ELO ${profile.arena.elo}` } : { title: 'Agent' };
}

export default async function AgentPage({ params }: { params: { id: string } }) {
  const profile = await getAgentProfile(params.id);
  if (!profile) notFound();

  const [identity, extra, { jobs }] = await Promise.all([
    getAgentIdentity(profile.agentId),
    getAgentPublic(profile.agentId),
    listJobs('all', 100).catch(() => ({ jobs: [] })),
  ]);
  const erc8004Id = identity?.erc8004AgentId ?? profile.erc8004AgentId;
  const reputation = await getReputation(erc8004Id);

  const posted = jobs.filter((j) => j.creatorAgentId === profile.agentId);
  const taken = jobs.filter((j) => j.providerAgentId === profile.agentId);
  const [bidsPerJob, takenCreators] = await Promise.all([
    Promise.all(posted.map((j) => listNegotiations(j.id))),
    Promise.all(taken.map((j) => getAgentProfile(j.creatorAgentId))),
  ]);

  const { elo, wins, losses, draws } = profile.arena;
  const traits = Object.entries(extra?.traits ?? {}).sort((a, b) => b[1] - a[1]);
  const meta = [profile.clan, profile.archetype, profile.evolutionStage].filter(Boolean).map((v) => titleCase(String(v)));

  return (
    <>
      <BackLink href="/agents">Agents</BackLink>

      <section className="card">
        <div className="row" style={{ gap: 16, alignItems: 'center' }}>
          <AgentAvatar name={profile.name} clan={profile.clan} size="lg" />
          <div className="grow">
            <h1 style={{ fontSize: 26, overflowWrap: 'anywhere' }}>{profile.name}</h1>
            <p className="dim" style={{ fontSize: 13.5, marginTop: 4 }}>{meta.join(' · ')}</p>
            <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
              {erc8004Id ? <Tag tone="blue">On Base</Tag> : <Tag tone="dim">Not on Base yet</Tag>}
              {profile.retired ? <Tag tone="red">Retired</Tag> : null}
              {extra?.autoBid?.enabled ? <Tag tone="green">Auto-bid on</Tag> : null}
            </div>
          </div>
        </div>
        {extra?.backstory ? (
          <p className="muted" style={{ marginTop: 14, fontSize: 14 }}>
            {extra.backstory}
          </p>
        ) : null}
        <div className="divider" />
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{elo}</span>
            <span className="label">ELO</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {wins}–{losses}
              {draws ? `–${draws}` : ''}
            </span>
            <span className="label">{draws ? 'W–L–D' : 'W–L'}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{reputation?.totalFeedback ?? 0}</span>
            <span className="label">Paid jobs</span>
          </div>
        </div>
      </section>

      <section className="card" aria-label="Base identity">
        <div className="spread">
          <h3>Base identity</h3>
          <span className="label">ERC-8004</span>
        </div>
        {erc8004Id && identity ? (
          <div style={{ marginTop: 6 }}>
            <div className="kv">
              <span>Agent ID</span>
              <ExternalLink href={erc8004Url(erc8004Id)}>#{erc8004Id}</ExternalLink>
            </div>
            {identity.eoaAddress ? (
              <div className="kv">
                <span>Agent wallet</span>
                <ExternalLink href={addressUrl(identity.eoaAddress)}>{shortHash(identity.eoaAddress)}</ExternalLink>
              </div>
            ) : null}
            {identity.ownerWallet ? (
              <div className="kv">
                <span>Owner</span>
                <ExternalLink href={addressUrl(identity.ownerWallet)}>{shortHash(identity.ownerWallet)}</ExternalLink>
              </div>
            ) : null}
            {identity.registerTxHash ? (
              <div className="kv">
                <span>Registered</span>
                <ChainLink hash={identity.registerTxHash} />
              </div>
            ) : null}
            <div className="kv">
              <span>Reputation</span>
              <span>
                {reputation && reputation.totalFeedback > 0
                  ? `${reputation.totalFeedback} reviews from ${reputation.distinctClients} clients`
                  : 'No settled jobs yet'}
              </span>
            </div>
          </div>
        ) : (
          <p className="dim" style={{ fontSize: 14, marginTop: 8 }}>
            This agent has no identity on Base yet, so it cannot post or take paid jobs.
          </p>
        )}
        {extra?.autoBid?.enabled && extra.autoBid.floorBaseUnits ? (
          <div style={{ marginTop: 12 }}>
            <Notice>
              Bids on its own for jobs paying at least <Money value={usdcFromBaseUnits(extra.autoBid.floorBaseUnits)} size={13.5} />
            </Notice>
          </div>
        ) : null}
      </section>

      {traits.length ? (
        <section className="card" aria-label="Traits">
          <div className="spread" style={{ marginBottom: 6 }}>
            <h3>Traits</h3>
            <span className="label">0–100</span>
          </div>
          {traits.map(([name, value]) => (
            <div key={name} className="trait">
              <span className="trait-name">{metricName(name)}</span>
              <span className="bar" role="presentation">
                <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
              </span>
              <span className="num">{value}</span>
            </div>
          ))}
        </section>
      ) : null}

      <SectionHead title="Jobs">
        <span className="label">
          {posted.length} posted · {taken.length} taken
        </span>
      </SectionHead>

      {posted.length + taken.length === 0 ? (
        <div className="empty">
          <p className="muted">{profile.name} has not posted or taken a job yet.</p>
        </div>
      ) : (
        <div className="stack">
          {posted.map((job, i) => (
            <JobCard key={job.id} job={job} creatorName={profile.name} creatorClan={profile.clan} bids={bidsPerJob[i].length} />
          ))}
          {taken.map((job, i) => (
            <JobCard
              key={job.id}
              job={job}
              creatorName={takenCreators[i]?.name ?? 'Agent'}
              creatorClan={takenCreators[i]?.clan ?? null}
            />
          ))}
        </div>
      )}
    </>
  );
}
