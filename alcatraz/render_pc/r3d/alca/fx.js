// Particle systems for Pompeii: simple sprites (FX), depth-sorted shaded puffs (Puffs) for ash/steam/surge,
// and the volcano: eruption column, lightning, ballistic bombs, pyroclastic surge.
import * as THREE from 'three';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, k) => a + (b - a) * k;
const cl = x => Math.max(0, Math.min(1, x));
export let GLH = 2880;
export function setGLH(h) { GLH = h; }

function sprite(inner, outer = 'rgba(0,0,0,0)', hard = 0.35) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 31); gr.addColorStop(0, inner); gr.addColorStop(hard, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(cv); t.userData.keep = true; return t; }
function stoneTex() { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = '#d8d2c6'; g.strokeStyle = '#3a342c'; g.lineWidth = 5; g.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, r = 20 + Math.sin(i * 7.3) * 6; i ? g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r) : g.moveTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#8a8478'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(22 + (i % 3) * 9, 22 + Math.floor(i / 3) * 9, 2.4, 0, 7); g.fill(); } const t = new THREE.CanvasTexture(cv); t.userData.keep = true; return t; }
const TX = {};
export function tx(k) { if (TX[k]) return TX[k]; const m = {
  smoke: () => sprite('rgba(150,145,138,0.55)', 'rgba(150,145,138,0)', 0.05), smokeD: () => sprite('rgba(50,46,42,0.75)', 'rgba(50,46,42,0)', 0.05), steam: () => sprite('rgba(255,255,255,0.5)', 'rgba(255,255,255,0)', 0.05),
  fire: () => sprite('rgba(255,170,60,1)', 'rgba(255,60,10,0)', 0.15), ember: () => sprite('rgba(255,210,120,1)', 'rgba(255,120,30,0)', 0.4), glow: () => sprite('rgba(255,140,50,0.9)', 'rgba(255,60,10,0)', 0.0),
  dust: () => sprite('rgba(255,240,200,0.9)', 'rgba(255,240,200,0)', 0.2), dot: () => sprite('rgba(20,14,10,1)', 'rgba(20,14,10,0)', 0.6), fly: () => sprite('rgba(10,10,10,1)', 'rgba(10,10,10,0)', 0.7),
  ash: () => sprite('rgba(110,104,96,0.9)', 'rgba(110,104,96,0)', 0.4), stone: stoneTex, drop: () => sprite('rgba(220,200,90,1)', 'rgba(220,200,90,0)', 0.5), mud: () => sprite('rgba(90,70,44,1)', 'rgba(90,70,44,0)', 0.55), snow: () => sprite('rgba(255,255,255,1)', 'rgba(255,255,255,0)', 0.45), flake: () => sprite('rgba(250,252,255,0.85)', 'rgba(250,252,255,0)', 0.15), lamp: () => sprite('rgba(255,248,215,1)', 'rgba(255,230,160,0)', 0.25), water: () => sprite('rgba(200,225,240,0.9)', 'rgba(200,225,240,0)', 0.4), plaster: () => sprite('rgba(245,242,232,1)', 'rgba(245,242,232,0)', 0.55),
}; return (TX[k] = m[k]()); }

// ---------- simple additive/normal sprites with per-particle alpha + size (analytic, deterministic) ----------
export class FX {
  constructor(scene, n, kind, additive = false, opts = {}) {
    this.n = n; const g = new THREE.BufferGeometry(); this.p = new Float32Array(n * 3); this.a = new Float32Array(n); this.s = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(this.p, 3)); g.setAttribute('alpha', new THREE.BufferAttribute(this.a, 1)); g.setAttribute('sz', new THREE.BufferAttribute(this.s, 1)); this.g = g;
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { map: { value: tx(kind) }, scale: { value: GLH / 2 }, tint: { value: new THREE.Color(opts.tint ?? 0xffffff) }, stretch: { value: opts.stretch ?? 0 } },
      vertexShader: 'attribute float alpha; attribute float sz; varying float va; uniform float scale; void main(){ va=alpha; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=sz*scale/(-mv.z); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform sampler2D map; uniform vec3 tint; uniform float stretch; varying float va; void main(){ vec2 pc=gl_PointCoord; pc.x = (pc.x-.5)*(1.+stretch*3.)+.5; if(pc.x<0.||pc.x>1.) discard; vec4 c=texture2D(map,pc); if(c.a*va<0.003) discard; gl_FragColor=vec4(pow(max(c.rgb*tint,0.),vec3(2.2))*.8,c.a*va); }' });
    m.userData.keep = true; this.pts = new THREE.Points(g, m); this.pts.frustumCulled = false; this.pts.userData.noOutline = true; scene.add(this.pts);
    let r = n * 7 + kind.length; this.R = Array.from({ length: n }, () => [0, 0, 0, 0, 0, 0].map(() => (r = (r * 9301 + 49297) % 233280) / 233280));
  }
  set(i, x, y, z, a, s) { this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z; this.a[i] = a; this.s[i] = s; }
  hide(i) { this.a[i] = 0; }
  commit() { this.g.attributes.position.needsUpdate = this.g.attributes.alpha.needsUpdate = this.g.attributes.sz.needsUpdate = true; }
}
export function plume(fx, origins, t, { life = 4, rise = 3, spread = 0.6, size = [0.6, 2.2], alpha = 0.6, wind = [0.5, 0] } = {}) {
  const per = Math.max(1, Math.floor(fx.n / origins.length));
  for (let i = 0; i < fx.n; i++) { const o = origins[Math.min(origins.length - 1, Math.floor(i / per))], R = fx.R[i]; const ph = ((t / life) + R[0]) % 1; const x = o.x + (R[1] - 0.5) * spread + wind[0] * ph * life + Math.sin(t * 1.3 + R[2] * 6) * 0.1 * ph, y = o.y + ph * rise * life, z = o.z + (R[3] - 0.5) * spread + wind[1] * ph * life; fx.set(i, x, y, z, alpha * Math.sin(ph * Math.PI) * (0.6 + R[4] * 0.4), lerp(size[0], size[1], ph) * (0.7 + R[5] * 0.6)); }
  fx.commit();
}
export function fire(fx, origins, t, scale = 1) { plume(fx, origins, t, { life: 0.9, rise: 2.0 * scale, spread: 0.9 * scale, size: [0.9 * scale, 0.25 * scale], alpha: 0.9, wind: [0.2, 0] }); }
export function pour(fx, p0, v, t, t0, dur, gy = 0, size = 0.09, flow = 1) {
  for (let i = 0; i < fx.n; i++) { const R = fx.R[i]; const te = t0 + (i / fx.n) * dur * flow; const tt = t - te; if (tt < 0 || te > t0 + dur) { fx.a[i] = 0; continue; }
    let x = p0.x + (v.x + (R[0] - 0.5) * 0.25) * tt, y = p0.y + v.y * tt - 4.9 * tt * tt, z = p0.z + (v.z + (R[1] - 0.5) * 0.25) * tt;
    if (y < gy) { const ts = tt - (Math.sqrt(v.y * v.y + 2 * 9.8 * Math.max(0, p0.y - gy)) + v.y) / 9.8; const sx = (R[2] - 0.5) * 2, sz = (R[3] - 0.5) * 2, sy = 1 + R[4]; x += sx * ts; z += sz * ts; y = Math.max(gy + 0.01, gy + sy * ts - 4.9 * ts * ts); fx.set(i, x, y, z, Math.max(0, 1 - ts * 2.5), size * 0.8); }
    else fx.set(i, x, y, z, 1, size); }
  fx.commit();
}
export function flies(fx, c, t, r = 0.6) { for (let i = 0; i < fx.n; i++) { const R = fx.R[i]; const a = t * (2 + R[0] * 3) + R[1] * 9; fx.set(i, c.x + Math.cos(a) * r * R[2] + Math.sin(t * 7 + i) * 0.05, c.y + 0.2 + Math.sin(a * 1.7) * 0.25 * R[3], c.z + Math.sin(a * 1.3) * r * R[4], 1, 0.022); } fx.commit(); }
export function motes(fx, b, t, sz = 0.02) { for (let i = 0; i < fx.n; i++) { const R = fx.R[i]; fx.set(i, b[0] + R[0] * (b[1] - b[0]) + Math.sin(t * 0.3 + i) * 0.1, b[2] + ((R[1] + t * 0.02 * (R[2] - 0.3)) % 1 + 1) % 1 * (b[3] - b[2]), b[4] + R[3] * (b[5] - b[4]), 0.5 + 0.5 * Math.sin(t * 2 + i), sz + R[4] * sz); } fx.commit(); }
// falling debris (pumice/ash/rain) inside a box, looping, with optional ground bounce
export function fall(fx, b, t, { speed = 9, size = 0.06, alpha = 1, gy = 0, sway = 0.2, density = 1 } = {}) {
  const H = b[3] - b[2];
  for (let i = 0; i < fx.n; i++) { const R = fx.R[i]; if (R[5] > density) { fx.hide(i); continue; } const sp = speed * (0.75 + R[0] * 0.5); const ph = ((t * sp / H) + R[1]) % 1; const y = b[3] - ph * H; const x = b[0] + R[2] * (b[1] - b[0]) + Math.sin(t * 2 + i) * sway * 0.2; const z = b[4] + R[3] * (b[5] - b[4]);
    if (y < gy) fx.hide(i); else fx.set(i, x, y, z, alpha, size * (0.6 + R[4] * 0.8)); }
  fx.commit();
}

// ---------- shaded, depth-sorted puffs (ash clouds, steam, surge) ----------
function puffAtlas() {
  const S = 512, N = S * 2; const cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'); const img = g.createImageData(N, N);
  const hsh = (x, y, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
  const vn = (x, y, s) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy); const a = hsh(ix, iy, s), b = hsh(ix + 1, iy, s), c = hsh(ix, iy + 1, s), d = hsh(ix + 1, iy + 1, s); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; };
  const fbm = (x, y, s) => { let v = 0, a = 0.5; for (let i = 0; i < 5; i++) { v += a * vn(x, y, s); x = x * 2.03 + 1.7; y = y * 2.03 + 3.1; a *= 0.5; } return v; };
  let r = 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  for (let cell = 0; cell < 4; cell++) { const ox = (cell % 2) * S, oy = Math.floor(cell / 2) * S;
    const lobes = []; for (let i = 0; i < 7; i++) { const a = rnd() * 6.283, d = i === 0 ? 0 : 0.18 + rnd() * 0.16; lobes.push([Math.cos(a) * d, Math.sin(a) * d * 0.75 - 0.03, i === 0 ? 0.36 : 0.16 + rnd() * 0.12]); }
    const D = new Float32Array(S * S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const u = x / S - 0.5, v = y / S - 0.5; let d = 0; for (const [lx, ly, lr] of lobes) { const q = ((u - lx) ** 2 + (v - ly) ** 2) / (lr * lr); d = Math.max(d, 1 - q); }
      const n = fbm(u * 7, v * 7, cell * 3.1), n2 = fbm(u * 22, v * 22, cell + 9); d += (n - 0.5) * 0.75 + (n2 - 0.5) * 0.25; const edge = Math.min(1, Math.max(0, (0.5 - Math.hypot(u, v)) * 6)); D[y * S + x] = d * edge; }
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = y * S + x; const d = D[i]; const k = ((oy + y) * N + ox + x) * 4; if (d <= 0) { img.data[k + 3] = 0; continue; }
      const dx = (D[y * S + Math.min(S - 1, x + 3)] - D[y * S + Math.max(0, x - 3)]), dy = (D[Math.min(S - 1, y + 3) * S + x] - D[Math.max(0, y - 3) * S + x]);
      let nx = -dx * 9, ny = -dy * 9, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      let lit = Math.max(0, nx * -0.55 + ny * -0.6 + nz * 0.58); const thick = Math.min(1, d * 1.6); const vpos = y / S; lit = 0.25 + lit * 0.75; lit *= 1 - vpos * 0.35; lit = lit * (0.75 + 0.25 * (1 - thick)) + 0.12 * (1 - thick);
      const a = Math.min(1, Math.max(0, d / 0.22)); const sh = Math.max(0, Math.min(255, lit * 255));
      img.data[k] = sh; img.data[k + 1] = sh; img.data[k + 2] = sh; img.data[k + 3] = Math.pow(a, 1.3) * 255; } }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.flipY = false; t.userData.keep = true; return t;
}
let ATLAS = null;
export class Puffs {
  constructor(scene, n, { haze = 0xb8b0a0, hazeK = 0.0, light = 0xfff2e0, amb = 0.42, additive = false } = {}) {
    this.n = n; ATLAS = ATLAS || puffAtlas(); const g = new THREE.BufferGeometry();
    this.P = new Float32Array(n * 3); this.A = new Float32Array(n); this.S = new Float32Array(n); this.I = new Float32Array(n); this.C = new Float32Array(n * 3); this.G = new Float32Array(n);
    this.bp = new Float32Array(n * 3); this.ba = new Float32Array(n); this.bs = new Float32Array(n); this.bi = new Float32Array(n); this.bc = new Float32Array(n * 3); this.bg = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(this.bp, 3)); g.setAttribute('alpha', new THREE.BufferAttribute(this.ba, 1)); g.setAttribute('sz', new THREE.BufferAttribute(this.bs, 1)); g.setAttribute('idx', new THREE.BufferAttribute(this.bi, 1)); g.setAttribute('tint', new THREE.BufferAttribute(this.bc, 3)); g.setAttribute('glow', new THREE.BufferAttribute(this.bg, 1)); this.g = g;
    this.m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { map: { value: ATLAS }, scale: { value: GLH / 2 }, hazeC: { value: new THREE.Color(haze) }, hazeK: { value: hazeK }, lightC: { value: new THREE.Color(light) }, amb: { value: amb } },
      vertexShader: 'attribute float alpha; attribute float sz; attribute float idx; attribute vec3 tint; attribute float glow; varying float va; varying float vi; varying vec3 vt; varying float vg; varying float vh; uniform float scale, hazeK; void main(){ va=alpha; vi=idx; vt=tint; vg=glow; vec4 mv=modelViewMatrix*vec4(position,1.); vh = 1.-exp(-(-mv.z)*hazeK); gl_PointSize=min(sz*scale/(-mv.z), 4096.); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform sampler2D map; uniform vec3 hazeC, lightC; uniform float amb; varying float va; varying float vi; varying vec3 vt; varying float vg; varying float vh; void main(){ vec2 pc=gl_PointCoord; vec2 uv=(pc+vec2(mod(vi,2.),floor(vi/2.)))*.5; vec4 c=texture2D(map,uv); if(c.a*va<0.004) discard; vec3 col = vt*(amb + c.r*lightC*(1.-amb)); col += vg*vec3(1.,.42,.12)*smoothstep(.25,1.,pc.y)*1.4; col = mix(col, hazeC, vh); gl_FragColor=vec4(pow(max(col,0.),vec3(2.2))*.8+vg*vec3(1.,.35,.08)*smoothstep(.25,1.,pc.y)*1.1, c.a*va); }' });
    this.m.userData.keep = true; this.pts = new THREE.Points(g, this.m); this.pts.frustumCulled = false; this.pts.userData.noOutline = true; this.pts.renderOrder = 2; scene.add(this.pts);
    let r = n * 13 + 5; this.R = Array.from({ length: n }, () => [0, 0, 0, 0, 0, 0, 0, 0].map(() => (r = (r * 9301 + 49297) % 233280) / 233280));
    this.order = new Uint32Array(n); this.depth = new Float32Array(n);
  }
  set(i, x, y, z, a, s, tint = 0.8, glow = 0) { this.P[i * 3] = x; this.P[i * 3 + 1] = y; this.P[i * 3 + 2] = z; this.A[i] = a; this.S[i] = s; this.I[i] = Math.floor(this.R[i][7] * 4); const tc = typeof tint === 'number' ? [tint, tint * 0.97, tint * 0.93] : tint; this.C[i * 3] = tc[0]; this.C[i * 3 + 1] = tc[1]; this.C[i * 3 + 2] = tc[2]; this.G[i] = glow; }
  hide(i) { this.A[i] = 0; this.S[i] = 0; }
  commit(cam) { // back-to-front sort
    const e = cam.matrixWorldInverse.elements; const n = this.n; for (let i = 0; i < n; i++) { this.order[i] = i; this.depth[i] = e[2] * this.P[i * 3] + e[6] * this.P[i * 3 + 1] + e[10] * this.P[i * 3 + 2] + e[14]; }
    const d = this.depth; const ord = Array.from(this.order).sort((a, b) => d[a] - d[b]);
    for (let k = 0; k < n; k++) { const i = ord[k]; this.bp[k * 3] = this.P[i * 3]; this.bp[k * 3 + 1] = this.P[i * 3 + 1]; this.bp[k * 3 + 2] = this.P[i * 3 + 2]; this.ba[k] = this.A[i]; this.bs[k] = this.S[i]; this.bi[k] = this.I[i]; this.bc[k * 3] = this.C[i * 3]; this.bc[k * 3 + 1] = this.C[i * 3 + 1]; this.bc[k * 3 + 2] = this.C[i * 3 + 2]; this.bg[k] = this.G[i]; }
    for (const k of ['position', 'alpha', 'sz', 'idx', 'tint', 'glow']) this.g.attributes[k].needsUpdate = true;
  }
}
// steam / smoke made of shaded puffs
export function puffPlume(pf, i0, i1, o, t, { life = 3, rise = 1, spread = 0.3, size = [0.3, 1.2], alpha = 0.6, wind = [0.3, 0], tint = 0.95, glow = 0 } = {}) {
  for (let i = i0; i < i1; i++) { const R = pf.R[i]; const ph = ((t / life) + R[0]) % 1; const x = o.x + (R[1] - 0.5) * spread * (1 + ph * 2) + wind[0] * ph * life + Math.sin(t + R[2] * 6) * 0.1 * ph, y = o.y + ph * rise * life, z = o.z + (R[3] - 0.5) * spread * (1 + ph * 2) + wind[1] * ph * life;
    pf.set(i, x, y, z, alpha * Math.min(1, ph * 6) * (1 - ph) * (0.7 + R[4] * 0.3), lerp(size[0], size[1], ph) * (0.7 + R[5] * 0.6), tint, glow * (1 - ph)); }
}

// ---------- the eruption ----------
// crater: world position; H: column height; dir: wind drift (unit-ish vector in xz); R0: vent radius.
// e: seconds since the blast (can be scaled by shots); collapse: 0..1 progress of column collapse
export class Eruption {
  constructor(scene, crater, { H = 2600, n = 1800, scale = 1, haze = 0xb8b0a0, hazeK = 0.00012, umbrella = 1400, wind = V(0.55, 0, 0.45), bombs = 60, lightning = true } = {}) {
    this.c = crater.clone(); this.H = H; this.U = umbrella; this.wind = wind.clone().normalize(); this.sc = scale;
    this.pf = new Puffs(scene, n, { haze, hazeK, amb: 0.38 });
    this.glow = new FX(scene, 40, 'glow', true); this.bomb = new FX(scene, bombs, 'ember', true); this.trail = new FX(scene, bombs * 6, 'smokeD');
    this.bolts = []; this.flash = 0;
    if (lightning) for (let k = 0; k < 4; k++) { const m = new THREE.MeshBasicMaterial({ color: 0xd8e4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); m.userData.keep = true; const pts = []; let p = V(0, 0, 0); for (let i = 0; i < 14; i++) { pts.push(p.clone()); p = p.add(V((Math.sin(i * 7.1 + k * 3) ) * 60, -70 - Math.abs(Math.sin(i * 3.3 + k)) * 40, Math.cos(i * 5.3 + k) * 50)); } const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.0), 60, 5, 5); const mesh = new THREE.Mesh(geo, m); mesh.userData.noOutline = true; scene.add(mesh); this.bolts.push(mesh); }
  }
  // returns light flash 0..1 for the caller to use
  update(e, cam, { collapse = 0, dark = 0, base = true } = {}) {
    const { c, H, U, wind, pf } = this; const n = pf.n; const front = H * (1 - Math.exp(-Math.max(0, e) / 3.2)); const vis = e > 0;
    for (let i = 0; i < n; i++) { const R = pf.R[i]; if (!vis) { pf.hide(i); continue; }
      const s0 = R[0]; const flow = (s0 + e * 0.035) % 1; let s = flow; // position along the column (0 bottom .. 1 top)
      const umb = 0.78; let y, r, size, tint, alpha = 0.95, glow = 0;
      const th = R[1] * 6.283 + e * 0.12 * (1 - s) + R[2];
      if (s < umb) { const hh = s / umb * 0.86 * H; y = hh; r = 40 + Math.pow(s / umb, 1.25) * 380 + R[3] * 60; size = 160 + r * 1.3; tint = 0.42 + s * 0.35 + R[4] * 0.1; glow = s < 0.06 ? (0.06 - s) / 0.06 * (1 - dark * 0.2) : 0; }
      else { const k = (s - umb) / (1 - umb); y = H * (0.86 + 0.14 * Math.sin(k * Math.PI * 0.5) - k * k * 0.06) + (R[5] - 0.5) * 140; r = 380 + k * U * (0.7 + R[3] * 0.5); size = 300 + k * 520; tint = 0.72 + R[4] * 0.12 - k * 0.12; }
      // the column only exists up to its rising front; particles beyond pile up in the boiling head
      if (y > front) { const over = (y - front) / H; if (over > 0.18 + R[6] * 0.2) { pf.hide(i); continue; } y = front - R[6] * 120; r = Math.min(r, 80 + front * 0.18) * (0.6 + R[3] * 0.6); size *= 1.25; }
      // wind drift grows with height
      const drift = Math.pow(y / H, 2.2) * 1100 * (y > 0.8 * H ? 1.4 : 1);
      let x = c.x + Math.cos(th) * r + wind.x * drift, z = c.z + Math.sin(th) * r * 0.85 + wind.z * drift, yy = c.y + y;
      // collapse: the column sinks and spreads as fountain-collapse at the base
      if (collapse > 0) { const k = cl(collapse * 1.3 - (1 - s) * 0.3); yy = c.y + y * (1 - k * 0.92); x += Math.cos(th) * k * 600 * (1 - s); z += Math.sin(th) * k * 600 * (1 - s); tint *= 1 - k * 0.25; alpha *= 1 - k * 0.15; }
      tint *= 1 - dark * 0.55;
      pf.set(i, x, yy, z, alpha, size * this.sc, tint, glow);
    }
    pf.commit(cam);
    // vent glow + incandescent bombs on parabolic arcs, each with a smoke trail
    for (let i = 0; i < this.glow.n; i++) { const R = this.glow.R[i]; this.glow.set(i, c.x + (R[0] - 0.5) * 120, c.y + R[1] * 90, c.z + (R[2] - 0.5) * 120, vis ? (0.5 + 0.5 * Math.sin(e * 9 + i)) * (0.6 + dark * 0.6) * (1 - collapse) : 0, 220 + R[3] * 200); } this.glow.commit();
    for (let i = 0; i < this.bomb.n; i++) { const R = this.bomb.R[i]; const per = 2.2 + R[0] * 1.5; const tt = ((e + R[1] * per) % per); const born = e - tt; if (!vis || born < 0 || e > 14) { this.bomb.hide(i); for (let k = 0; k < 6; k++) this.trail.hide(i * 6 + k); continue; }
      const vx = (R[2] - 0.5) * 220, vz = (R[3] - 0.5) * 220, vy = 260 + R[4] * 220; const pos = (q) => V(c.x + vx * q, c.y + vy * q - 0.5 * 120 * q * q, c.z + vz * q);
      const p = pos(tt); this.bomb.set(i, p.x, p.y, p.z, Math.max(0, 1 - tt / per), 26 + R[5] * 20); for (let k = 0; k < 6; k++) { const q = Math.max(0, tt - k * 0.08); const pp = pos(q); this.trail.set(i * 6 + k, pp.x, pp.y, pp.z, 0.5 * (1 - k / 6) * Math.max(0, 1 - tt / per), 40 + k * 12); } }
    this.bomb.commit(); this.trail.commit();
    // lightning in the ash column
    let flash = 0; this.bolts.forEach((b, k) => { const per = 1.1 + k * 0.37; const ph = ((e + k * 0.53) % per) / per; const on = vis && e > 1.2 && ph < 0.07 && collapse < 0.8; b.material.opacity = on ? 1 - ph / 0.07 : 0; if (on) { flash = Math.max(flash, 1 - ph / 0.07); const s = Math.floor((e + k * 0.53) / per); b.position.set(c.x + Math.sin(s * 12.9 + k) * 260 + wind.x * 300, c.y + H * (0.35 + 0.25 * Math.abs(Math.sin(s * 3.7 + k))), c.z + Math.cos(s * 7.1 + k) * 200); b.rotation.y = s * 2.1; } });
    return flash;
  }
}
// pyroclastic density current: a ground-hugging, billowing front that advances along `path(d)` (returns ground point at distance d)
// front: distance of the leading edge; width: lateral spread; len: length of the body behind the front
export class Surge {
  constructor(scene, n = 1400, { haze = 0x8a7a6a, hazeK = 0.0002, size = 60, width = 900, len = 1600, light = 0xffd8b0, amb = 0.34 } = {}) { this.pf = new Puffs(scene, n, { haze, hazeK, light, amb }); this.size = size; this.width = width; this.len = len; }
  update(front, t, path, side, cam, { tint = 0.42, glow = 0.25, height = 1 } = {}) {
    const pf = this.pf;
    for (let i = 0; i < pf.n; i++) { const R = pf.R[i]; const back = Math.pow(R[0], 1.4) * this.len; const d = front - back; if (d < 0) { pf.hide(i); continue; }
      const g = path(d); const lat = (R[1] - 0.5) * this.width * (0.5 + 0.5 * Math.min(1, d / this.len + 0.3)); const sp = side(d);
      // billows rise behind the front and roll over the top
      const roll = R[2] * 6.283 + t * (1.2 + R[3]); const hgt = this.size * height * (0.4 + back / this.len * 5.5 * (0.5 + R[4])) ;
      const x = g.x + sp.x * lat + Math.cos(roll) * this.size * 0.3, z = g.z + sp.z * lat + Math.sin(roll) * this.size * 0.3, y = g.y + hgt * (0.3 + 0.7 * R[5]) + Math.sin(roll) * this.size * 0.2;
      const near = 1 - Math.min(1, back / (this.len * 0.25));
      pf.set(i, x, y, z, 0.96, this.size * (0.9 + R[6] * 1.1) * (1 + back / this.len * 1.6), tint * (0.85 + R[7] * 0.3) * (1 - near * 0.15), glow * 0.45 * (0.2 + near * 0.8) * (R[6] > 0.5 ? R[6] : 0.15)); }
    pf.commit(cam);
  }
}
