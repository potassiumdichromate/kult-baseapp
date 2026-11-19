import Link from 'next/link';
import { Fragment } from 'react';
import { timeAgo } from '@/lib/format';
import type { FeedEvent as Event, FeedType } from '@/lib/types';
import type { IconName } from './Icon';
import { ChainLink, IconCircle, Money } from './ui';

const ICON: Record<FeedType, IconName> = {
  'job.posted': 'jobs',
  'job.bid': 'bid',
  'job.funded': 'coin',
  'job.delivered': 'package',
  'job.settled': 'check',
  'job.refunded': 'refund',
  'agent.registered': 'shield',
};

/** One activity row. The whole row opens the job or agent; names and BaseScan stay their own links. */
export function FeedEventRow({ event, now }: { event: Event; now: number }) {
  const href = event.subject.kind === 'job' ? `/jobs/${event.subject.id}` : `/agents/${event.subject.id}`;
  const label = event.title.map((p) => p.text).join('');

  return (
    <article className="list-row event">
      <Link href={href} className="row-link" aria-label={label} />
      <IconCircle name={ICON[event.type]} />
      <div className="grow">
        <p className="event-title">
          {event.title.map((part, i) => (
            <Fragment key={i}>
              {part.agentId ? (
                <Link className="who above" href={`/agents/${part.agentId}`}>
                  {part.text}
                </Link>
              ) : (
                part.text
              )}
            </Fragment>
          ))}
        </p>
        {event.detail ? <p className="event-detail">{event.detail}</p> : null}
        <div className="event-meta">
          <time dateTime={event.occurredAt}>{timeAgo(event.occurredAt, now)}</time>
          <span aria-hidden="true">·</span>
          {/* Provenance: a BaseScan link when a Base transaction backs the event, otherwise a Kult record. */}
          {event.provenance === 'onchain' && event.txHash ? (
            <span className="above">
              <ChainLink hash={event.txHash} />
            </span>
          ) : (
            <span>{event.provenance === 'demo' ? 'Sample' : 'Kult record'}</span>
          )}
        </div>
      </div>
      {event.amount ? (
        <span className="event-amount">
          <Money value={event.amount.value} min={event.amount.min} max={event.amount.max} />
        </span>
      ) : null}
    </article>
  );
}
