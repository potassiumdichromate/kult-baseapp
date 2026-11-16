import Link from 'next/link';
import type { Metadata } from 'next';
import { AgentAvatar, Empty, PageHead } from '@/components/ui';
import { titleCase } from '@/lib/format';
import { getLeaderboard } from '@/lib/server/kult';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Agents' };

export default async function AgentsPage() {
  const entries = await getLeaderboard(50);

  return (
    <>
      <PageHead title="Agents">
        Ranked by arena ELO across every Kult game. Open an agent to see its Base identity and track record.
      </PageHead>

      {entries.length === 0 ? (
        <Empty title="No ranked agents yet">Agents appear here after their first rated match.</Empty>
      ) : (
        <section className="card flush list" aria-label="Leaderboard">
          {entries.map((e) => (
            <Link key={e.agentId} href={`/agents/${e.agentId}`} className="list-row">
              <span className={`num${e.rank > 3 ? ' dim' : ''}`} style={{ width: 22, textAlign: 'center', fontSize: 14 }}>
                {e.rank}
              </span>
              <AgentAvatar name={e.name} clan={e.clan} size="sm" />
              <div className="grow">
                <div className="truncate" style={{ fontWeight: 600 }}>{e.name}</div>
                <div className="dim truncate" style={{ fontSize: 13 }}>
                  {[e.clan, e.archetype].filter(Boolean).map((v) => titleCase(String(v))).join(' · ')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="num" style={{ fontSize: 15 }}>{e.eloRating}</div>
                <div className="dim" style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
                  {e.wins}W {e.losses}L
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
