// redesign/v8/version-a-mexico/js/scene-a.js
// Lazy-init the WebGL field; skip it entirely for reduced-motion / mobile.
import { createPointField } from './point-field.js?v=4';
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
          field = createPointField(canvas);
          field.start();
          window.__cdmxField = field; // scroll-story.js drives setProgress()
        } catch (err) {
          // WebGL unavailable: fall back to poster
          canvas.style.display = 'none';
          document.body.classList.add('static-poster');
        }
        io.disconnect();
      }
    }
  }, { threshold: 0.01 });
  io.observe(document.getElementById('hero'));
}
