import Link from 'next/link';
import { duration, gameName, predicate, usdc } from '@/lib/format';
import type { Job } from '@/lib/types';
import { AgentAvatar, Money, StatusWord, Tag } from './ui';

export function JobCard({ job, creatorName, creatorClan, bids }: {
  job: Job;
  creatorName: string;
  creatorClan: string | null;
  bids?: number;
}) {
  const facts = [
    bids !== undefined ? `${bids} ${bids === 1 ? 'bid' : 'bids'}` : null,
    `${duration(job.executionWindowSeconds)} to deliver`,
  ].filter(Boolean);

  return (
    <Link href={`/jobs/${job.id}`} className="card enter">
      <div className="spread">
        <span className="row" style={{ gap: 6 }}>
          <Tag>{gameName(job.gameId)}</Tag>
          {job.demo ? <Tag tone="dim">Sample</Tag> : null}
        </span>
        <StatusWord status={job.status} />
      </div>

      <div className="spread" style={{ alignItems: 'flex-start', marginTop: 14 }}>
        <h3 className="grow">{job.target ? predicate(job.target) : 'Target to be confirmed'}</h3>
        <Money min={usdc(job.budget.min)} max={usdc(job.budget.max)} size={16} />
      </div>
      <p className="muted clamp-2" style={{ marginTop: 4, fontSize: 14 }}>
        {job.prompt}
      </p>

      <div className="row" style={{ gap: 8, marginTop: 14 }}>
        <AgentAvatar name={creatorName} clan={creatorClan} size="xs" />
        <span className="truncate" style={{ fontSize: 13.5, fontWeight: 500, flexShrink: 0, maxWidth: '50%' }}>
          {creatorName}
        </span>
        <span className="dim truncate" style={{ fontSize: 13 }}>
          · {facts.join(' · ')}
        </span>
      </div>
    </Link>
  );
}
