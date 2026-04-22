// Ambient mint flow field — always on, low opacity, reacts to cursor + scroll velocity.
// Canvas2D for lightness (<3% CPU target). Pauses on blur.

import { motionState } from './reduced-motion.js';

export function startSubstrate(canvas) {
  if (!motionState.allowSubstrate) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let w, h, dpr;
  const particles = [];
  const PARTICLE_COUNT = 120;
  let mouseX = 0.5, mouseY = 0.5;
  let scrollVel = 0, lastScroll = window.scrollY, lastT = performance.now();
  let running = true;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0, vy: 0,
        age: Math.random() * 1000,
      });
    }
  }

  function noise(x, y, t) {
    return Math.sin(x * 0.005 + t * 0.0001) * Math.cos(y * 0.005 + t * 0.00012);
  }

  function step(t) {
    if (!running) return;
    const dt = Math.min(32, t - lastT);
    lastT = t;
    const sy = window.scrollY;
    scrollVel = scrollVel * 0.9 + (sy - lastScroll) * 0.1;
    lastScroll = sy;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(248,246,241,0.08)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(197,224,216,0.55)';
    for (const p of particles) {
      const n = noise(p.x, p.y, t);
      const angle = n * Math.PI * 2 + scrollVel * 0.001;
      p.vx = p.vx * 0.92 + Math.cos(angle) * 0.35;
      p.vy = p.vy * 0.92 + Math.sin(angle) * 0.35;
      const dx = (mouseX * w) - p.x, dy = (mouseY * h) - p.y;
      const d2 = dx*dx + dy*dy;
      if (d2 < 40000) {
        p.vx += dx * 0.00008;
        p.vy += dy * 0.00008;
      }
      p.x += p.vx; p.y += p.vy;
      p.age += dt;
      if (p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20 || p.age > 8000) {
        p.x = Math.random() * w; p.y = Math.random() * h;
        p.vx = 0; p.vy = 0; p.age = 0;
      }
      ctx.fillRect(p.x, p.y, 1.5, 1.5);
    }

    requestAnimationFrame(step);
  }

  function onMove(e) {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  }
  function onBlur() { running = false; }
  function onFocus() {
    if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(step); }
  }

  resize(); spawn();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);
  requestAnimationFrame(step);
}
