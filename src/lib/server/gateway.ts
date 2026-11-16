/**
 * Server-side access to the Kult API gateway.
 *
 * The browser never talks to the gateway directly: the gateway only accepts
 * browser calls from Kult's own sites, and some of its records carry fields
 * that must not reach a client. Every read goes through here and every
 * response is trimmed to a typed shape before it leaves the server.
 */

export const GATEWAY_URL = (process.env.KULT_GATEWAY_URL ?? 'https://aiarena-gateway.kult.games').replace(/\/$/, '');

export class GatewayError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

interface GatewayInit {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
  /** Seconds to cache a GET. 0 disables caching. */
  revalidate?: number;
  timeoutMs?: number;
}

async function request(path: string, init: GatewayInit): Promise<Response> {
  const { method = 'GET', body, token, revalidate = 15, timeoutMs = 12_000 } = init;
  const headers: Record<string, string> = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;

  const cacheable = method === 'GET' && !token && revalidate > 0;
  return fetch(`${GATEWAY_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    ...(cacheable ? { next: { revalidate } } : { cache: 'no-store' as const }),
  });
}

/** Returns null on 404, throws GatewayError on any other failure. */
export async function gw<T>(path: string, init: GatewayInit = {}): Promise<T | null> {
  let res: Response;
  try {
    res = await request(path, init);
  } catch (err) {
    throw new GatewayError(`Kult API unreachable: ${(err as Error).message}`, 503);
  }
  if (res.status === 404) return null;

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const reported = (data as { error?: unknown } | null)?.error;
    throw new GatewayError(typeof reported === 'string' && reported ? reported : `Kult API returned ${res.status}`, res.status);
  }
  return data as T;
}

/** Like gw, but a failure becomes null so one broken section never takes a page down. */
export async function gwSoft<T>(path: string, init: GatewayInit = {}): Promise<T | null> {
  try {
    return await gw<T>(path, init);
  } catch {
    return null;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
