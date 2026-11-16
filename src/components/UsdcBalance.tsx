'use client';

import { erc20Abi, type Address } from 'viem';
import { useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';
import { USDC_BASE, usdcFromBaseUnits } from '@/lib/format';

/** Live USDC balance of an address on Base, read straight from the token contract. */
export function useUsdcBalance(address: string | undefined) {
  return useReadContract({
    address: USDC_BASE,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address as Address] : undefined,
    chainId: base.id,
    query: { enabled: Boolean(address), refetchInterval: 30_000 },
  });
}

export function formatBalance(value: bigint | undefined): string {
  return value === undefined ? '—' : usdcFromBaseUnits(value);
}
