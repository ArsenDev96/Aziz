/**
 * Placeholder visual identity for the prototype.
 * The real ARA! identity gets designed in Phase 7 — only edit this file for it,
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

export const theme = { colors, spacing, radius, font } as const;
