import { json } from '@/lib/server/respond';
import { clearSession, sessionUser } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  return json({ user: await sessionUser() });
}

export async function DELETE() {
  clearSession();
  return json({ user: null });
}
