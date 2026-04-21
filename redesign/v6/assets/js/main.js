// Orchestrator — boots the ported Claude Design manifesto landing (vanilla JS).

import { startBoot } from './boot.js';
import { startCursorTrail } from './cursor-trail.js';
import { startReadout } from './readout.js';
import { startAltitudeNav } from './altitude-nav.js';
import { startPuzzle } from './puzzle.js';
import { startTiltX } from './tilt-x.js';
import { startTweakPanel } from './tweak-panel.js';
import { startHeroParallax } from './hero-parallax.js';
import { startReveal } from './reveal.js';

const page = document.body.dataset.page;

// Manifest homepage — Claude Design port
if (page === 'manifest') {
  const bootMount = document.getElementById('boot-mount');
  if (bootMount) startBoot(bootMount);

  startCursorTrail(document.querySelector('.cursor-trail'));
  startReadout(document.querySelector('.readout'));
  startAltitudeNav(document.getElementById('altitude-mount'));

  const puzzleWrap = document.querySelector('[data-puzzle]');
  if (puzzleWrap) startPuzzle(puzzleWrap);

  document.querySelectorAll('[data-tilt-x]').forEach(startTiltX);

  startTweakPanel(document.getElementById('tweak-mount'));
  startHeroParallax();
  startReveal();
}

// /lab page keeps existing behaviour
if (page === 'lab') {
  import('./lab-canvas.js').then(({ startLab }) => {
    startLab({
      canvas: document.getElementById('constellation'),
      listEl: document.getElementById('lab-list'),
      lastSignalEl: document.getElementById('last-signal'),
    });
  });
}

// /contact page — run substrate only if canvas exists
if (page === 'contact') {
  import('./substrate.js').then(({ startSubstrate }) => {
    const c = document.getElementById('substrate');
    if (c) startSubstrate(c);
  });
}
