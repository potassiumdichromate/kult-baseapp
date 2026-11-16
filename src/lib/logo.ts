/**
 * The Kult logo as vector data, traced from the 400×400 master: a violet to
 * magenta disc with a white mark. One source for the in-app mark, the
 * favicon, the app icon and the share card, so they cannot drift apart.
 */

export const LOGO_VIEWBOX = '0 0 400 400';

/** Left to right, sampled from the master. */
export const LOGO_GRADIENT = ['#5617e8', '#9621d2', '#c92ac0'] as const;

export const LOGO_MARK = [
  // the wide upper stroke
  '202,69 302,69 105,248 58.5,197',
  // the thin lower stroke
  '131,242.5 113.5,259 175,329 209,329',
  // the triangle
  '185.5,201.5 310.5,201.5 310.5,327',
] as const;
