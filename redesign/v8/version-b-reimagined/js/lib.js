// redesign/v8/version-a-mexico/js/lib.js
// Shared helpers, no dependencies.
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Low-end heuristic: gate bloom / particle count / WebGL itself.
export const isLowEnd = () =>
  (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
  window.matchMedia('(max-width: 768px)').matches;

export const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
