import { gw } from '@/lib/server/gateway';
import { fail, json } from '@/lib/server/respond';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const data = await gw<{ nonce: string }>('/v1/auth/siwe/nonce', { method: 'POST', body: {} });
    if (!data?.nonce) return json({ error: 'Sign-in is not available right now' }, 503);
    return json({ nonce: data.nonce });
  } catch (err) {
    return fail(err);
  }
}
