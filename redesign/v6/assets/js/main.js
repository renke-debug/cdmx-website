// Orchestrator — loads per-page modules based on body[data-page].
import { startSubstrate } from './substrate.js';

const page = document.body.dataset.page;

if (page === 'manifest' || page === 'lab' || page === 'contact') {
  const canvas = document.getElementById('substrate');
  if (canvas) startSubstrate(canvas);
}
