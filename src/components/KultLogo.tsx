import { useId } from 'react';
import { LOGO_GRADIENT, LOGO_MARK, LOGO_VIEWBOX } from '@/lib/logo';

export function KultLogo({ size = 52, title = 'Kult' }: { size?: number; title?: string }) {
  const id = `kult-${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox={LOGO_VIEWBOX} role="img" aria-label={title}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={LOGO_GRADIENT[0]} />
          <stop offset="0.5" stopColor={LOGO_GRADIENT[1]} />
          <stop offset="1" stopColor={LOGO_GRADIENT[2]} />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="200" fill={`url(#${id})`} />
      {LOGO_MARK.map((points) => (
        <polygon key={points} points={points} fill="#fff" />
      ))}
    </svg>
  );
}
