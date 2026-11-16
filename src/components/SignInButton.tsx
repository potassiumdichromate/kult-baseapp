'use client';

import { signInError, useSignIn } from '@/lib/useSession';
import { useToast } from './Toast';

/**
 * "Sign in with Base", worded and marked per Base's brand guidance:
 * the exact label, and the square in white because it sits on blue.
 */
export function SignInButton({ block, small }: { block?: boolean; small?: boolean }) {
  const signIn = useSignIn();
  const toast = useToast();

  return (
    <button
      type="button"
      className={`btn btn-base${block ? ' block' : ''}${small ? ' sm' : ''}`}
      disabled={signIn.isPending}
      onClick={() =>
        signIn.mutate(undefined, {
          onSuccess: () => toast('Signed in with Base'),
          onError: (err) => toast(signInError(err), 'red'),
        })
      }
    >
      <span className="base-mark" aria-hidden="true" />
      {signIn.isPending ? 'Check your wallet…' : 'Sign in with Base'}
    </button>
  );
}
