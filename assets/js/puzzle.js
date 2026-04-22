// Connect-the-dots puzzle. Pass cursor over 8 dots in order → reveals giant yellow x.

const DOTS = [
  { x: 8,  y: 78, n: '01' },
  { x: 22, y: 30, n: '02' },
  { x: 38, y: 62, n: '03' },
  { x: 50, y: 18, n: '04' },
  { x: 62, y: 62, n: '05' },
  { x: 78, y: 30, n: '06' },
  { x: 92, y: 78, n: '07' },
  { x: 50, y: 50, n: 'x' },
];
const W = 1600;
const H = 700;
const sx = (p) => (p.x * W) / 100;
const sy = (p) => (p.y * H) / 100;

const SVG_NS = 'http://www.w3.org/2000/svg';

export function startPuzzle(root) {
  if (!root) return;

  // Build structure: <div class="puzzle-wrap"><svg>…</svg></div> + <div class="puzzle-hud">…</div>
  const wrap = document.createElement('div');
  wrap.className = 'puzzle-wrap';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const revealX = document.createElementNS(SVG_NS, 'text');
  revealX.setAttribute('class', 'reveal-x');
  revealX.setAttribute('x', String(W / 2));
  revealX.setAttribute('y', String(H / 2));
  revealX.textContent = 'x';
  svg.appendChild(revealX);

  const hint = document.createElementNS(SVG_NS, 'path');
  hint.setAttribute('class', 'hint');
  const hintD = DOTS.map((p, i) => (i ? 'L' : 'M') + sx(p) + ',' + sy(p)).join(' ');
  hint.setAttribute('d', hintD);
  svg.appendChild(hint);

  const link = document.createElementNS(SVG_NS, 'path');
  link.setAttribute('class', 'link');
  svg.appendChild(link);

  const cursorLine = document.createElementNS(SVG_NS, 'path');
  cursorLine.setAttribute('class', 'cursor-line');
  svg.appendChild(cursorLine);

  const dotEls = [];
  DOTS.forEach((p, i) => {
    const g = document.createElementNS(SVG_NS, 'g');
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('class', 'dot');
    c.setAttribute('cx', String(sx(p)));
    c.setAttribute('cy', String(sy(p)));
    c.setAttribute('r', '4');
    const t = document.createElementNS(SVG_NS, 'text');
    t.setAttribute('class', 'label');
    t.setAttribute('x', String(sx(p) + 12));
    t.setAttribute('y', String(sy(p) - 10));
    t.textContent = p.n;
    g.appendChild(c);
    g.appendChild(t);
    svg.appendChild(g);
    dotEls.push(c);
  });

  wrap.appendChild(svg);
  root.appendChild(wrap);

  const hud = document.createElement('div');
  hud.className = 'puzzle-hud';
  const dotsHud = document.createElement('div');
  dotsHud.className = 'dots';
  DOTS.forEach(() => {
    const s = document.createElement('span');
    dotsHud.appendChild(s);
  });
  const label = document.createElement('span');
  const reset = document.createElement('button');
  reset.className = 'reset';
  reset.type = 'button';
  reset.textContent = 'Reset';
  hud.appendChild(dotsHud);
  hud.appendChild(label);
  hud.appendChild(reset);
  root.appendChild(hud);

  let hit = [];
  let mouse = null;

  function coord(e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const r = pt.matrixTransform(m.inverse());
    return { x: r.x, y: r.y };
  }

  function render() {
    const complete = hit.length === DOTS.length;
    wrap.classList.toggle('complete', complete);

    const linked = hit.map((i) => DOTS[i]);
    const linePath = linked.map((p, i) => (i ? 'L' : 'M') + sx(p) + ',' + sy(p)).join(' ');
    link.setAttribute('d', linePath);

    if (mouse && hit.length < DOTS.length) {
      const sxFrom = hit.length ? sx(DOTS[hit.length - 1]) : sx(DOTS[0]);
      const syFrom = hit.length ? sy(DOTS[hit.length - 1]) : sy(DOTS[0]);
      cursorLine.setAttribute('d', `M${sxFrom},${syFrom} L${mouse.x},${mouse.y}`);
    } else {
      cursorLine.setAttribute('d', '');
    }

    dotEls.forEach((c, i) => {
      const isHit = hit.includes(i);
      c.classList.toggle('hit', isHit);
      c.setAttribute('r', isHit ? '6' : '4');
    });

    dotsHud.querySelectorAll('span').forEach((s, i) => {
      s.classList.toggle('on', hit.includes(i));
    });

    label.textContent = complete
      ? 'x · multiplier engaged'
      : `Move cursor over dots in order · ${hit.length}/${DOTS.length}`;
  }

  function onMove(e) {
    mouse = coord(e);
    const nextIdx = hit.length;
    if (nextIdx < DOTS.length) {
      const target = DOTS[nextIdx];
      const dx = mouse.x - sx(target);
      const dy = mouse.y - sy(target);
      if (Math.hypot(dx, dy) < 38) {
        hit = [...hit, nextIdx];
      }
    }
    render();
  }

  function onLeave() {
    mouse = null;
    render();
  }

  wrap.addEventListener('mousemove', onMove);
  wrap.addEventListener('mouseleave', onLeave);
  reset.addEventListener('click', () => {
    hit = [];
    render();
  });

  render();
}
