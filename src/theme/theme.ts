/**
 * Placeholder visual identity for the prototype.
 * The real AZIZ identity gets designed in Phase 7 — only edit this file for it,
 * screens should never hardcode colors or sizes.
 */
export const colors = {
  bg: '#0E0B1A',
  surface: '#1B1530',
  surfaceAlt: '#241C42',
  border: '#332A55',
  text: '#FFFFFF',
  textMuted: '#A99FC4',
  primary: '#FF4D6D',
  accent: '#FFD166',
  pass: '#2FD980',
  fail: '#FF5252',
  onPrimary: '#FFFFFF',
  onAccent: '#1A1206',
} as const;

/** One color per team slot for the team modes, with a readable foreground for each. */
export const teamColors = [
  { bg: '#FF4D6D', fg: '#FFFFFF' },
  { bg: '#FFD166', fg: '#1A1206' },
  { bg: '#2FD980', fg: '#052914' },
  { bg: '#4DA3FF', fg: '#FFFFFF' },
] as const;

export const teamColor = (index: number) => teamColors[index % teamColors.length];

export const spacing = (n: number) => n * 8;

export const radius = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
} as const;

export const font = {
  display: 44,
  title: 32,
  question: 34,
  verdict: 26,
  body: 18,
  label: 15,
  countdown: 140,
} as const;

/**
 * In-app use of assets/branding/splash-logo.png. The mark occupies a known window of the square
 * canvas (fractions of the side, measured from the PNG); screens size the image from these.
 */
export const logo = {
  homeWidth: 192,
  artwork: { left: 0.161, top: 0.297, width: 0.679, height: 0.456 },
} as const;

export const theme = { colors, teamColors, spacing, radius, font, logo } as const;
