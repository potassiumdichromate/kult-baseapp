import { buildFeed } from '@/lib/server/feed';
import { fail, json } from '@/lib/server/respond';

export const revalidate = 15;

export async function GET() {
  try {
    return json({ events: await buildFeed(), asOf: new Date().toISOString() });
  } catch (err) {
    return fail(err);
  }
}
