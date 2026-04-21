// Services-hover-modal — ported from services-with-animated-hover-modal (GSAP quickTo + motion scale).
// Each .cdmx-pillar on hover activates a floating visual preview that follows cursor.
// Uses per-pillar visuals (letter PNGs zoomed) + copper cursor-dot + "VIEW" label.

import { motionState } from './reduced-motion.js';

const PILLAR_VISUALS = [
  { letter: 'C', label: 'Curiosity', tint: '#C5E0D8' },
  { letter: 'D', label: 'Depth',     tint: '#C5E0D8' },
  { letter: 'M', label: 'Mastery',   tint: '#C5E0D8' },
  { letter: 'x', label: 'Multiplier', tint: '#F5C800' },
];

export function startServicesModal(root = document) {
  if (motionState.reduced) return;
  const pillars = Array.from(root.querySelectorAll('.cdmx-pillar'));
  if (pillars.length === 0) return;

  // Build floating elements and append to body
  const modal = document.createElement('div');
  modal.className = 'services-modal';
  modal.innerHTML = `<div class="services-modal-inner"></div>`;
  document.body.appendChild(modal);

  const cursor = document.createElement('div');
  cursor.className = 'services-modal-cursor';
  cursor.textContent = 'VIEW';
  document.body.appendChild(cursor);

  const inner = modal.querySelector('.services-modal-inner');
  const stage = document.createElement('div');
  stage.className = 'services-modal-stage';
  inner.appendChild(stage);

  // One panel per pillar stacked vertically
  PILLAR_VISUALS.forEach((v) => {
    const panel = document.createElement('div');
    panel.className = 'services-modal-panel';
    panel.style.background = v.tint;
    panel.innerHTML = `<span class="services-modal-letter">${v.letter}</span><span class="services-modal-label">${v.label}</span>`;
    stage.appendChild(panel);
  });

  // Quick-to easing via rAF
  let tx = 0, ty = 0, mx = 0, my = 0;
  let cx = 0, cy = 0;
  let activeIdx = -1;
  let rafId = 0;

  function onMove(e) {
    mx = e.pageX;
    my = e.pageY;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }
  function tick() {
    // Different ease speeds for modal vs cursor (modal slower → trails)
    tx += (mx - tx) * 0.12;
    ty += (my - ty) * 0.12;
    cx += (mx - cx) * 0.22;
    cy += (my - cy) * 0.22;
    modal.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
    if (Math.abs(mx - tx) > 0.5 || Math.abs(my - ty) > 0.5) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = 0;
    }
  }

  document.addEventListener('mousemove', onMove);

  pillars.forEach((pillar) => {
    const idx = parseInt(pillar.dataset.modalIndex, 10);
    pillar.addEventListener('mouseenter', () => {
      activeIdx = idx;
      modal.dataset.active = 'true';
      cursor.dataset.active = 'true';
      stage.style.transform = `translateY(${idx * -100}%)`;
    });
    pillar.addEventListener('mouseleave', () => {
      activeIdx = -1;
      modal.dataset.active = 'false';
      cursor.dataset.active = 'false';
    });
  });
}
