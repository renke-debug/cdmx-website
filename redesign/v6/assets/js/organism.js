// Organism breach — WebGL2 Gray-Scott reaction-diffusion simulation.
// Pings two float textures, seeds on breach(), maps result to mint→copper gradient,
// fades canvas opacity via GSAP-free internal easing.

import { motionState } from './reduced-motion.js';

const SIM_RES = 256;
const SIMS_PER_FRAME = 8;

const VERT_SRC = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG_SIM = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform vec2 u_res;
uniform float u_feed;
uniform float u_kill;
uniform float u_Da;
uniform float u_Db;
uniform float u_dt;
uniform vec2 u_seed;
uniform float u_seedStrength;
out vec4 fragColor;

vec2 laplace(sampler2D tex, vec2 uv, vec2 texel) {
  vec2 c = texture(tex, uv).rg;
  vec2 n = texture(tex, uv + vec2(0.0, texel.y)).rg;
  vec2 s = texture(tex, uv - vec2(0.0, texel.y)).rg;
  vec2 e = texture(tex, uv + vec2(texel.x, 0.0)).rg;
  vec2 w = texture(tex, uv - vec2(texel.x, 0.0)).rg;
  return (n + s + e + w) - 4.0 * c;
}

void main() {
  vec2 texel = 1.0 / u_res;
  vec2 ab = texture(u_prev, v_uv).rg;
  vec2 lap = laplace(u_prev, v_uv, texel);
  float a = ab.r, b = ab.g;
  float da = u_Da * lap.r - a * b * b + u_feed * (1.0 - a);
  float db = u_Db * lap.g + a * b * b - (u_kill + u_feed) * b;
  a += da * u_dt;
  b += db * u_dt;
  float d = distance(v_uv, u_seed);
  b += smoothstep(0.08, 0.0, d) * u_seedStrength;
  fragColor = vec4(clamp(a, 0.0, 1.0), clamp(b, 0.0, 1.0), 0.0, 1.0);
}`;

const FRAG_DISPLAY = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_sim;
uniform vec3 u_mint;
uniform vec3 u_copper;
uniform float u_alpha;
out vec4 fragColor;
void main() {
  float b = texture(u_sim, v_uv).g;
  float t = smoothstep(0.2, 0.5, b);
  vec3 col = mix(u_mint, u_copper, t);
  fragColor = vec4(col, t * u_alpha);
}`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('[organism] shader compile error:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function link(gl, vsrc, fsrc) {
  const v = compile(gl, gl.VERTEX_SHADER, vsrc);
  const f = compile(gl, gl.FRAGMENT_SHADER, fsrc);
  if (!v || !f) return null;
  const p = gl.createProgram();
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('[organism] link error:', gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

function makeSimTexture(gl, size) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const data = new Float32Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i*4]   = 1.0;  // a
    data[i*4+1] = 0.0;  // b
    data[i*4+2] = 0.0;
    data[i*4+3] = 1.0;
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, size, size, 0, gl.RGBA, gl.FLOAT, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function makeFBO(gl, tex) {
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('[organism] fbo incomplete');
  }
  return fbo;
}

export function startOrganism(canvas) {
  if (!motionState.allowOrganism) return null;

  const gl = canvas.getContext('webgl2', { premultipliedAlpha: false, alpha: true, antialias: false });
  if (!gl) return null;

  // Required for float render targets
  if (!gl.getExtension('EXT_color_buffer_float')) {
    console.warn('[organism] EXT_color_buffer_float unsupported — disabling');
    return null;
  }

  const simProg = link(gl, VERT_SRC, FRAG_SIM);
  const dispProg = link(gl, VERT_SRC, FRAG_DISPLAY);
  if (!simProg || !dispProg) return null;

  // Fullscreen triangle
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(simProg, 'a_position');
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  let texA = makeSimTexture(gl, SIM_RES);
  let texB = makeSimTexture(gl, SIM_RES);
  let fboA = makeFBO(gl, texA);
  let fboB = makeFBO(gl, texB);

  const uSim = {
    prev: gl.getUniformLocation(simProg, 'u_prev'),
    res:  gl.getUniformLocation(simProg, 'u_res'),
    feed: gl.getUniformLocation(simProg, 'u_feed'),
    kill: gl.getUniformLocation(simProg, 'u_kill'),
    Da:   gl.getUniformLocation(simProg, 'u_Da'),
    Db:   gl.getUniformLocation(simProg, 'u_Db'),
    dt:   gl.getUniformLocation(simProg, 'u_dt'),
    seed: gl.getUniformLocation(simProg, 'u_seed'),
    seedStrength: gl.getUniformLocation(simProg, 'u_seedStrength'),
  };
  const uDisp = {
    sim:    gl.getUniformLocation(dispProg, 'u_sim'),
    mint:   gl.getUniformLocation(dispProg, 'u_mint'),
    copper: gl.getUniformLocation(dispProg, 'u_copper'),
    alpha:  gl.getUniformLocation(dispProg, 'u_alpha'),
  };

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const vw = canvas.clientWidth || window.innerWidth;
    const vh = canvas.clientHeight || window.innerHeight;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
  }
  resize();
  window.addEventListener('resize', resize);

  let seed = { x: 0.5, y: 0.5 };
  let seedStrength = 0;
  let alpha = 0;
  let alphaTarget = 0;

  function simStep() {
    gl.useProgram(simProg);
    gl.bindVertexArray(vao);
    gl.uniform2f(uSim.res, SIM_RES, SIM_RES);
    gl.uniform1f(uSim.feed, 0.055);
    gl.uniform1f(uSim.kill, 0.062);
    gl.uniform1f(uSim.Da, 1.0);
    gl.uniform1f(uSim.Db, 0.5);
    gl.uniform1f(uSim.dt, 1.0);
    gl.uniform2f(uSim.seed, seed.x, seed.y);
    gl.uniform1f(uSim.seedStrength, seedStrength);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
    gl.viewport(0, 0, SIM_RES, SIM_RES);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(uSim.prev, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    [texA, texB] = [texB, texA];
    [fboA, fboB] = [fboB, fboA];

    seedStrength *= 0.7;
  }

  function render() {
    gl.useProgram(dispProg);
    gl.bindVertexArray(vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(uDisp.sim, 0);
    gl.uniform3f(uDisp.mint, 197/255, 224/255, 216/255);
    gl.uniform3f(uDisp.copper, 212/255, 145/255, 94/255);
    gl.uniform1f(uDisp.alpha, alpha);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let running = true;
  let rafId = 0;
  function loop() {
    if (!running) return;
    alpha += (alphaTarget - alpha) * 0.04;
    for (let i = 0; i < SIMS_PER_FRAME; i++) simStep();
    render();
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  window.addEventListener('blur', () => { running = false; cancelAnimationFrame(rafId); });
  window.addEventListener('focus', () => {
    if (!running) { running = true; rafId = requestAnimationFrame(loop); }
  });

  return {
    breach(x, y, strength = 0.6, duration = 2500) {
      seed = { x, y: 1 - y };
      seedStrength = strength;
      alphaTarget = 1.0;
      canvas.classList.add('active');
      setTimeout(() => {
        alphaTarget = 0.0;
        setTimeout(() => canvas.classList.remove('active'), 800);
      }, duration);
    },
    setActive(active) {
      canvas.classList.toggle('active', active);
      alphaTarget = active ? 1.0 : 0.0;
    },
    destroy() {
      running = false;
      cancelAnimationFrame(rafId);
      gl.deleteTexture(texA);
      gl.deleteTexture(texB);
      gl.deleteFramebuffer(fboA);
      gl.deleteFramebuffer(fboB);
      gl.deleteProgram(simProg);
      gl.deleteProgram(dispProg);
    }
  };
}
