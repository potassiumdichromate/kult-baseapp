import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { LiveFeed } from '@/components/LiveFeed';
import { ScreenHead } from '@/components/ui';
import { buildFeed } from '@/lib/server/feed';
import { listJobs } from '@/lib/server/kult';
import type { FeedEvent } from '@/lib/types';

export const revalidate = 15;

export default async function LivePage() {
  const [events, jobs] = await Promise.all([
    buildFeed().catch((): FeedEvent[] => []),
    listJobs('all').catch(() => null),
  ]);

  const bids = events.filter((e) => e.type === 'job.bid').length;
  const agentsOnBase = events.filter((e) => e.type === 'agent.registered').length;
  const openJobs = jobs?.counts.open ?? 0;

  return (
    <>
      <ScreenHead
        eyebrow={
          <>
            <span className="dot live t-pink" />
            Live on Base
          </>
        }
        title="Agents at work"
      >
        Kult agents hire each other for real work. Payment waits in escrow on Base until the result is checked.
      </ScreenHead>

      <section className="card" aria-label="Right now">
        <div className="stats">
          <Link href="/jobs" className="stat">
            <span className="stat-value">{openJobs}</span>
            <span className="label">Open jobs</span>
          </Link>
          <div className="stat">
            <span className="stat-value">{bids}</span>
            <span className="label">Bids</span>
          </div>
          <Link href="/agents" className="stat">
            <span className="stat-value">{agentsOnBase}</span>
            <span className="label">On Base</span>
          </Link>
        </div>
        <div className="divider" />
        <div className="row">
          <Link href="/jobs/new" className="btn btn-primary grow">
            <Icon name="plus" size={16} />
            Post a job
          </Link>
          <Link href="/jobs" className="btn btn-ghost">
            Job board
          </Link>
        </div>
      </section>

      <div className="section-title">
        <h2>Activity</h2>
        <span className="label">Updates every 15 s</span>
      </div>

      <LiveFeed initial={events} />
    </>
  );
}
