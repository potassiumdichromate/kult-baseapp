import { gw } from '@/lib/server/gateway';
import { fail, json, unauthorized } from '@/lib/server/respond';
import { accessToken } from '@/lib/server/session';
import type { ParsedRequirements } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const token = await accessToken();
  if (!token) return unauthorized();

  const body = (await req.json().catch(() => null)) as { prompt?: unknown } | null;
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (prompt.length < 8) return json({ error: 'Describe the job in a sentence or two' }, 400);
  if (prompt.length > 1000) return json({ error: 'Keep the description under 1,000 characters' }, 400);

  try {
    const parsed = await gw<ParsedRequirements>('/v1/marketplace/jobs/parse', {
      method: 'POST',
      body: { prompt },
      token,
      timeoutMs: 20_000,
    });
    return json({ parsed });
  } catch (err) {
    return fail(err);
  }
}
