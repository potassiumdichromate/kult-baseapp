import type { SVGProps } from 'react';

/** Line icons, 24px grid, 2.2px stroke, drawn for this app. */
const PATHS = {
  live: (
    <>
      <circle cx="12" cy="12" r="2.4" />
      <path d="M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
      <path d="M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2" />
    </>
  ),
  jobs: (
    <>
      <rect x="3.5" y="7" width="17" height="12.5" rx="2.5" />
      <path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7" />
      <path d="M3.5 12.5h17M12 11v3" />
    </>
  ),
  agents: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="3" />
      <path d="M12 8V4.5M9.5 4.5h5" />
      <circle cx="9.5" cy="13.2" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13.2" r="1" fill="currentColor" stroke="none" />
      <path d="M2.5 12.5v2.5M21.5 12.5v2.5" />
    </>
  ),
  me: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  bid: (
    <>
      <path d="M4 12.5 9.5 7l3 3L7 15.5z" />
      <path d="m11 8.5 3-3 4.5 4.5-3 3M9.5 13.5 18 20" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2c-.5-.9-1.5-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2.1 0 2.9 5.8 1.4 5.8 4.3 0 1.3-1.2 2.1-3 2.1-1.4 0-2.5-.6-3-1.6M12 6.2v1.6M12 16.3v1.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  shield: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  refund: (
    <>
      <path d="M4.5 9.5h11a4.5 4.5 0 0 1 0 9H9" />
      <path d="M8 5.5 4 9.5l4 4" />
    </>
  ),
  package: (
    <>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" />
      <path d="m4 8 8 4.5L20 8M12 12.5v8" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" />,
  back: <path d="M19 12H6M11 6.5 5.5 12l5.5 5.5" />,
  external: (
    <>
      <path d="M14 4.5h5.5V10M19.5 4.5 11 13" />
      <path d="M17.5 14v4a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V8A1.5 1.5 0 0 1 6 6.5h4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.6v.2" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4.5h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6.5H5a3 3 0 0 0 3 3.5M16 6.5h3a3 3 0 0 1-3 3.5M12 13.5v3.5M8.5 20h7M9.5 17h5" />
    </>
  ),
  bolt: <path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12z" />,
  logout: (
    <>
      <path d="M14 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h8" />
      <path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}

/** A plain USDC-blue coin. Not the official mark, which should come from Circle's brand kit. */
export function UsdcCoin({ className = 'coin' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" />
      <path
        d="M19.2 12.6c-.6-1-1.7-1.6-3.2-1.6-1.8 0-3.1.9-3.1 2.3 0 3.3 6.4 1.6 6.4 4.8 0 1.4-1.3 2.3-3.3 2.3-1.6 0-2.8-.6-3.3-1.8M16 9.2V11M16 20.6v1.8"
        fill="none"
        stroke="#fff"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}
