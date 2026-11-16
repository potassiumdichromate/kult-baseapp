'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { base } from 'wagmi/chains';
import { createSiweMessage } from 'viem/siwe';
import { api, ApiError } from './api';
import type { SessionUser } from './types';

const SESSION_KEY = ['session'] as const;
const STATEMENT = 'Sign in to Kult on Base.';

export function useSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: () => api<{ user: SessionUser | null }>('/api/auth/session').then((r) => r.user),
    staleTime: 60_000,
  });
}

/** Wallet errors arrive in several shapes; turn each into one plain sentence. */
export function signInError(err: unknown): string {
  const e = err as { code?: number; name?: string; message?: string };
  if (e?.code === 4001 || e?.name === 'UserRejectedRequestError' || /reject|denied|cancel/i.test(e?.message ?? '')) {
    return 'Sign-in was cancelled.';
  }
  if (err instanceof ApiError) return err.message;
  return 'Could not sign in. Please try again.';
}

/**
 * Sign in with Base.
 *
 * 1. Fetch a single-use nonce from our backend first, so the wallet prompt
 *    opens straight from the tap and is never caught by a popup blocker.
 * 2. Connect with the signInWithEthereum capability: one prompt both connects
 *    the Base Account and signs the SIWE message.
 * 3. If the wallet connects without returning a signature, fall back to a
 *    standard SIWE message signed with personal_sign.
 * 4. Our backend verifies the signature (ERC-1271 / ERC-6492 aware) and sets
 *    the session cookies.
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  const { connectors, connectAsync } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { disconnectAsync } = useDisconnect();
  const { isConnected } = useAccount();

  return useMutation({
    mutationFn: async () => {
      const connector = connectors.find((c) => c.id === 'baseAccount');
      if (!connector) throw new Error('Base Account is not available in this browser.');

      const { nonce } = await api<{ nonce: string }>('/api/auth/nonce', { method: 'POST' });

      // A stale wagmi connection would skip the capability request.
      if (isConnected) await disconnectAsync().catch(() => undefined);

      const result = await connectAsync({
        connector,
        chainId: base.id,
        withCapabilities: true,
        capabilities: {
          signInWithEthereum: { nonce, chainId: `0x${base.id.toString(16)}`, statement: STATEMENT },
        },
      });

      const account = result.accounts[0];
      let siwe = account.capabilities?.signInWithEthereum as { message: string; signature: string } | undefined;

      if (!siwe) {
        const message = createSiweMessage({
          address: account.address,
          chainId: base.id,
          domain: window.location.host,
          uri: window.location.origin,
          nonce,
          version: '1',
          statement: STATEMENT,
          issuedAt: new Date(),
        });
        siwe = { message, signature: await signMessageAsync({ account: account.address, message }) };
      }

      const { user } = await api<{ user: SessionUser }>('/api/auth/verify', { method: 'POST', body: siwe });
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(SESSION_KEY, user);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const { disconnectAsync } = useDisconnect();
  return useMutation({
    mutationFn: async () => {
      await api('/api/auth/session', { method: 'DELETE' });
      await disconnectAsync().catch(() => undefined);
    },
    onSuccess: () => {
      queryClient.setQueryData(SESSION_KEY, null);
      queryClient.removeQueries({ queryKey: ['me'] });
    },
  });
}
