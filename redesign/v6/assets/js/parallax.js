// Scroll-driven parallax — y-transform based on element's position in viewport.
// Ported from davincho-hero-1 (motion/react useScroll + useTransform).
// All elements with [data-parallax="STRENGTH"] move at STRENGTH * scrollProgress.

import { motionState } from './reduced-motion.js';

export function startParallax(root = document) {
  if (motionState.reduced) return;
  const targets = Array.from(root.querySelectorAll('[data-parallax]'));
  if (targets.length === 0) return;

  const entries = targets.map(el => ({
    el,
    strength: parseFloat(el.dataset.parallax || '0.3'),
    rect: el.getBoundingClientRect(),
  }));

  function update() {
    const vh = window.innerHeight;
    for (const entry of entries) {
      const rect = entry.el.getBoundingClientRect();
      // progress: 0 when element-top touches viewport-bottom, 1 when element-bottom leaves viewport-top
      const progress = Math.max(0, Math.min(1,
        (vh - rect.top) / (vh + rect.height)
      ));
      const y = progress * entry.strength * 100; // percent
      entry.el.style.transform = `translate3d(0, ${y}%, 0)`;
    }
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}
