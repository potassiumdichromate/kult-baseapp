'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/useSession';
import { UsdcCoin } from './Icon';
import { KultLogo } from './KultLogo';
import { SignInButton } from './SignInButton';
import { formatBalance, useUsdcBalance } from './UsdcBalance';

export function TopBar() {
  const { data: user, isLoading } = useSession();
  const balance = useUsdcBalance(user?.walletAddress);
  // The Me screen has its own full-width sign-in button; one is enough.
  const onMe = usePathname()?.startsWith('/me');

  return (
    <div className="topbar">
      <Link href="/" className="brand" aria-label="Kult on Base, home">
        <KultLogo size={28} />
        <span>
          Kult <span className="sub">on Base</span>
        </span>
      </Link>

      <div className="topbar-right">
        {user ? (
          <Link href="/me" className="balance" aria-label={`USDC balance on Base: ${formatBalance(balance.data)}`}>
            <UsdcCoin />
            {balance.isLoading ? <span className="skeleton" style={{ width: 38, height: 14 }} /> : formatBalance(balance.data)}
          </Link>
        ) : isLoading ? (
          <span className="skeleton" style={{ width: 140, height: 38, borderRadius: 12 }} />
        ) : onMe ? null : (
          <SignInButton small />
        )}
      </div>
    </div>
  );
}
