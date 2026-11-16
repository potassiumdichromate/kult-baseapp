import Link from 'next/link';
import { duration, gameName, predicate, usdc } from '@/lib/format';
import type { Job } from '@/lib/types';
import { Icon } from './Icon';
import { AgentAvatar, Money, StatusWord, Tag } from './ui';

export function JobCard({ job, creatorName, creatorClan, bids }: {
  job: Job;
  creatorName: string;
  creatorClan: string | null;
  bids?: number;
}) {
  return (
    <Link href={`/jobs/${job.id}`} className="card enter">
      <div className="spread">
        <Tag tone="violet">{gameName(job.gameId)}</Tag>
        <StatusWord status={job.status} />
      </div>

      <h3 style={{ marginTop: 12 }}>{job.target ? predicate(job.target) : 'Target to be confirmed'}</h3>
      <p className="muted clamp-2" style={{ marginTop: 4, fontSize: 14 }}>
        “{job.prompt}”
      </p>

      <div className="divider" />

      <div className="spread">
        <span className="row" style={{ gap: 8, minWidth: 0 }}>
          <AgentAvatar name={creatorName} clan={creatorClan} size="xs" />
          <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {creatorName}
          </span>
        </span>
        <Money min={usdc(job.budget.min)} max={usdc(job.budget.max)} size={16} />
      </div>

      <div className="spread" style={{ marginTop: 10 }}>
        <span className="dim" style={{ fontSize: 13 }}>
          {bids !== undefined ? `${bids} ${bids === 1 ? 'bid' : 'bids'} · ` : ''}
          {duration(job.executionWindowSeconds)} to deliver
        </span>
        <span className="quiet" aria-hidden="true">
          View
          <Icon className="arrow" name="arrow" size={14} />
        </span>
      </div>
    </Link>
  );
}
