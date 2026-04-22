// Hero parallax — sets --mx, --my, --gx, --gy CSS vars on .hero for cursor-reactive effects.

export function startHeroParallax() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;

  function onMove(e) {
    const mx = (e.clientX / window.innerWidth - 0.5) * 2;
    const my = (e.clientY / window.innerHeight - 0.5) * 2;
    hero.style.setProperty('--mx', mx);
    hero.style.setProperty('--my', my);
    hero.style.setProperty('--gx', e.clientX + 'px');
    hero.style.setProperty('--gy', e.clientY + 'px');
  }

  window.addEventListener('mousemove', onMove, { passive: true });
}
