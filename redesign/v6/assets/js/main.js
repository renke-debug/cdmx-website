// Orchestrator — loads per-page modules based on body[data-page].
import { startSubstrate } from './substrate.js';
import { startOrganism } from './organism.js';
import { drawSigil } from './sigil.js';
import { runCompletion } from './llm-completion.js';
import { startParallax } from './parallax.js';
import { startTextReveal } from './text-reveal.js';
import { startServicesModal } from './services-modal.js';
import { startCpuDiagram } from './cpu-diagram.js';
import { startMarquee } from './marquee.js';

const page = document.body.dataset.page;

// Substrate runs on every page
if (page === 'manifest' || page === 'lab' || page === 'contact') {
  const substrateCanvas = document.getElementById('substrate');
  if (substrateCanvas) startSubstrate(substrateCanvas);
}

// Manifest-only features
if (page === 'manifest') {
  const organismCanvas = document.getElementById('organism');
  const organism = organismCanvas ? startOrganism(organismCanvas) : null;

  const sigilCanvas = document.getElementById('sigil');
  const llmSlot = document.getElementById('llm-slot');
  const sessionSeed = Math.floor(Math.random() * 1e9);

  // 5 new component modules — wire immediately (they self-gate on reduced-motion)
  startParallax();
  startTextReveal();
  startServicesModal();
  startCpuDiagram();
  startMarquee();

  // GSAP + ScrollTrigger for scroll-driven moments
  import('https://cdn.skypack.dev/gsap@3.12.7').then(({ gsap }) =>
    import('https://cdn.skypack.dev/gsap@3.12.7/ScrollTrigger').then(({ ScrollTrigger }) => {
      gsap.registerPlugin(ScrollTrigger);

      if (organism) {
        // Opening breach on load (subtle, on hero pattern)
        requestAnimationFrame(() => organism.breach(0.2, 0.5, 0.6, 4000));

        // Mid breach at pillars section
        ScrollTrigger.create({
          trigger: '#philosophy',
          start: 'top 60%',
          onEnter: () => organism.breach(0.5, 0.4, 0.5, 2500),
        });

        // Late breach at lab preview
        ScrollTrigger.create({
          trigger: '#lab-preview',
          start: 'top 65%',
          onEnter: () => organism.breach(0.8, 0.6, 0.6, 3000),
        });
      }

      if (llmSlot) {
        ScrollTrigger.create({
          trigger: '#proof',
          start: 'top 55%',
          once: true,
          onEnter: () => runCompletion(llmSlot),
        });
      }

      if (sigilCanvas) {
        ScrollTrigger.create({
          trigger: '.footer',
          start: 'top 60%',
          once: true,
          onEnter: () => drawSigil(sigilCanvas, sessionSeed),
        });
      }
    })
  );
}

// Lab-only features
if (page === 'lab') {
  import('./lab-canvas.js').then(({ startLab }) => {
    startLab({
      canvas: document.getElementById('constellation'),
      listEl: document.getElementById('lab-list'),
      lastSignalEl: document.getElementById('last-signal'),
    });
  });
}
