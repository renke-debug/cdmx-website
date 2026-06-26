// redesign/v8/version-b-reimagined/js/abstract-field.js
// Version B signature: an abstract contour/topography of nodes for a LIGHT background.
// No skyline. Normal blending (additive would blow out on paper), fuchsia nodes, teal links,
// a gently undulating surface that drifts. Same {start,stop,setProgress,dispose} API as A.
import * as THREE from 'three';
import { isLowEnd, clamp } from './lib.js';

export function createAbstractField(canvas, config = {}) {
  const {
    count = isLowEnd() ? 1200 : 2600,
    nodeColor = 0xE6357A,   // Barragan fuchsia
    lineColor = 0x1E6F6A,   // cactus teal
    neighbours = 3,
  } = config;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 140);
  camera.position.set(0, 7, 18);
  camera.lookAt(0, -1, -26);

  // ----- contour distribution (rolling topography) -----
  const positions = new Float32Array(count * 3);
  const brightness = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const p = contour(i, count);
    positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
    brightness[i] = 0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aBright', new THREE.BufferAttribute(brightness, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    uniforms: {
      uColor: { value: new THREE.Color(nodeColor) },
      uSize: { value: 170.0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float aBright; varying float vB; varying float vFog;
      uniform float uSize; uniform float uTime;
      void main(){ vB = aBright;
        vec3 p = position;
        p.y += sin(p.x * 0.28 + uTime * 0.6) * 0.5 + cos(p.z * 0.22 - uTime * 0.5) * 0.4; // drift
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = -mv.z;
        vFog = 1.0 - smoothstep(20.0, 88.0, depth);  // far nodes fade to paper
        gl_PointSize = uSize * (0.4 + aBright) / depth;
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      varying float vB; varying float vFog; uniform vec3 uColor;
      void main(){ vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float dot = smoothstep(0.5, 0.12, d);     // soft solid dot (no additive glow on light)
        gl_FragColor = vec4(uColor, dot * vB * vFog * 0.9); }`,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // ----- nearest-neighbour links (teal) -----
  const segs = buildConnections(positions, count, neighbours);
  const linePos = new Float32Array(segs.length * 6);
  const lineAlpha = new Float32Array(segs.length * 2);
  segs.forEach((s, k) => {
    linePos.set([
      positions[s.a * 3], positions[s.a * 3 + 1], positions[s.a * 3 + 2],
      positions[s.b * 3], positions[s.b * 3 + 1], positions[s.b * 3 + 2],
    ], k * 6);
  });
  const lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lgeo.setAttribute('aAlpha', new THREE.BufferAttribute(lineAlpha, 1));
  const lmat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    uniforms: { uColor: { value: new THREE.Color(lineColor) } },
    vertexShader: `attribute float aAlpha; varying float vA;
      void main(){ vA = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying float vA; uniform vec3 uColor;
      void main(){ gl_FragColor = vec4(uColor, vA * 0.4); }`,
  });
  const lines = new THREE.LineSegments(lgeo, lmat);
  scene.add(lines);

  // ----- scroll reveal -----
  let progress = 0;
  function setProgress(p) {
    progress = clamp(p, 0, 1);
    const b = geo.attributes.aBright.array;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      b[i] = clamp((progress - t) * 3, 0, 0.95);
    }
    geo.attributes.aBright.needsUpdate = true;
    const la = lgeo.attributes.aAlpha.array;
    for (let k = 0; k < segs.length; k++) {
      const t = k / segs.length;
      const a = clamp((progress - t) * 2.5, 0, 1) * (1 - clamp(segs[k].dist / 6, 0, 1));
      la[k * 2] = a; la[k * 2 + 1] = a;
    }
    lgeo.attributes.aAlpha.needsUpdate = true;
  }
  setProgress(0.06);

  // ----- loop with pause -----
  let running = false, raf = 0, t0 = 0;
  function frame() {
    if (!running) return;
    t0 += 0.016;
    mat.uniforms.uTime.value = t0;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!running && !document.hidden) { running = true; frame(); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function dispose() {
    stop(); window.removeEventListener('resize', resize);
    geo.dispose(); mat.dispose(); lgeo.dispose(); lmat.dispose(); renderer.dispose();
  }

  return { start, stop, setProgress, dispose };
}

function hash(s) { return Math.abs(Math.sin(s * 127.1 + 311.7) * 43758.5453) % 1; }

function contour(i, n) {
  // wide rolling surface receding into depth: abstract topography, not a skyline
  const cols = Math.ceil(Math.sqrt(n));
  const cx = i % cols, cz = Math.floor(i / cols);
  const u = cx / cols - 0.5;
  const v = cz / cols;
  const x = u * 66 + (hash(i) - 0.5) * 1.5;
  const z = -v * 76 - 2;
  const y = Math.sin(u * Math.PI * 2.2) * 2.4
          + Math.cos(v * Math.PI * 2.6) * 2.0
          + (hash(i * 1.37) - 0.5) * 1.2 - 2.0;
  return { x, y, z };
}

function buildConnections(pos, n, k) {
  const segs = [];
  for (let i = 0; i < n; i++) {
    const dists = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = pos[i * 3] - pos[j * 3];
      const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
      const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
      dists.push({ j, d: dx * dx + dy * dy + dz * dz });
    }
    dists.sort((a, b) => a.d - b.d);
    for (let m = 0; m < k; m++) {
      if (i < dists[m].j) segs.push({ a: i, b: dists[m].j, dist: Math.sqrt(dists[m].d) });
    }
  }
  return segs;
}
