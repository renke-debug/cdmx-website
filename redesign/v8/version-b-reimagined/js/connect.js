// redesign/v8/version-a-mexico/js/connect.js
// Block 5: visitor links the three domain nodes; completing all three reveals the payoff.
import { prefersReducedMotion } from './lib.js';

const stage = document.getElementById('connect-stage');
if (stage) {
  const nodes = [...stage.querySelectorAll('.cnode')];
  const links = [...stage.querySelectorAll('.clink')];
  const payoff = document.getElementById('connect-payoff');
  const hint = document.getElementById('connect-hint');
  const lit = new Set();

  function refresh() {
    links.forEach((l) => {
      if (lit.has(l.dataset.a) && lit.has(l.dataset.b)) l.classList.add('on');
    });
    if (lit.size === nodes.length) {
      payoff && payoff.classList.add('show');
      hint && (hint.textContent = 'Connected. The same parts multiply.');
    }
  }

  function light(n) {
    const id = n.dataset.id;
    if (lit.has(id)) return;
    lit.add(id);
    n.classList.add('lit');
    n.setAttribute('aria-pressed', 'true');
    refresh();
  }

  if (prefersReducedMotion()) {
    // static end-state for reduced-motion / no interaction needed
    nodes.forEach((n) => { lit.add(n.dataset.id); n.classList.add('lit'); });
    links.forEach((l) => l.classList.add('on'));
    payoff && payoff.classList.add('show');
  } else {
    nodes.forEach((n) => {
      n.setAttribute('aria-pressed', 'false');
      n.addEventListener('click', () => light(n));
      n.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); light(n); }
      });
    });
  }
}
