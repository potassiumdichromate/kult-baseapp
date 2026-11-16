import Link from 'next/link';
import { Fragment } from 'react';
import { timeAgo } from '@/lib/format';
import type { FeedEvent as Event, FeedType } from '@/lib/types';
import type { IconName } from './Icon';
import { ChainLink, IconTile, Money, QuietLink, Tag } from './ui';

const LOOK: Record<FeedType, { icon: IconName; color: string }> = {
  'job.posted': { icon: 'jobs', color: 'var(--f-jobs)' },
  'job.bid': { icon: 'bid', color: 'var(--violet-deep)' },
  'job.funded': { icon: 'coin', color: 'var(--f-jobs)' },
  'job.delivered': { icon: 'package', color: 'var(--f-deals)' },
  'job.settled': { icon: 'check', color: 'var(--f-deals)' },
  'job.refunded': { icon: 'refund', color: 'var(--orange)' },
  'agent.registered': { icon: 'shield', color: 'var(--pink)' },
};

export function FeedEventCard({ event, now }: { event: Event; now: number }) {
  const look = LOOK[event.type];
  const href = event.subject.kind === 'job' ? `/jobs/${event.subject.id}` : `/agents/${event.subject.id}`;

  return (
    <article className="card tight enter">
      <div className="event">
        <IconTile name={look.icon} color={look.color} small />
        <div style={{ minWidth: 0 }}>
          <div className="spread" style={{ alignItems: 'flex-start' }}>
            <p className="event-title">
              {event.title.map((part, i) => (
                <Fragment key={i}>
                  {part.agentId ? (
                    <Link className="who" href={`/agents/${part.agentId}`}>
                      {part.text}
                    </Link>
                  ) : (
                    part.text
                  )}
                </Fragment>
              ))}
            </p>
            <time className="event-time" dateTime={event.occurredAt} style={{ paddingTop: 2 }}>
              {timeAgo(event.occurredAt, now)}
            </time>
          </div>
          {event.detail ? <p className="event-detail">{event.detail}</p> : null}

          <div className="event-foot">
            {event.amount ? (
              <Money value={event.amount.value} min={event.amount.min} max={event.amount.max} size={15} />
            ) : null}
            <span className="grow" />
            {/* Provenance: a BaseScan link when a Base transaction backs the event, otherwise a Kult record. */}
            {event.provenance === 'onchain' && event.txHash ? <ChainLink hash={event.txHash} /> : <Tag tone="dim">Kult record</Tag>}
            <QuietLink href={href} />
          </div>
        </div>
      </div>
    </article>
  );
}
