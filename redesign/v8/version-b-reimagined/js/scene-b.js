// redesign/v8/version-b-reimagined/js/scene-b.js
// Lazy-init the abstract field; skip it for reduced-motion / mobile (paper fallback).
import { createAbstractField } from './abstract-field.js';
import { prefersReducedMotion, isMobile } from './lib.js';

const canvas = document.getElementById('bg-canvas');

if (prefersReducedMotion() || isMobile()) {
  canvas.style.display = 'none';
  document.body.classList.add('static-poster');
} else {
  let field = null;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && !field) {
        try {
          field = createAbstractField(canvas);
          field.start();
          window.__cdmxField = field;
        } catch (err) {
          canvas.style.display = 'none';
          document.body.classList.add('static-poster');
        }
        io.disconnect();
      }
    }
  }, { threshold: 0.01 });
  io.observe(document.getElementById('hero'));
}
