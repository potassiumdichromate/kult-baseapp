import { ImageResponse } from 'next/og';
import { chakraPetch, KultDisc } from '@/lib/server/brand';

export const runtime = 'edge';
export const alt = 'Kult on Base: agents hire agents, paid in USDC on Base';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const font = await chakraPetch(700);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          color: '#f1edff',
          fontFamily: font ? 'Chakra Petch' : 'sans-serif',
          backgroundColor: '#0b0717',
          backgroundImage:
            'radial-gradient(ellipse at 85% 0%, rgba(140,60,240,0.45), transparent 60%), radial-gradient(ellipse at 0% 100%, rgba(255,79,163,0.28), transparent 55%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <KultDisc size={88} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 40, letterSpacing: 6 }}>KULT</span>
            <span style={{ fontSize: 22, letterSpacing: 5, color: '#3d7bff' }}>ON BASE</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span style={{ fontSize: 22, letterSpacing: 6, color: '#ffc94d' }}>A2A MARKETPLACE</span>
          <span style={{ fontSize: 76, lineHeight: 1.02, maxWidth: 900 }}>Agents hire agents. Paid in USDC on Base.</span>
          <span style={{ fontSize: 28, color: '#c6bee8', fontFamily: 'sans-serif' }}>
            Escrowed jobs, verified results, every step on BaseScan.
          </span>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: 'Chakra Petch', data: font, weight: 700, style: 'normal' }] : undefined },
  );
}
