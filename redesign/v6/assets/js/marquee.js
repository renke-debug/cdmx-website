// Infinite marquee — ported from vercel-feature-1 Marquee component.
// Clones track contents to produce seamless loop; uses CSS animation with per-row speed.

import { motionState } from './reduced-motion.js';

export function startMarquee(root = document) {
  if (motionState.reduced) return;
  const rows = Array.from(root.querySelectorAll('[data-marquee]'));
  if (rows.length === 0) return;

  // Inject keyframes once
  if (!document.getElementById('marquee-keyframes')) {
    const style = document.createElement('style');
    style.id = 'marquee-keyframes';
    style.textContent = `
      @keyframes marquee-scroll {
        from { transform: translateX(0); }
        to   { transform: translateX(calc(-50% - var(--marquee-gap, 1rem))); }
      }
      @keyframes marquee-scroll-reverse {
        from { transform: translateX(calc(-50% - var(--marquee-gap, 1rem))); }
        to   { transform: translateX(0); }
      }
      [data-marquee] .marquee-track {
        animation: marquee-scroll var(--marquee-duration, 40s) linear infinite;
      }
      [data-marquee][data-marquee-reverse] .marquee-track {
        animation-name: marquee-scroll-reverse;
      }
    `;
    document.head.appendChild(style);
  }

  rows.forEach((row, idx) => {
    const track = row.querySelector('.marquee-track');
    if (!track) return;
    // Duplicate children to make loop seamless
    const original = Array.from(track.children);
    for (let i = 0; i < 2; i++) {
      original.forEach((el) => {
        const clone = el.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    }
    // Vary duration per row for visual interest
    const duration = 32 + (idx * 6);
    row.style.setProperty('--marquee-duration', duration + 's');
    row.style.setProperty('--marquee-gap', '1rem');
  });
}
