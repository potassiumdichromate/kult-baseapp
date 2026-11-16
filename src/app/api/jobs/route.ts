/**
 * Post a job: stage the confirmed draft, then publish it on Base.
 *
 * The game, target and provider requirements are passed explicitly from what
 * the owner confirmed on screen. The draft endpoint would otherwise re-parse
 * the prose, and the escrow must settle against the document the owner saw.
 */

import { gw } from '@/lib/server/gateway';
import { fail, json, unauthorized } from '@/lib/server/respond';
import { accessToken } from '@/lib/server/session';
import type { Predicate } from '@/lib/types';

export const dynamic = 'force-dynamic';

const AMOUNT = /^\d{1,6}(\.\d{1,6})?$/;
const OPS = new Set(['gte', 'gt', 'lte', 'lt', 'eq']);

function isPredicate(p: unknown): p is Predicate {
  const v = p as Predicate;
  return Boolean(v) && typeof v.metric === 'string' && OPS.has(v.op) && Number.isInteger(v.value);
}

export async function POST(req: Request) {
  const token = await accessToken();
  if (!token) return unauthorized();

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const creatorAgentId = typeof body?.creatorAgentId === 'string' ? body.creatorAgentId : '';
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  const budgetMin = String(body?.budgetMin ?? '');
  const budgetMax = String(body?.budgetMax ?? '');
  const gameId = typeof body?.gameId === 'string' ? body.gameId : '';
  const target = body?.target;
  const providerRequirements = Array.isArray(body?.providerRequirements) ? body.providerRequirements : [];

  if (!creatorAgentId || !prompt || !gameId) return json({ error: 'Pick an agent, a game and describe the job' }, 400);
  if (!isPredicate(target)) return json({ error: 'The job needs a measurable target' }, 400);
  if (!providerRequirements.every(isPredicate)) return json({ error: 'Provider requirements are not valid' }, 400);
  if (!AMOUNT.test(budgetMin) || !AMOUNT.test(budgetMax)) return json({ error: 'Enter the budget in USDC, like 0.50' }, 400);
  if (Number(budgetMin) <= 0 || Number(budgetMax) < Number(budgetMin)) {
    return json({ error: 'The maximum must be at least the minimum, and both above zero' }, 400);
  }

  try {
    const draft = await gw<{ job: { id: string } }>('/v1/marketplace/jobs/draft', {
      method: 'POST',
      token,
      timeoutMs: 25_000,
      body: { creatorAgentId, prompt, budgetMin, budgetMax, gameId, target, providerRequirements },
    });
    const jobId = draft?.job?.id;
    if (!jobId) return json({ error: 'The job could not be staged' }, 502);

    await gw(`/v1/marketplace/jobs/${jobId}/confirm`, { method: 'POST', token, body: {}, timeoutMs: 45_000 });
    return json({ jobId });
  } catch (err) {
    return fail(err);
  }
}
