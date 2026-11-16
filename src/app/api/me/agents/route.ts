import { listMyAgents } from '@/lib/server/kult';
import { fail, json, unauthorized } from '@/lib/server/respond';
import { accessToken } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await accessToken();
  if (!token) return unauthorized();
  try {
    return json({ agents: await listMyAgents(token) });
  } catch (err) {
    return fail(err);
  }
}
