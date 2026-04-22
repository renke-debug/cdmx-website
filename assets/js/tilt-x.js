// Tilt-X — big yellow letter that tilts with cursor (3D perspective).

export function startTiltX(el) {
  if (!el) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const face = el.querySelector('.face');
  if (!face) return;

  function onMove(e) {
    const r = el.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    face.style.transform = `rotateY(${mx * 14}deg) rotateX(${-my * 12}deg)`;
  }

  function onLeave() {
    face.style.transform = '';
  }

  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);
}
