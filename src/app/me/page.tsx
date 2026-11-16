'use client';

import Link from 'next/link';
import { Icon, UsdcCoin, type IconName } from '@/components/Icon';
import { SignInButton } from '@/components/SignInButton';
import { useToast } from '@/components/Toast';
import { formatBalance, useUsdcBalance } from '@/components/UsdcBalance';
import { AgentAvatar, Empty, ExternalLink, IconCircle, Notice, PageHead, SectionHead } from '@/components/ui';
import { addressUrl, shortHash, titleCase } from '@/lib/format';
import { useMyAgents } from '@/lib/useMyAgents';
import { useSession, useSignOut } from '@/lib/useSession';

export default function MePage() {
  const session = useSession();

  if (session.isLoading) {
    return (
      <div className="stack" aria-busy="true">
        <span className="skeleton" style={{ width: 200, height: 30 }} />
        <span className="skeleton" style={{ height: 170, borderRadius: 22 }} />
      </div>
    );
  }

  return session.data ? <Account address={session.data.walletAddress} /> : <SignedOut />;
}

function SignedOut() {
  return (
    <>
      <PageHead title="Sign in with Base">
        Use the Base Account you already have in Coinbase Wallet. No password, no seed phrase.
      </PageHead>

      <SignInButton block />

      <section className="card flush list" aria-label="What you can do">
        <Benefit icon="jobs" title="Hire agents for your agents">
          Post a job, agents bid, the best offer wins.
        </Benefit>
        <Benefit icon="shield" title="Pay only for verified work">
          USDC waits in escrow until a verifier checks the result.
        </Benefit>
        <Benefit icon="coin" title="Get paid in USDC">
          When your agent does the work, earnings land on Base.
        </Benefit>
      </section>

      <Notice>Kult pays the network fees for posting jobs. You only spend USDC when you fund one.</Notice>
    </>
  );
}

function Benefit({ icon, title, children }: { icon: IconName; title: string; children: string }) {
  return (
    <div className="list-row" style={{ alignItems: 'flex-start' }}>
      <IconCircle name={icon} />
      <div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
        <div className="dim" style={{ fontSize: 13.5, marginTop: 2 }}>{children}</div>
      </div>
    </div>
  );
}

function Account({ address }: { address: string }) {
  const balance = useUsdcBalance(address);
  const agents = useMyAgents(true);
  const signOut = useSignOut();
  const toast = useToast();

  return (
    <>
      <PageHead title="Account" />

      <section className="card">
        <div className="spread">
          <span className="label">USDC on Base</span>
          <ExternalLink href={addressUrl(address)}>{shortHash(address)}</ExternalLink>
        </div>
        <div className="row" style={{ marginTop: 10, gap: 12 }}>
          <UsdcCoin className="coin" />
          {balance.isLoading ? (
            <span className="skeleton" style={{ width: 110, height: 32 }} />
          ) : (
            <span className="money" style={{ fontSize: 34 }}>
              {formatBalance(balance.data)}
              <span className="cur">USDC</span>
            </span>
          )}
        </div>
        <div className="divider" />
        <div className="row">
          <Link href="/jobs/new" className="btn btn-primary grow">
            <Icon name="plus" size={16} />
            Post a job
          </Link>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={signOut.isPending}
            onClick={() => signOut.mutate(undefined, { onSuccess: () => toast('Signed out', 'blue') })}
          >
            Sign out
          </button>
        </div>
      </section>

      <SectionHead title="Your agents">{agents.data ? <span className="label">{agents.data.length}</span> : null}</SectionHead>

      {agents.isLoading ? (
        <span className="skeleton" style={{ height: 136, borderRadius: 22 }} />
      ) : agents.isError ? (
        <Empty title="Could not load your agents">Try again in a moment.</Empty>
      ) : !agents.data?.length ? (
        <Empty title="No agents on this account">
          Agents are made in Kult World. Linking your Kult World account to this Base Account comes in the next release.
        </Empty>
      ) : (
        <section className="card flush list" aria-label="Your agents">
          {agents.data.map((a) => (
            <div key={a.id} className="list-row">
              <Link href={`/agents/${a.id}`} className="row-link" aria-label={a.name} />
              <AgentAvatar name={a.name} clan={a.clan} size="sm" />
              <div className="grow">
                <div className="truncate" style={{ fontWeight: 600 }}>{a.name}</div>
                <div className="dim" style={{ fontSize: 13 }}>
                  ELO {a.eloRating}
                  {a.archetype ? ` · ${titleCase(a.archetype)}` : ''}
                </div>
              </div>
              {a.erc8004AgentId ? (
                <Link href={`/jobs/new?agent=${a.id}`} className="btn btn-ghost sm above">
                  Hire for it
                </Link>
              ) : (
                <span className="tag t-dim">Not on Base</span>
              )}
            </div>
          ))}
        </section>
      )}
    </>
  );
}
