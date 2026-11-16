import { gw } from '@/lib/server/gateway';
import { fail, json } from '@/lib/server/respond';
import { setSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

interface VerifyResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  walletAddress: string;
  isNewUser: boolean;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { message?: unknown; signature?: unknown } | null;
  if (typeof body?.message !== 'string' || typeof body.signature !== 'string') {
    return json({ error: 'message and signature are required' }, 400);
  }

  try {
    const data = await gw<VerifyResponse>('/v1/auth/siwe/verify', {
      method: 'POST',
      body: { message: body.message, signature: body.signature },
    });
    if (!data) return json({ error: 'Sign-in is not available right now' }, 503);
    setSession(data.accessToken, data.refreshToken);
    return json({ user: { userId: data.userId, walletAddress: data.walletAddress }, isNewUser: data.isNewUser });
  } catch (err) {
    return fail(err);
  }
}
