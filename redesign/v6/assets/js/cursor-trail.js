// Cursor trail — soft yellow contour following the mouse.
// Reduced-motion safe: skips entirely.

export function startCursorTrail(root) {
  if (!root) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.remove();
    return;
  }
  const svg = root.querySelector('svg');
  if (!svg) return;
  const paths = svg.querySelectorAll('path');
  const ghostPath = paths[0];
  const mainPath = paths[1];
  const dot = svg.querySelector('circle');

  const pts = [];
  const ghost = [];
  let raf;

  function onMove(e) {
    pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (pts.length > 32) pts.shift();
    if (Math.random() < 0.06) {
      ghost.push({
        x: e.clientX + (Math.random() - 0.5) * 60,
        y: e.clientY + (Math.random() - 0.5) * 40,
      });
    }
    if (ghost.length > 18) ghost.shift();
  }

  function tick() {
    const now = performance.now();
    while (pts.length && now - pts[0].t > 800) pts.shift();
    if (pts.length > 1 && mainPath) {
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p.x + ',' + p.y).join(' ');
      mainPath.setAttribute('d', d);
    } else if (mainPath) {
      mainPath.setAttribute('d', '');
    }
    if (ghost.length > 1 && ghostPath) {
      const d = ghost.map((p, i) => (i ? 'L' : 'M') + p.x + ',' + p.y).join(' ');
      ghostPath.setAttribute('d', d);
    }
    if (dot && pts.length) {
      const last = pts[pts.length - 1];
      dot.setAttribute('cx', last.x);
      dot.setAttribute('cy', last.y);
    }
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', onMove, { passive: true });
  raf = requestAnimationFrame(tick);
}
