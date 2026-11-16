/**
 * Session cookies for the Base app.
 *
 * The Kult JWTs never reach page JavaScript: they live in httpOnly cookies
 * and the app's own route handlers attach them to gateway calls. A 15 minute
 * access token is refreshed from the 7 day refresh token when it runs out.
 */

import { cookies } from 'next/headers';
import { gw } from './gateway';
import type { SessionUser } from '../types';

const ACCESS = 'kb_at';
const REFRESH = 'kb_rt';

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

interface JwtClaims {
  userId?: string;
  walletAddress?: string;
  exp?: number;
}

/** Reads claims without verifying them: the gateway verifies every token it is sent. */
function claims(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as JwtClaims;
  } catch {
    return null;
  }
}

const expiresSoon = (token: string) => {
  const exp = claims(token)?.exp;
  return !exp || exp * 1000 - Date.now() < 30_000;
};

export function setSession(accessToken: string, refreshToken: string) {
  const jar = cookies();
  jar.set(ACCESS, accessToken, { ...baseCookie, maxAge: 15 * 60 });
  jar.set(REFRESH, refreshToken, { ...baseCookie, maxAge: 7 * 24 * 60 * 60 });
}

export function clearSession() {
  const jar = cookies();
  jar.delete(ACCESS);
  jar.delete(REFRESH);
}

/**
 * A usable access token, refreshing it if needed. Only call from route
 * handlers: refreshing writes a cookie, which server components cannot do.
 */
export async function accessToken(): Promise<string | null> {
  const jar = cookies();
  const current = jar.get(ACCESS)?.value;
  if (current && !expiresSoon(current)) return current;

  const refresh = jar.get(REFRESH)?.value;
  if (!refresh) return null;
  try {
    const data = await gw<{ accessToken: string }>('/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken: refresh },
    });
    if (!data?.accessToken) throw new Error('no token');
    jar.set(ACCESS, data.accessToken, { ...baseCookie, maxAge: 15 * 60 });
    return data.accessToken;
  } catch {
    clearSession();
    return null;
  }
}

export async function sessionUser(): Promise<SessionUser | null> {
  const token = await accessToken();
  const c = token ? claims(token) : null;
  if (!c?.userId || !c.walletAddress) return null;
  return { userId: c.userId, walletAddress: c.walletAddress };
}
