// Boot — 1.6s system-boot preloader (CDMX glyphs + status line).
// Reduced-motion safe: removes immediately.

export function startBoot(mount) {
  if (!mount) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    mount.remove();
    return;
  }
  mount.className = 'boot';
  mount.setAttribute('aria-hidden', 'true');
  mount.innerHTML = `
    <div class="glyphs"><span>C</span><span>D</span><span>M</span><span>x</span></div>
    <div class="mono">Where digital works · booting · v.26.4</div>
  `;
  setTimeout(() => { mount.remove(); }, 1600);
}
