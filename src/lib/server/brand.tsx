/** Brand marks for generated PNGs (icons, share cards). Rendered by next/og. */

import { LOGO_GRADIENT, LOGO_MARK, LOGO_VIEWBOX } from '../logo';

const gradient = `linear-gradient(90deg, ${LOGO_GRADIENT[0]} 0%, ${LOGO_GRADIENT[1]} 50%, ${LOGO_GRADIENT[2]} 100%)`;

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox={LOGO_VIEWBOX}>
      {LOGO_MARK.map((points) => (
        <polygon key={points} points={points} fill="#fff" />
      ))}
    </svg>
  );
}

/** The round logo, as it appears everywhere in the app. */
export function KultDisc({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, display: 'flex', backgroundImage: gradient }}>
      <Mark size={size} />
    </div>
  );
}

/**
 * Full-bleed square for app icons. Wallets and launchers crop icons to their
 * own shape, so the gradient fills the square and the mark keeps the disc's
 * proportions; a circle inside a square would end up as a ring.
 */
export function KultSquare({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, display: 'flex', backgroundImage: gradient }}>
      <Mark size={size} />
    </div>
  );
}

/** Chakra Petch for share cards. Google serves TTF to clients that do not ask for WOFF2. */
export async function chakraPetch(weight: 600 | 700): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@${weight}`).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}
