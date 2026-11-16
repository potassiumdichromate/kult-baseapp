import { NextResponse } from 'next/server';
import { GatewayError } from './gateway';

export const json = <T>(data: T, status = 200) => NextResponse.json(data, { status });

export function fail(err: unknown) {
  if (err instanceof GatewayError) {
    // A gateway 5xx is our outage, not the user's mistake; say so plainly.
    const status = err.status >= 500 ? 502 : err.status;
    return json({ error: err.message }, status);
  }
  return json({ error: 'Something went wrong. Please try again.' }, 500);
}

export const unauthorized = () => json({ error: 'Sign in to continue' }, 401);
