// Readout — live corner HUD (clock, cursor, scroll altitude).

export function startReadout(root) {
  if (!root) return;
  const localEl = root.querySelector('[data-local]');
  const cursorEl = root.querySelector('[data-cursor]');
  const altitudeEl = root.querySelector('[data-altitude]');
  const barFill = root.querySelector('[data-bar-fill]');

  const pad = (n) => String(n).padStart(2, '0');

  function updateClock() {
    const now = new Date();
    if (localEl) {
      localEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
  }

  function updateScroll() {
    const h = document.documentElement;
    const denom = h.scrollHeight - h.clientHeight || 1;
    const scroll = h.scrollTop / denom;
    if (altitudeEl) altitudeEl.textContent = String(Math.round(scroll * 100)).padStart(3, '0') + '%';
    if (barFill) barFill.style.width = (scroll * 100).toFixed(1) + '%';
  }

  function updateCursor(e) {
    if (cursorEl) {
      cursorEl.textContent = `x${pad(e.clientX % 1000)} · y${pad(e.clientY % 1000)}`;
    }
  }

  updateClock();
  updateScroll();
  setInterval(updateClock, 1000);
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('mousemove', updateCursor, { passive: true });
}
