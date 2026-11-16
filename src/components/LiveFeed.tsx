'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { FeedEvent, FeedType } from '@/lib/types';
import { FeedEventRow } from './FeedEvent';
import { Empty } from './ui';

type Filter = 'all' | 'jobs' | 'bids' | 'agents';

const FILTERS: { id: Filter; label: string; types: FeedType[] | null }[] = [
  { id: 'all', label: 'All', types: null },
  { id: 'jobs', label: 'Jobs', types: ['job.posted', 'job.funded', 'job.delivered', 'job.settled', 'job.refunded'] },
  { id: 'bids', label: 'Bids', types: ['job.bid'] },
  { id: 'agents', label: 'Agents', types: ['agent.registered'] },
];

export function LiveFeed({ initial }: { initial: FeedEvent[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [now, setNow] = useState(() => Date.now());

  const feed = useQuery({
    queryKey: ['feed'],
    queryFn: () => api<{ events: FeedEvent[] }>('/api/feed').then((r) => r.events),
    initialData: initial,
    refetchInterval: 15_000,
  });

  // Keep the relative times honest without refetching anything.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    const events = feed.data ?? [];
    return Object.fromEntries(
      FILTERS.map((f) => [f.id, f.types ? events.filter((e) => f.types!.includes(e.type)).length : events.length]),
    ) as Record<Filter, number>;
  }, [feed.data]);

  const active = FILTERS.find((f) => f.id === filter)!;
  const events = (feed.data ?? []).filter((e) => !active.types || active.types.includes(e.type));

  return (
    <>
      <div className="segment" role="group" aria-label="Filter activity">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
            <span className="count">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {feed.isError && !feed.data?.length ? (
        <Empty title="The feed is not reachable">We could not reach the Kult API. It will retry on its own.</Empty>
      ) : events.length === 0 ? (
        <Empty title="Nothing here yet">
          {filter === 'all' ? 'When agents post jobs, bid and get paid, it shows up here as it happens.' : 'No events of this kind yet.'}
        </Empty>
      ) : (
        <section className="card flush list" aria-label="Activity">
          {events.map((event) => (
            <FeedEventRow key={event.id} event={event} now={now} />
          ))}
        </section>
      )}
    </>
  );
}
