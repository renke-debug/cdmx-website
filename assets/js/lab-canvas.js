// Neural constellation for /lab — codename nodes + technique synapses.
// Pan (drag), zoom (wheel), hover pulse, click panel. Keyboard fallback via list view.

import { motionState } from './reduced-motion.js';

export async function startLab({ canvas, listEl, lastSignalEl }) {
  let data;
  try {
    const resp = await fetch('/lab/data.json', { cache: 'no-store' });
    data = await resp.json();
  } catch {
    data = [];
  }

  if (!Array.isArray(data) || data.length === 0) {
    showEmptyState(canvas);
    renderList(listEl, []);
    return;
  }

  renderList(listEl, data);
  if (lastSignalEl) setLastSignal(lastSignalEl, data);

  if (!motionState.allowConstellationAnim) {
    document.body.classList.add('lab-list-visible');
    const panel = createPanel(); document.body.appendChild(panel);
    setupKeyboard(listEl, (codename) => {
      const n = data.find(x => x.codename === codename);
      if (n) openPanel(panel, n);
    });
    return;
  }

  const ctx = canvas.getContext('2d');
  let dpr, vw, vh;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = canvas.clientWidth || window.innerWidth;
    vh = canvas.clientHeight || window.innerHeight;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const nodes = data.map((d, i) => {
    const angle = (i / data.length) * Math.PI * 2;
    const r = Math.min(vw, vh) * 0.3;
    return {
      ...d,
      x: vw / 2 + Math.cos(angle) * r,
      y: vh / 2 + Math.sin(angle) * r,
      vx: 0, vy: 0,
      radius: 8 + d.depth * 6,
      hover: false,
      pulsePhase: Math.random() * Math.PI * 2,
    };
  });

  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const shared = nodes[i].techniques.filter(t => nodes[j].techniques.includes(t));
      if (shared.length) edges.push({ a: i, b: j, strength: shared.length });
    }
  }

  // Force-directed relaxation (one-time)
  for (let iter = 0; iter < 200; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const d = Math.max(1, Math.hypot(dx, dy));
        const force = 3000 / (d * d);
        nodes[i].vx -= (dx / d) * force;
        nodes[i].vy -= (dy / d) * force;
        nodes[j].vx += (dx / d) * force;
        nodes[j].vy += (dy / d) * force;
      }
    }
    for (const e of edges) {
      const a = nodes[e.a], b = nodes[e.b];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const rest = 140;
      const force = (d - rest) * 0.02;
      a.vx += (dx / d) * force;
      a.vy += (dy / d) * force;
      b.vx -= (dx / d) * force;
      b.vy -= (dy / d) * force;
    }
    for (const n of nodes) {
      n.vx += (vw / 2 - n.x) * 0.0008;
      n.vy += (vh / 2 - n.y) * 0.0008;
      n.x += n.vx * 0.15;
      n.y += n.vy * 0.15;
      n.vx *= 0.85; n.vy *= 0.85;
    }
  }
  for (const n of nodes) { n.vx = 0; n.vy = 0; }

  const view = { x: 0, y: 0, scale: 1 };
  let dragging = false;
  let dragOrigin = { x: 0, y: 0, viewX: 0, viewY: 0 };
  let pointerWorld = { x: 0, y: 0 };
  let pressed = false;

  function toWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - view.x) / view.scale,
      y: (clientY - rect.top - view.y) / view.scale,
    };
  }

  const panel = createPanel();
  document.body.appendChild(panel);

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    pressed = true;
    dragOrigin = { x: e.clientX, y: e.clientY, viewX: view.x, viewY: view.y };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    pointerWorld = toWorld(e.clientX, e.clientY);
    if (dragging) {
      view.x = dragOrigin.viewX + (e.clientX - dragOrigin.x);
      view.y = dragOrigin.viewY + (e.clientY - dragOrigin.y);
    }
    for (const n of nodes) {
      const dx = pointerWorld.x - n.x;
      const dy = pointerWorld.y - n.y;
      n.hover = (dx*dx + dy*dy) < n.radius * n.radius;
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    const moved = Math.hypot(e.clientX - dragOrigin.x, e.clientY - dragOrigin.y);
    dragging = false;
    canvas.releasePointerCapture(e.pointerId);
    if (moved < 4 && pressed) {
      for (const n of nodes) {
        if (n.hover) { openPanel(panel, n); break; }
      }
    }
    pressed = false;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoom = Math.exp(-e.deltaY * 0.001);
    view.scale = Math.max(0.4, Math.min(2.5, view.scale * zoom));
  }, { passive: false });

  setupKeyboard(listEl, (codename) => {
    const n = nodes.find(x => x.codename === codename);
    if (n) openPanel(panel, n);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') panel.dataset.open = 'false';
  });

  let pulseEdgeIdx = -1;
  let pulseStart = 0;

  function render(t) {
    ctx.clearRect(0, 0, vw, vh);
    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.scale, view.scale);

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const a = nodes[e.a], b = nodes[e.b];
      const highlight = a.hover || b.hover;
      const pulsing = (i === pulseEdgeIdx);
      const pulseProgress = pulsing ? Math.min(1, (t - pulseStart) / 1200) : 0;
      const alpha = highlight ? 0.5 : (pulsing ? 0.15 + pulseProgress * 0.4 : 0.12);
      ctx.strokeStyle = pulsing
        ? `rgba(212,145,94,${alpha})`
        : `rgba(197,224,216,${alpha})`;
      ctx.lineWidth = highlight ? 1.4 : 0.8;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    for (const n of nodes) {
      n.pulsePhase += 0.01;
      const pulse = Math.sin(n.pulsePhase) * 1.5;
      const r = n.radius + (n.hover ? 4 : 0) + pulse;
      ctx.fillStyle = 'rgba(197,224,216,0.55)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (n.status === 'shipping') {
        ctx.strokeStyle = 'rgba(212,145,94,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (n.hover) {
        ctx.fillStyle = '#0A0A0A';
        ctx.font = `500 12px 'SF Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`${n.codename} · ${n.status} · ${n.last_signal}`, n.x, n.y - r - 10);
      }
    }

    ctx.restore();
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  if (edges.length > 0) {
    setInterval(() => {
      pulseEdgeIdx = Math.floor(Math.random() * edges.length);
      pulseStart = performance.now();
      setTimeout(() => { pulseEdgeIdx = -1; }, 1500);
    }, 20000);
  }
}

function showEmptyState(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const vw = canvas.clientWidth || window.innerWidth;
  const vh = canvas.clientHeight || window.innerHeight;
  canvas.width = vw * dpr;
  canvas.height = vh * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#918D85';
  ctx.font = `500 14px 'SF Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('THE LAB IS QUIET RIGHT NOW.', vw / 2, vh / 2);
}

function renderList(ul, data) {
  if (!ul) return;
  if (data.length === 0) { ul.innerHTML = ''; return; }
  ul.innerHTML = data.map(d => `
    <li>
      <button class="lab-list-item" data-codename="${d.codename}">
        <strong>${d.codename}</strong>${d.status} — ${d.public_summary}
      </button>
    </li>
  `).join('');
}

function setLastSignal(el, data) {
  const latest = [...data].sort((a, b) => b.last_signal.localeCompare(a.last_signal))[0];
  if (!latest) return;
  el.textContent = ` / LAST SIGNAL ${latest.last_signal} / ${latest.codename}`;
}

function setupKeyboard(ul, openByCodename) {
  if (!ul) return;
  ul.addEventListener('click', (e) => {
    const btn = e.target.closest('.lab-list-item');
    if (!btn) return;
    openByCodename(btn.dataset.codename);
  });
  ul.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const btn = e.target.closest('.lab-list-item');
      if (btn) openByCodename(btn.dataset.codename);
    }
  });
}

function createPanel() {
  const panel = document.createElement('aside');
  panel.className = 'node-panel';
  panel.dataset.open = 'false';
  panel.innerHTML = `
    <button class="close" aria-label="Close">[ESC]</button>
    <h2 class="codename"></h2>
    <p class="summary"></p>
    <div class="techniques"></div>
    <p class="status"></p>
  `;
  panel.querySelector('.close').addEventListener('click', () => {
    panel.dataset.open = 'false';
  });
  return panel;
}

function openPanel(panel, node) {
  panel.querySelector('.codename').textContent = node.codename;
  panel.querySelector('.summary').textContent = node.public_summary;
  panel.querySelector('.status').textContent = `${node.status} · since ${node.started} · last signal ${node.last_signal}`;
  panel.querySelector('.techniques').innerHTML = node.techniques.map(t => `<span class="tech">${t}</span>`).join('');
  panel.dataset.open = 'true';
}
