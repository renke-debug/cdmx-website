// CPU-architecture-style traveling lights on SVG paths.
// Ported from cpu-architecture.tsx — uses getPointAtLength to animate circles along paths.

import { motionState } from './reduced-motion.js';

export function startCpuDiagram(root = document) {
  const container = root.querySelector('[data-cpu-diagram]');
  if (!container || motionState.reduced) return;
  const paths = Array.from(container.querySelectorAll('[data-cpu-path]'));
  const lights = Array.from(container.querySelectorAll('[data-cpu-light]'));
  if (paths.length === 0 || lights.length === 0) return;

  // Each light travels along one path, looping with staggered start
  const travelers = lights.map((light, i) => {
    const path = paths[i % paths.length];
    const length = path.getTotalLength();
    return {
      light, path, length,
      offset: (i / lights.length) * 1.0, // stagger start
      duration: 3.2 + (i * 0.6),          // varied speed
    };
  });

  // Draw paths in on entry (stroke-dashoffset animation)
  paths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
    p.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
  });

  // IntersectionObserver: trigger on scroll into view
  let triggered = false;
  function trigger() {
    if (triggered) return;
    triggered = true;
    paths.forEach((p) => { p.style.strokeDashoffset = '0'; });
    // Then start lights after paths are drawn
    setTimeout(() => {
      travelers.forEach((t) => {
        t.light.setAttribute('opacity', '1');
      });
      requestAnimationFrame(tick);
    }, 800);
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { trigger(); break; }
    }
  }, { threshold: 0.3 });
  io.observe(container);

  const t0 = performance.now();
  function tick(now) {
    const t = (now - t0) / 1000;
    for (const tv of travelers) {
      const progress = ((t / tv.duration) + tv.offset) % 1;
      const point = tv.path.getPointAtLength(progress * tv.length);
      tv.light.setAttribute('cx', point.x);
      tv.light.setAttribute('cy', point.y);
      // Fade in/out at ends for smoother loop
      const fade = Math.sin(progress * Math.PI);
      tv.light.setAttribute('opacity', (0.9 * fade).toFixed(2));
    }
    if (triggered) requestAnimationFrame(tick);
  }
}
