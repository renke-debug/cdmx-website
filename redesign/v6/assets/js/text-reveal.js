// Text-reveal card — ported from diagram-card (motion/react clip-path + rotateDeg indicator).
// Mouse X position over card reveals hidden text via clip-path inset from right.

import { motionState } from './reduced-motion.js';

export function initTextReveal(card) {
  const hidden = card.querySelector('.reveal-hidden');
  const indicator = card.querySelector('.reveal-indicator');
  if (!hidden || !indicator) return;

  let active = false;
  let targetPct = 0;
  let currentPct = 0;
  let rafId = 0;

  function render() {
    // Ease toward target
    const diff = targetPct - currentPct;
    if (Math.abs(diff) < 0.1 && !active) {
      currentPct = 0;
      hidden.style.clipPath = `inset(0 100% 0 0)`;
      indicator.style.transform = `translateX(-2px)`;
      rafId = 0;
      return;
    }
    currentPct += diff * (active ? 0.9 : 0.15); // snap on active, ease on release

    hidden.style.clipPath = `inset(0 ${100 - currentPct}% 0 0)`;
    const rect = card.getBoundingClientRect();
    const xPx = (currentPct / 100) * rect.width;
    const rotateDeg = (currentPct - 50) * 0.1;
    indicator.style.left = `${xPx}px`;
    indicator.style.transform = `rotate(${rotateDeg}deg)`;
    rafId = requestAnimationFrame(render);
  }

  function onMove(e) {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    targetPct = Math.max(0, Math.min(100, x * 100));
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  function onEnter() {
    active = true;
    card.dataset.active = 'true';
  }
  function onLeave() {
    active = false;
    targetPct = 0;
    card.dataset.active = 'false';
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  card.addEventListener('mousemove', onMove);
  card.addEventListener('mouseenter', onEnter);
  card.addEventListener('mouseleave', onLeave);

  // Touch support — tap-to-reveal
  card.addEventListener('touchstart', (e) => {
    active = true;
    card.dataset.active = 'true';
    const touch = e.touches[0];
    const rect = card.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width;
    targetPct = Math.max(0, Math.min(100, x * 100));
    if (!rafId) rafId = requestAnimationFrame(render);
  }, { passive: true });
  card.addEventListener('touchend', onLeave);

  // Reduced-motion: just toggle full reveal on hover
  if (motionState.reduced) {
    card.removeEventListener('mousemove', onMove);
    card.addEventListener('mouseenter', () => {
      hidden.style.clipPath = 'inset(0 0 0 0)';
    });
    card.addEventListener('mouseleave', () => {
      hidden.style.clipPath = 'inset(0 100% 0 0)';
    });
  }
}

export function startTextReveal(root = document) {
  const cards = Array.from(root.querySelectorAll('[data-text-reveal]'));
  for (const card of cards) initTextReveal(card);
}
