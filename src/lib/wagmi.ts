import { cookieStorage, createConfig, createStorage, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { baseAccount } from 'wagmi/connectors';

export const APP_NAME = 'Kult on Base';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://baseapp.kult.games';

/**
 * Base mainnet only, one connector: Base Account.
 *
 * Inside Coinbase Wallet (formerly Base App) the Base Account SDK picks up the
 * wallet's injected provider, so the user signs in with the account they are
 * already using. In any other browser it opens the Base Account passkey flow.
 * Injected-wallet discovery stays off so other extensions are never offered.
 */
export const wagmiConfig = createConfig({
  chains: [base],
  multiInjectedProviderDiscovery: false,
  connectors: [baseAccount({ appName: APP_NAME, appLogoUrl: `${APP_URL}/brand/icon?size=512` })],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: { [base.id]: http() },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
