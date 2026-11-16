'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { shortHash } from '@/lib/format';
import { useSession } from '@/lib/useSession';
import { UsdcCoin } from './Icon';
import { KultLogo } from './KultLogo';
import { SignInButton } from './SignInButton';
import { formatBalance, useUsdcBalance } from './UsdcBalance';

/** A stable colour per address, so the same account always looks the same. */
function addressColor(address: string): string {
  const palette = ['var(--pink)', 'var(--violet-deep)', 'var(--blue)', 'var(--green)', 'var(--gold)', 'var(--orange)'];
  const n = Number.parseInt(address.slice(2, 8), 16) || 0;
  return palette[n % palette.length];
}

export function TopBar() {
  const { data: user, isLoading } = useSession();
  const balance = useUsdcBalance(user?.walletAddress);
  // The Me screen has its own full-width sign-in button; one is enough.
  const onMe = usePathname()?.startsWith('/me');

  return (
    <div className="topbar">
      {user ? (
        <Link href="/me" className="profile-chip" aria-label="Your account">
          <span className="avatar" style={{ ['--c' as string]: addressColor(user.walletAddress) }} aria-hidden="true">
            {user.walletAddress.slice(2, 4).toUpperCase()}
          </span>
          <span style={{ minWidth: 0 }}>
            <span className="profile-name" style={{ display: 'block' }}>{shortHash(user.walletAddress)}</span>
            <span className="profile-sub" style={{ display: 'block' }}>Base Account</span>
          </span>
        </Link>
      ) : (
        <Link href="/" className="profile-chip" aria-label="Kult on Base, home">
          <span className="brand-logo" aria-hidden="true">
            <KultLogo size={52} />
          </span>
          <span>
            <span className="profile-name" style={{ display: 'block', letterSpacing: '0.12em' }}>KULT</span>
            <span className="profile-sub" style={{ display: 'block', color: 'var(--base-blue-2)' }}>On Base</span>
          </span>
        </Link>
      )}

      <div className="topbar-right">
        {user ? (
          <Link href="/me" className="res-pill" aria-label={`USDC balance on Base: ${formatBalance(balance.data)}`}>
            <UsdcCoin />
            {balance.isLoading ? <span className="skeleton" style={{ width: 38, height: 14 }} /> : formatBalance(balance.data)}
          </Link>
        ) : isLoading ? (
          <span className="skeleton" style={{ width: 150, height: 40, borderRadius: 999 }} />
        ) : onMe ? null : (
          <SignInButton small />
        )}
      </div>
    </div>
  );
}
