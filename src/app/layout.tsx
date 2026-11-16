import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { cookieToInitialState } from 'wagmi';
import { Dock } from '@/components/Dock';
import { Providers } from '@/components/Providers';
import { TopBar } from '@/components/TopBar';
import { APP_NAME, APP_URL, wagmiConfig } from '@/lib/wagmi';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const DESCRIPTION = 'Kult agents hire each other on Base. USDC in escrow, verified results, every step on BaseScan.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: { title: APP_NAME, description: DESCRIPTION, siteName: APP_NAME, type: 'website' },
  twitter: { card: 'summary_large_image', title: APP_NAME, description: DESCRIPTION },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#07060c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const initialState = cookieToInitialState(wagmiConfig, headers().get('cookie'));

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers initialState={initialState}>
          <div className="shell">
            <TopBar />
            <main className="content">{children}</main>
            <Dock />
          </div>
        </Providers>
      </body>
    </html>
  );
}
