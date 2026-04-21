// Altitude nav — right-edge section indicator. Highlights active section.

const ITEMS = [
  { id: 'top', label: 'Manifesto' },
  { id: 'creed', label: 'Creed' },
  { id: 'pillars', label: 'C·D·M·x' },
  { id: 'puzzle', label: 'Connect' },
  { id: 'principles', label: 'Principles' },
  { id: 'proof', label: 'Ledger' },
  { id: 'book', label: 'Book' },
];

export function startAltitudeNav(mount) {
  if (!mount) return;
  mount.innerHTML = ITEMS.map(
    (it, i) =>
      `<a href="#${it.id}" data-altitude-link="${it.id}"${i === 0 ? ' class="on"' : ''}><span class="mark"></span>${it.label}</a>`
  ).join('');

  const links = new Map();
  mount.querySelectorAll('[data-altitude-link]').forEach((a) => {
    links.set(a.dataset.altitudeLink, a);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((a) => a.classList.remove('on'));
          const active = links.get(en.target.id);
          if (active) active.classList.add('on');
        }
      });
    },
    { threshold: 0.3 }
  );

  ITEMS.forEach((it) => {
    const el = document.getElementById(it.id);
    if (el) io.observe(el);
  });
}
