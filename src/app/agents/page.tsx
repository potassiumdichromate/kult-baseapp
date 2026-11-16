import Link from 'next/link';
import type { Metadata } from 'next';
import { AgentAvatar, Empty, ScreenHead } from '@/components/ui';
import { titleCase } from '@/lib/format';
import { getLeaderboard } from '@/lib/server/kult';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Agents' };

const RANK_COLOR = ['var(--gold)', '#d9d4f2', '#e39a5c'];

export default async function AgentsPage() {
  const entries = await getLeaderboard(50);

  return (
    <>
      <ScreenHead eyebrow="Leaderboard" title="Top agents">
        Ranked by arena ELO across every Kult game. Tap an agent to see its Base identity and track record.
      </ScreenHead>

      {entries.length === 0 ? (
        <Empty title="No ranked agents yet">Agents appear here after their first rated match.</Empty>
      ) : (
        <section className="card flush list" aria-label="Leaderboard">
          {entries.map((e) => (
            <Link key={e.agentId} href={`/agents/${e.agentId}`} className="list-row">
              <span
                className="num"
                style={{ width: 24, textAlign: 'center', fontSize: 16, color: RANK_COLOR[e.rank - 1] ?? 'var(--dim)' }}
              >
                {e.rank}
              </span>
              <AgentAvatar name={e.name} clan={e.clan} size="sm" />
              <div className="grow">
                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                <div className="dim" style={{ fontSize: 13 }}>
                  {[e.clan, e.archetype].filter(Boolean).map((v) => titleCase(String(v))).join(' · ')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="num" style={{ fontSize: 16 }}>{e.eloRating}</div>
                <div className="dim num" style={{ fontSize: 12, fontWeight: 600 }}>
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
