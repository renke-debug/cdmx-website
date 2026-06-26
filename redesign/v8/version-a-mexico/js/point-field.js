// redesign/v8/version-a-mexico/js/point-field.js
// Reusable sodium-lamp point cloud + nearest-neighbour connection lines.
// Version B reuses this with an abstract distribution + a different palette.
import * as THREE from 'three';
import { isLowEnd, clamp } from './lib.js';

export function createPointField(canvas, config = {}) {
  const {
    count = isLowEnd() ? 1500 : 3000,
    color = 0xF5C800,
    neighbours = 3,
    bloom = !isLowEnd(),
    distribute = defaultCityDistribution, // (i, n) => {x,y,z}
  } = config;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 140);
  camera.position.set(0, 3.2, 16);
  camera.lookAt(0, -1.5, -40);

  // ----- points -----
  const positions = new Float32Array(count * 3);
  const brightness = new Float32Array(count); // 0..1, animated by scroll
  for (let i = 0; i < count; i++) {
    const p = distribute(i, count);
    positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
    brightness[i] = 0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aBright', new THREE.BufferAttribute(brightness, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSize: { value: 230.0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float aBright; varying float vB; varying float vFog; varying float vPhase;
      uniform float uSize;
      void main(){ vB = aBright;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float depth = -mv.z;
        vFog = 1.0 - smoothstep(24.0, 92.0, depth);    // far lamps fade into the dark
        vPhase = position.x * 0.6 + position.z * 0.4;   // per-lamp twinkle phase
        gl_PointSize = uSize * (0.3 + aBright) / depth;
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      varying float vB; varying float vFog; varying float vPhase;
      uniform vec3 uColor; uniform float uTime;
      void main(){ vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float glow = smoothstep(0.5, 0.0, d);           // soft radial glow
        float twinkle = 0.88 + 0.12 * sin(uTime * 1.4 + vPhase);
        gl_FragColor = vec4(uColor, glow * vB * vFog * twinkle); }`,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // ----- nearest-neighbour connections -----
  // O(n^2) once at init. For count > 4000, swap in a spatial grid.
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
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) } },
    vertexShader: `attribute float aAlpha; varying float vA;
      void main(){ vA = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying float vA; uniform vec3 uColor;
      void main(){ gl_FragColor = vec4(uColor, vA * 0.32); }`,
  });
  const lines = new THREE.LineSegments(lgeo, lmat);
  scene.add(lines);

  // ----- optional bloom (desktop / high-end only) -----
  let composer = null;
  if (bloom) {
    Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
    ]).then(([{ EffectComposer }, { RenderPass }, { UnrealBloomPass }]) => {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.6, 0.9));
    }).catch(() => { composer = null; });
  }

  // ----- scroll-driven reveal -----
  let progress = 0;
  function setProgress(p) {
    progress = clamp(p, 0, 1);
    const b = geo.attributes.aBright.array;
    for (let i = 0; i < count; i++) {
      const threshold = i / count;             // lamps light up in order
      b[i] = clamp((progress - threshold) * 3, 0, 0.9);
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
  // seed a little brightness so the hero is not pitch black before any scroll
  setProgress(0.06);

  // ----- render loop with offscreen / hidden-tab pause -----
  let running = false, raf = 0, t0 = 0;
  function frame() {
    if (!running) return;
    t0 += 0.016;
    mat.uniforms.uTime.value = t0;       // drives the twinkle; skyline stays put
    (composer || renderer).render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!running && !document.hidden) { running = true; frame(); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    composer?.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  function dispose() {
    stop();
    window.removeEventListener('resize', resize);
    geo.dispose(); mat.dispose(); lgeo.dispose(); lmat.dispose();
    composer?.dispose?.(); renderer.dispose();
  }

  return { start, stop, setProgress, dispose };
}

function hash(s) { return Math.abs(Math.sin(s * 127.1 + 311.7) * 43758.5453) % 1; }

// smooth value noise for organic hillside bumps
function noise2(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const a = hash(xi * 1.7 + zi * 9.1), b = hash((xi + 1) * 1.7 + zi * 9.1);
  const c = hash(xi * 1.7 + (zi + 1) * 9.1), d = hash((xi + 1) * 1.7 + (zi + 1) * 9.1);
  const ux = xf * xf * (3 - 2 * xf), uz = zf * zf * (3 - 2 * zf);
  return a * (1 - ux) * (1 - uz) + b * ux * (1 - uz) + c * (1 - ux) * uz + d * ux * uz;
}

function defaultCityDistribution(i, n) {
  // a hillside covered in houses (Mexico City barrio at night): terrain rises into
  // the distance, lamps hug the slope, sparse cells rise into apartment "flats".
  const cols = Math.ceil(Math.sqrt(n));
  const cx = i % cols;
  const cz = Math.floor(i / cols);
  const u = cx / cols - 0.5;            // -0.5 .. 0.5 across
  const v = cz / cols;                  // 0 near .. 1 far (up the hill)
  const x = u * 72 + (hash(i) - 0.5) * 1.5;
  const z = -v * 92 - 4;               // recede away from the camera
  // hillside terrain: climbs with distance + lateral contour + organic bumps
  const hill = Math.pow(v, 1.25) * 13.0
             + Math.sin(u * Math.PI * 1.3) * 2.2
             + (noise2(u * 4.0 + 10.0, v * 6.0) - 0.5) * 4.5;
  // houses hug the terrain; sparse coarse cells become taller flats/apartment blocks
  const cell = hash(Math.floor(cx / 2) * 13.1 + Math.floor(cz / 2) * 7.7);
  const pr = hash(i * 1.37);
  const build = cell > 0.88 ? pr * (3.0 + cell * 6.0) : pr * 0.7;
  const y = hill + build - 6.0;        // drop the base so the hill sits in the lower frame
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
