// Orchestrator — loads per-page modules based on body[data-page].
import { startSubstrate } from './substrate.js';
import { startOrganism } from './organism.js';
import { drawSigil } from './sigil.js';
import { runCompletion } from './llm-completion.js';

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

  // Load GSAP + ScrollTrigger for breach timing + sigil + LLM triggers
  import('https://cdn.skypack.dev/gsap@3.12.7').then(({ gsap }) =>
    import('https://cdn.skypack.dev/gsap@3.12.7/ScrollTrigger').then(({ ScrollTrigger }) => {
      gsap.registerPlugin(ScrollTrigger);

      if (organism) {
        requestAnimationFrame(() => organism.breach(0.1, 0.5, 0.8, 4000));

        ScrollTrigger.create({
          trigger: '.act--4',
          start: 'top 60%',
          onEnter: () => organism.breach(0.5, 0.5, 0.6, 2500),
        });
        ScrollTrigger.create({
          trigger: '.act--6',
          start: 'top 70%',
          onEnter: () => organism.breach(0.9, 0.6, 0.7, 3000),
        });
      }

      if (llmSlot) {
        ScrollTrigger.create({
          trigger: '.act--4',
          start: 'top 50%',
          once: true,
          onEnter: () => runCompletion(llmSlot),
        });
      }

      if (sigilCanvas) {
        ScrollTrigger.create({
          trigger: '.act--6',
          start: 'top 50%',
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
