/**
 * One82 Brand Design System
 *
 * Single source of truth for all design tokens used across the application.
 * These values mirror the Tailwind `theme.extend` block in index.html so that
 * TypeScript code can reference brand tokens without magic strings.
 */

// ─── Dark-Terminal Background Scale ────────────────────────────────────────
export const BRAND_COLORS = {
  /** Main page background */
  bg: '#0a0a14',
  /** Card / sidebar surface */
  surface: '#0f0f1a',
  /** Elevated card (hover / modal) */
  elevated: '#131320',
  /** Default border */
  border: '#1e1e30',
  /** Muted divider / secondary surface */
  muted: '#2a2a40',
} as const;

// ─── Semantic / Status Colors ───────────────────────────────────────────────
export const SEMANTIC_COLORS = {
  /** Green — revenue growth, completed transactions */
  profit: '#22c55e',
  /** Red — churn risk, failed transactions */
  loss: '#ef4444',
  /** Amber — medium risk, pending items */
  warn: '#f59e0b',
  /** Indigo — primary brand accent / informational */
  info: '#6366f1',
} as const;

// ─── Default Accent (Indigo) ────────────────────────────────────────────────
// The user can swap this via Settings → Interface Color; the CSS variables
// `--color-primary-*` are updated at runtime.  These values represent the
// default indigo scale used throughout the app.
export const PRIMARY_COLORS = {
  50: '#eef2ff',
  100: '#e0e7ff',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
} as const;

// ─── Text Scale ─────────────────────────────────────────────────────────────
export const TEXT_COLORS = {
  /** Primary body text (dark mode) */
  primary: '#e2e8f0',
  /** Secondary / supporting text */
  secondary: '#94a3b8',
  /** Muted labels, captions */
  muted: '#64748b',
  /** Disabled / placeholder */
  disabled: '#334155',
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
} as const;

// ─── Layout / Spacing ───────────────────────────────────────────────────────
export const LAYOUT = {
  /** Outer page padding */
  pagePadding: '1.5rem',
  /** Default card border-radius */
  cardRadius: '0.75rem',
  /** Sidebar width */
  sidebarWidth: '15rem',
  /** Top bar height */
  topBarHeight: '3.5rem',
} as const;

// ─── Motion ─────────────────────────────────────────────────────────────────
export const MOTION = {
  /** Default transition for interactive elements */
  transition: '150ms ease',
  /** Longer easing for panels / overlays */
  panelTransition: '200ms ease-in-out',
} as const;

// ─── Shadow / Glow Presets ───────────────────────────────────────────────────
export const SHADOWS = {
  /** Indigo glow used on primary CTAs */
  primaryGlow: '0 4px 24px 0 rgba(99,102,241,0.30)',
  /** Subtle card lift */
  card: '0 1px 3px 0 rgba(0,0,0,0.40)',
} as const;

// ─── Brand Meta ─────────────────────────────────────────────────────────────
export const BRAND_META = {
  name: 'One82',
  tagline: 'Portfolio Intelligence for ISOs',
  accentColorName: 'Indigo',
} as const;
