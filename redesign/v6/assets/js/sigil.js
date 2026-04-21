// Generative copper glyph drawn stroke-by-stroke at Act 6. Deterministic per seed;
// variable cadence between bezier segments. Canvas2D.

import { motionState } from './reduced-motion.js';

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function drawSigil(canvas, seed = Date.now()) {
  const rand = seededRandom(seed);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const n = 5 + Math.floor(rand() * 4);
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({
      x: (i / (n - 1)) * w * 0.8 + w * 0.1,
      y: h * 0.2 + rand() * h * 0.6,
    });
  }

  const pauses = pts.map(() => 60 + rand() * 400);

  ctx.strokeStyle = 'rgba(212,145,94,0.9)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (!motionState.allowSigil) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i+1].x) / 2;
      const yc = (pts[i].y + pts[i+1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
    ctx.stroke();
    return;
  }

  let i = 0, t0 = performance.now();
  function step(t) {
    if (i >= pts.length - 1) return;
    const elapsed = t - t0;
    if (elapsed < pauses[i]) { requestAnimationFrame(step); return; }
    ctx.beginPath();
    if (i === 0) {
      ctx.moveTo(pts[0].x, pts[0].y);
    } else {
      const xc = (pts[i-1].x + pts[i].x) / 2;
      const yc = (pts[i-1].y + pts[i].y) / 2;
      ctx.moveTo(xc, yc);
    }
    const xc2 = (pts[i].x + pts[i+1].x) / 2;
    const yc2 = (pts[i].y + pts[i+1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc2, yc2);
    ctx.stroke();
    t0 = t;
    i++;
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
