/**
 * App icon as an opaque PNG: /brand/icon?size=1024 for the Base Dashboard
 * listing (1024×1024, no transparency), 512 for the wallet's connect sheet.
 */

import { ImageResponse } from 'next/og';
import { KultSquare } from '@/lib/server/brand';

export const runtime = 'edge';

const SIZES = new Set([180, 192, 512, 1024]);

export function GET(req: Request) {
  const requested = Number(new URL(req.url).searchParams.get('size'));
  const size = SIZES.has(requested) ? requested : 512;

  return new ImageResponse(<KultSquare size={size} />, {
    width: size,
    height: size,
    headers: { 'cache-control': 'public, max-age=86400, immutable' },
  });
}
