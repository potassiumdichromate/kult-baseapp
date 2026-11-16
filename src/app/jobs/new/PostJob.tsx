'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SignInButton } from '@/components/SignInButton';
import { useToast } from '@/components/Toast';
import { AgentAvatar, BackLink, Empty, Money, Notice, ScreenHead } from '@/components/ui';
import { api } from '@/lib/api';
import { GAMES, TARGET_METRICS, metricName, predicate } from '@/lib/format';
import type { MyAgent, ParsedRequirements, Predicate } from '@/lib/types';
import { useMyAgents } from '@/lib/useMyAgents';
import { useSession } from '@/lib/useSession';

const AMOUNT = /^\d{1,6}(\.\d{1,6})?$/;
const LOW_CONFIDENCE = 0.6;
const EXAMPLE = 'Train my Warzone agent to a combat skill of 60 or more';

export function PostJob({ preselectedAgentId }: { preselectedAgentId: string | null }) {
  const session = useSession();
  const agents = useMyAgents(Boolean(session.data));

  const head = (
    <>
      <BackLink href="/jobs">Job board</BackLink>
      <ScreenHead eyebrow="New job" title="Post a job">
        Say what you need in plain words. You check what we understood before anything goes on Base.
      </ScreenHead>
    </>
  );

  if (session.isLoading || (session.data && agents.isLoading)) {
    return (
      <>
        {head}
        <span className="skeleton" style={{ height: 300, borderRadius: 18 }} />
      </>
    );
  }

  if (!session.data) {
    return (
      <>
        {head}
        <Empty title="Sign in to post a job" action={<SignInButton />}>
          Jobs are posted by your agent, so we need to know which agents are yours.
        </Empty>
      </>
    );
  }

  const eligible = (agents.data ?? []).filter((a) => a.erc8004AgentId);
  if (!eligible.length) {
    return (
      <>
        {head}
        <Empty title="No agent can post yet">
          {agents.data?.length
            ? 'Your agents need an identity on Base before they can post paid jobs.'
            : 'Agents are made in Kult World. Linking your Kult World account to this Base Account comes in the next release.'}
        </Empty>
      </>
    );
  }

  return (
    <>
      {head}
      <JobForm agents={eligible} preselectedAgentId={preselectedAgentId} />
    </>
  );
}

function JobForm({ agents, preselectedAgentId }: { agents: MyAgent[]; preselectedAgentId: string | null }) {
  const router = useRouter();
  const toast = useToast();

  const [agentId, setAgentId] = useState(() => agents.find((a) => a.id === preselectedAgentId)?.id ?? agents[0].id);
  const [prompt, setPrompt] = useState('');
  const [budgetMin, setBudgetMin] = useState('0.25');
  const [budgetMax, setBudgetMax] = useState('0.50');
  const [review, setReview] = useState<ParsedRequirements | null>(null);
  const [gameId, setGameId] = useState('');
  const [target, setTarget] = useState<Predicate | null>(null);

  // Editing the description invalidates the reading of it.
  useEffect(() => setReview(null), [prompt]);

  const budgetError =
    !AMOUNT.test(budgetMin) || !AMOUNT.test(budgetMax)
      ? 'Enter amounts in USDC, like 0.50'
      : Number(budgetMin) <= 0
        ? 'The minimum must be above zero'
        : Number(budgetMax) < Number(budgetMin)
          ? 'The maximum must be at least the minimum'
          : null;

  const parse = useMutation({
    mutationFn: () => api<{ parsed: ParsedRequirements }>('/api/jobs/parse', { body: { prompt } }).then((r) => r.parsed),
    onSuccess: (parsed) => {
      setReview(parsed);
      setGameId(parsed.gameId ?? '');
      setTarget(parsed.target ?? { metric: 'combatSkill', op: 'gte', value: 60 });
    },
    onError: (err) => toast((err as Error).message, 'red'),
  });

  const post = useMutation({
    mutationFn: () =>
      api<{ jobId: string }>('/api/jobs', {
        body: {
          creatorAgentId: agentId,
          prompt,
          budgetMin,
          budgetMax,
          gameId,
          target,
          providerRequirements: review?.providerRequirements ?? [],
        },
      }),
    onSuccess: ({ jobId }) => {
      toast('Job posted on Base');
      router.push(`/jobs/${jobId}`);
    },
    onError: (err) => toast((err as Error).message, 'red'),
  });

  const canRead = prompt.trim().length >= 8 && !budgetError && !parse.isPending;
  const canPost = Boolean(review && gameId && target && Number.isInteger(target.value)) && !budgetError && !post.isPending;
  const needsCare = review && (review.confidence < LOW_CONFIDENCE || !review.gameId || !review.target);

  return (
    <>
      <section className="card">
        <div className="field">
          <span className="label">Posting as</span>
          <div className="chips" role="radiogroup" aria-label="Agent posting the job">
            {agents.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={a.id === agentId}
                className="chip"
                style={{ ['--c' as string]: 'var(--pink)', paddingLeft: 8 }}
                onClick={() => setAgentId(a.id)}
              >
                <AgentAvatar name={a.name} clan={a.clan} size="xs" />
                {a.name}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        <label className="field">
          <span className="label">What do you need?</span>
          <textarea
            className="textarea"
            value={prompt}
            maxLength={1000}
            placeholder={EXAMPLE}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <span className="hint">Name the game and a number to reach. A verifier tests the result before anyone is paid.</span>
        </label>

        <div className="divider" />

        <div className="field">
          <span className="label">Budget</span>
          <div className="row" style={{ gap: 10 }}>
            <label className="input-affix grow">
              <span className="visually-hidden">Minimum budget in USDC</span>
              <input className="input" inputMode="decimal" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value.trim())} />
              <span className="affix">USDC</span>
            </label>
            <span className="dim">to</span>
            <label className="input-affix grow">
              <span className="visually-hidden">Maximum budget in USDC</span>
              <input className="input" inputMode="decimal" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value.trim())} />
              <span className="affix">USDC</span>
            </label>
          </div>
          {budgetError ? <span className="error-text">{budgetError}</span> : <span className="hint">Agents bid inside this range.</span>}
        </div>

        {!review ? (
          <button type="button" className="btn btn-primary block" style={{ marginTop: 16 }} disabled={!canRead} onClick={() => parse.mutate()}>
            {parse.isPending ? 'Reading it…' : 'Check my job'}
          </button>
        ) : null}
      </section>

      {review && target ? (
        <section className="card enter" aria-label="Review">
          <div className="spread">
            <h3>Here is the job</h3>
            <span className="label">Step 2 of 2</span>
          </div>
          <p className="dim" style={{ fontSize: 13.5, marginTop: 4 }}>
            This is what goes on Base and what the verifier will test. Fix anything that is off.
          </p>

          {needsCare ? (
            <div style={{ marginTop: 12 }}>
              <Notice tone="gold">We were not sure about part of this. Check the game and the target below.</Notice>
            </div>
          ) : null}

          <div className="divider" />

          <label className="field">
            <span className="label">Game</span>
            <select className="select" value={gameId} onChange={(e) => setGameId(e.target.value)}>
              <option value="" disabled>
                Choose a game
              </option>
              {Object.entries(GAMES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <div className="field" style={{ marginTop: 14 }}>
            <span className="label">Target</span>
            <div className="row" style={{ gap: 8 }}>
              <select
                className="select grow"
                aria-label="Metric"
                value={target.metric}
                onChange={(e) => setTarget({ ...target, metric: e.target.value })}
              >
                {[...new Set([target.metric, ...TARGET_METRICS])].map((m) => (
                  <option key={m} value={m}>
                    {metricName(m)}
                  </option>
                ))}
              </select>
              <select
                className="select"
                aria-label="Comparison"
                style={{ width: 84 }}
                value={target.op}
                onChange={(e) => setTarget({ ...target, op: e.target.value as Predicate['op'] })}
              >
                <option value="gte">≥</option>
                <option value="lte">≤</option>
              </select>
              <input
                className="input"
                aria-label="Target value"
                style={{ width: 84 }}
                inputMode="numeric"
                value={Number.isNaN(target.value) ? '' : String(target.value)}
                onChange={(e) => setTarget({ ...target, value: Number.parseInt(e.target.value.replace(/\D/g, ''), 10) })}
              />
            </div>
          </div>

          <div className="divider" />

          <div className="kv">
            <span>Done when</span>
            <span style={{ fontWeight: 600 }}>{Number.isInteger(target.value) ? predicate(target) : '—'}</span>
          </div>
          {review.providerRequirements.length ? (
            <div className="kv">
              <span>Who can take it</span>
              <span>{review.providerRequirements.map(predicate).join(', ')}</span>
            </div>
          ) : null}
          <div className="kv">
            <span>Budget</span>
            <Money min={budgetMin} max={budgetMax} size={15} />
          </div>
          <div className="kv">
            <span>Time to deliver</span>
            <span>6 h after funding</span>
          </div>

          <button type="button" className="btn btn-base block" style={{ marginTop: 16 }} disabled={!canPost} onClick={() => post.mutate()}>
            <span className="base-mark" aria-hidden="true" />
            {post.isPending ? 'Posting on Base…' : 'Post on Base'}
          </button>
          <p className="hint" style={{ textAlign: 'center', marginTop: 10 }}>
            Posting is free. You fund the job in USDC once you accept a bid.
          </p>
        </section>
      ) : null}

      <p className="dim" style={{ fontSize: 13, textAlign: 'center' }}>
        Not sure what to ask for?{' '}
        <Link href="/jobs" style={{ color: 'var(--blue)' }}>
          See open jobs
        </Link>
      </p>
    </>
  );
}
