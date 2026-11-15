// Everest kit (South Col route): high-altitude skies, stars, snow/rock heightfield terrain, Himalayan peaks with
// summit plume, Khumbu Icefall seracs + crevasse, aluminium ladders, fixed ropes, dome tents, prayer flags,
// oxygen bottles, Kathmandu permit office.
import * as THREE from 'three';
import { T, mat, std, box } from './world.js';
import * as R from './rome.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const shadowAll = (g) => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------------- skies ----------------
Object.assign(R.SKY, {
  himal: { c: [0x08225e, 0x3570c8, 0xd8e4f0], fog: 0xd4dfea, fd: 0.0005, hemi: [0xf4f8ff, 0x5a6a84, 1.05], sun: [0xfff2e2, 2.9], cloud: 0.22 },
  himalHaze: { c: [0x163a7a, 0x5a8ccc, 0xe2e8f0], fog: 0xdce4ee, fd: 0.0009, hemi: [0xf4f8ff, 0x5a6a84, 1.05], sun: [0xfff2e2, 2.7], cloud: 0.4 },
  nightE: { c: [0x01030a, 0x061028, 0x14244a], fog: 0x0b1428, fd: 0.0018, hemi: [0x5a72b0, 0x05070e, 0.55], sun: [0x8aa4e0, 0.75], cloud: 0.0 },
  blizz: { c: [0x4a5464, 0x6a7686, 0x8a96a4], fog: 0x7a8696, fd: 0.045, hemi: [0xc8d2e0, 0x3a4656, 1.0], sun: [0xd0dae8, 0.9], cloud: 0.0 },
  dawnE: { c: [0x15255a, 0x7a70aa, 0xffb488], fog: 0xdcb8b0, fd: 0.0006, hemi: [0xffe2d2, 0x4a4a6e, 0.95], sun: [0xffb070, 2.8], cloud: 0.12 },
  goldE: { c: [0x14306e, 0x5a88c8, 0xffd8a8], fog: 0xe8d4c0, fd: 0.0005, hemi: [0xfff0e0, 0x5a5a7a, 1.05], sun: [0xffd09a, 3.0], cloud: 0.2 },
  stormE: { c: [0x3a4250, 0x5e6878, 0x8a929e], fog: 0x7a8492, fd: 0.02, hemi: [0xc0c8d4, 0x2a3240, 1.15], sun: [0xc8d0dc, 0.8], cloud: 0.0 },
  duskE: { c: [0x0e1838, 0x4a4a7a, 0xd88a6a], fog: 0x6a5a70, fd: 0.0012, hemi: [0x9a9ac8, 0x2a2838, 0.95], sun: [0xffb898, 1.3], cloud: 0.18 },
});
export function skyE(scene, mode, sunDir) { const s = R.sky(scene, mode); if (sunDir) s.material.uniforms.sunDir.value.copy(sunDir).normalize(); return s; }

// stars: points on a big dome
export function stars(scene, n = 2600, r = 6000) { const p = new Float32Array(n * 3), c = new Float32Array(n * 3); let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) { const u = rnd(), v = rnd() * 0.95 + 0.04; const th = u * Math.PI * 2, ph = Math.asin(v); p[i * 3] = Math.cos(th) * Math.cos(ph) * r; p[i * 3 + 1] = Math.sin(ph) * r; p[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * r; const b = 0.35 + rnd() * 0.65; c[i * 3] = b * (0.85 + rnd() * 0.15); c[i * 3 + 1] = b * 0.92; c[i * 3 + 2] = b; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const m = new THREE.PointsMaterial({ size: 3.6, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, depthWrite: false });
  const pts = new THREE.Points(g, m); pts.userData.noOutline = true; pts.frustumCulled = false; pts.renderOrder = -9; scene.add(pts);
  // milky way band
  const mw = new Float32Array(1800 * 3), mc = new Float32Array(1800 * 3); for (let i = 0; i < 1800; i++) { const a = rnd() * Math.PI * 2, w = (rnd() - 0.5) * 0.22; const d = V(Math.cos(a), Math.sin(a) * 0.55 + 0.45 + w, Math.sin(a) * 0.4 + w).normalize().multiplyScalar(r * 0.99); mw.set([d.x, Math.abs(d.y), d.z], i * 3); const b = 0.2 + rnd() * 0.35; mc.set([b, b, b * 1.1], i * 3); }
  const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.BufferAttribute(mw, 3)); g2.setAttribute('color', new THREE.BufferAttribute(mc, 3)); const p2 = new THREE.Points(g2, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, depthWrite: false })); p2.userData.noOutline = true; p2.frustumCulled = false; scene.add(p2);
  return pts; }

// ---------------- noise ----------------
function h2(x, y, s) { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); }
function vn(x, y, s = 0) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export function fbm(x, y, s = 0, oct = 5) { let t = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { t += a * vn(x * f, y * f, s + i * 13); f *= 2.03; a *= 0.5; } return t; }
export function ridged(x, y, s = 0, oct = 5) { let t = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { const n = 1 - Math.abs(vn(x * f, y * f, s + i * 7) * 2 - 1); t += a * n * n; f *= 2.1; a *= 0.5; } return t; }

// ---------------- materials ----------------
const SNOW = new THREE.Color(0xeef2f8), SNOWB = new THREE.Color(0xc8d6ea), ROCK = new THREE.Color(0x4c4744), ROCK2 = new THREE.Color(0x6a625a), ICE = new THREE.Color(0xbfe0f2);
let _snowM;
export function snowMat() { if (_snowM) return _snowM; _snowM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, bumpMap: T.plaster.bump, bumpScale: 1.2 }); return _snowM; }

// heightfield terrain with snow/rock split by slope; centred at origin, size w x d
export function terrain(w, d, seg, hfn, o = {}) {
  const g = new THREE.PlaneGeometry(w, d, seg, Math.round(seg * d / w)); g.rotateX(-Math.PI / 2); const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); P.setY(i, hfn(x, z)); }
  g.computeVertexNormals(); const N = g.attributes.normal; const col = new Float32Array(P.count * 3); const c = new THREE.Color();
  const rockAt = o.rockAt ?? 0.62, sd = o.seed ?? 3;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); const steep = 1 - N.getY(i); const n = fbm(x * 0.08, z * 0.08, sd, 3);
    const rk = sm(rockAt - 0.12, rockAt + 0.05, steep * 1.4 + (n - 0.5) * 0.5) * (o.rock ?? 1);
    c.copy(SNOW).lerp(SNOWB, (sm(0.3, 0.8, n) * 0.6 + sm(0.15, 0.5, steep) * 0.35) * (o.vari ?? 1)); if (o.ice) c.lerp(ICE, o.ice * sm(0.3, 0.7, fbm(x * 0.3, z * 0.3, 9, 2)));
    const rc = ROCK.clone().lerp(ROCK2, fbm(x * 0.4, y * 0.6, 5, 3)); c.lerp(rc, rk); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, o.mat || snowMat()); m.receiveShadow = true; m.castShadow = o.cast ?? false; m.userData.ground = o.ground ?? true; m.userData.noOutline = true; m.userData.h = hfn; return m;
}

// distant Himalayan peak: pyramid + ridged noise, snow on gentle faces, dark rock on cliffs, haze blended
export function peak(H, Rr, o = {}) {
  const seg = o.seg ?? 160, sd = o.seed ?? 1; const sk = o.skew ?? 0.2;
  const hfn = (x, z) => { const u = x / Rr, v = z / Rr; const d = Math.max(Math.abs(u + v * sk) * (1 + (o.asym ?? 0) * Math.sign(u)), Math.abs(v) * 1.15) * 0.75 + Math.hypot(u, v) * 0.35;
    let h = Math.pow(Math.max(0, 1 - d), o.pow ?? 1.25) * H; const rn = ridged(u * 3.2 + 10, v * 3.2, sd) * H * 0.22 * (0.4 + Math.max(0, 1 - d)); h += rn - H * 0.06; return Math.max(-H * 0.05, h); };
  const m = terrain(Rr * 2.2, Rr * 2.2, seg, hfn, { rockAt: o.rockAt ?? 0.48, seed: sd, ground: false, mat: R.hazeMat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, bumpMap: T.plaster.bump, bumpScale: 0.6 }), o.hazeC ?? 0xdfe7f0, o.haze ?? 0.25) });
  m.userData.noOutline = true; return m;
}
// a whole range on the horizon: list of [x, z, H, R, seed]
export function range(list, o = {}) { const g = new THREE.Group(); for (const [x, z, H, Rr, s, extra] of list) { const p = peak(H, Rr, { seed: s, haze: o.haze, hazeC: o.hazeC, ...(extra || {}) }); p.position.set(x, o.y ?? 0, z); g.add(p); } return g; }

// summit plume of wind-blown snow (Puffs-free: big soft sprites)
export function plumeFX(fx, top, lt, { dir = V(1, 0.08, 0.25), len = 900, wid = 120, size = 160, alpha = 0.32 } = {}) {
  for (let i = 0; i < fx.n; i++) { const R_ = fx.R[i]; const ph = (lt * 0.05 + R_[0]) % 1; const spread = ph * wid + 20;
    fx.set(i, top.x + dir.x * ph * len + (R_[1] - 0.5) * spread, top.y + dir.y * ph * len + (R_[2] - 0.5) * spread * 0.6 - ph * ph * 60, top.z + dir.z * ph * len + (R_[3] - 0.5) * spread, alpha * Math.sin(ph * Math.PI) * (0.5 + R_[4] * 0.5), size * (0.4 + ph * 1.6) * (0.6 + R_[5] * 0.8)); }
  fx.commit(); }
// wind-driven snow streaks around a point
export function blizzardFX(fx, c, lt, { box = [30, 14, 30], wind = V(-14, -3, 2), size = 0.05, alpha = 0.85 } = {}) {
  for (let i = 0; i < fx.n; i++) { const R_ = fx.R[i]; const ph = (lt * (0.5 + R_[0] * 0.5) + R_[1]) % 1; const x = c.x + (R_[2] - 0.5) * box[0] + wind.x * (ph - 0.5) * 2, y = c.y + (R_[3]) * box[1] + wind.y * (ph - 0.5) * 2 + Math.sin(lt * 3 + i) * 0.2, z = c.z + (R_[4] - 0.5) * box[2] + wind.z * (ph - 0.5) * 2;
    fx.set(i, x, y, z, alpha * Math.sin(ph * Math.PI), size * (0.5 + R_[5])); } fx.commit(); }
// spindrift blowing along the ground
export function driftFX(fx, c, lt, { w = 16, d = 10, wind = V(-6, 0.4, 1), size = 0.35, alpha = 0.35, hfn } = {}) {
  for (let i = 0; i < fx.n; i++) { const R_ = fx.R[i]; const ph = (lt * 0.6 + R_[0]) % 1; const x = c.x + (R_[1] - 0.5) * w + wind.x * ph, z = c.z + (R_[2] - 0.5) * d + wind.z * ph; const y = (hfn ? hfn(x, z) : c.y) + 0.1 + R_[3] * 0.5 + wind.y * ph;
    fx.set(i, x, y, z, alpha * Math.sin(ph * Math.PI), size * (0.5 + R_[4] * 1.2)); } fx.commit(); }

// ---------------- ice ----------------
let _iceM;
export function iceMat() { if (_iceM) return _iceM; _iceM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.22, metalness: 0.02, bumpMap: T.marble.bump, bumpScale: 1.4, emissive: 0x0a2a44, emissiveIntensity: 0.25 }); return _iceM; }
// a jagged serac (ice tower) with snow cap, base at y=0
export function serac(w, h, d, seed = 1) {
  const g = new THREE.BoxGeometry(w, h, d, 6, 10, 6); g.translate(0, h / 2, 0); const P = g.attributes.position; const col = new Float32Array(P.count * 3); const c = new THREE.Color();
  for (let i = 0; i < P.count; i++) { let x = P.getX(i), y = P.getY(i), z = P.getZ(i); const k = y / h; const n = fbm(x * 0.6 + seed, y * 0.4, seed, 3) - 0.5, n2 = fbm(z * 0.6, y * 0.4 + seed, seed + 3, 3) - 0.5;
    x *= 1 - k * 0.25 + n * 0.35; z *= 1 - k * 0.2 + n2 * 0.35; y += (k > 0.98 ? (fbm(x, z, seed, 2) - 0.5) * h * 0.18 : 0) + n * 0.4; P.setXYZ(i, x, y, z);
    const top = sm(0.86, 0.99, k); c.setRGB(0.5 + k * 0.22, 0.72 + k * 0.12, 0.9); c.lerp(new THREE.Color(0x3a88c0), sm(0.5, 0.0, k) * 0.6); c.lerp(SNOW, top); col.set([c.r, c.g, c.b], i * 3); }
  g.computeVertexNormals(); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); const m = new THREE.Mesh(g, iceMat()); m.castShadow = true; m.receiveShadow = true; return m;
}
export function icefall(n, area, seed = 3, keepOut) { const g = new THREE.Group(); let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) { const x = (rnd() - 0.5) * area[0], z = (rnd() - 0.5) * area[1]; if (keepOut && keepOut(x, z)) continue; const sc = 0.6 + rnd() * 1.4; const s_ = serac(3 * sc + rnd() * 3, 4 * sc + rnd() * 8, 3 * sc + rnd() * 3, i + seed); s_.position.set(x, -1 - rnd() * 2, z); s_.rotation.set((rnd() - 0.5) * 0.25, rnd() * 6, (rnd() - 0.5) * 0.25); g.add(s_); }
  return g; }
// crevasse walls: two facing ice cliffs with depth gradient (white lip -> blue -> black)
export function crevasseWall(len, depth, seed = 2) {
  const g = new THREE.PlaneGeometry(len, depth, 40, 30); g.translate(0, -depth / 2, 0); const P = g.attributes.position; const col = new Float32Array(P.count * 3); const c = new THREE.Color();
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i); const k = -y / depth; const n = fbm(x * 0.3, y * 0.3, seed, 4); P.setZ(i, (n - 0.5) * 1.6 + Math.sin(y * 0.25 + seed) * 0.5 + k * 0.6);
    const dm = -y; c.setRGB(0.92, 0.97, 1.0).lerp(new THREE.Color(0x6ab4e8), sm(0.3, 2.0, dm)).lerp(new THREE.Color(0x1a5a9a), sm(2.0, 9, dm)).lerp(new THREE.Color(0x06203c), sm(8, 22, dm)).lerp(new THREE.Color(0x010409), sm(20, 45, dm)); col.set([c.r, c.g, c.b], i * 3); }
  g.computeVertexNormals(); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: 0x0a3a66, emissiveIntensity: 0.12, bumpMap: T.marble.bump, bumpScale: 1.2, side: THREE.DoubleSide })); m.receiveShadow = true; m.userData.noOutline = true; return m;
}
// icicles along an edge
export function icicles(len, n = 30, seed = 4) { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0xd8f0ff, roughness: 0.15, transparent: true, opacity: 0.85 }); for (let i = 0; i < n; i++) { const l = 0.2 + h2(i, seed, 1) * 0.9; const c = new THREE.Mesh(new THREE.ConeGeometry(0.04 + h2(i, 2, seed) * 0.05, l, 6), m); c.rotation.x = Math.PI; c.position.set((i / n - 0.5) * len, -l / 2, 0); g.add(c); } g.traverse(o => o.userData.noOutline = true); return g; }

// ---------------- gear ----------------
const alu = () => std(0xc8ccd4, { metalness: 0.85, roughness: 0.32 });
// aluminium ladder along +x from origin (len m), lashed sections
export function ladder(len, o = {}) { const g = new THREE.Group(); const w = o.w ?? 0.46; const am = alu();
  for (const z of [-w / 2, w / 2]) { const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.035), am); r.position.set(len / 2, 0, z); g.add(r); }
  for (let x = 0.15; x < len; x += 0.3) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, w, 8), am); r.rotation.x = Math.PI / 2; r.position.set(x, 0, 0); g.add(r); }
  const lm = mat('cloth', 0x2a5ad8, { bump: 1 }); for (let x = 2.1; x < len - 0.5; x += 2.1) for (const z of [-w / 2, w / 2]) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 6, 12), lm); b.rotation.y = Math.PI / 2; b.position.set(x, 0, z); g.add(b); }
  return shadowAll(g); }
// handline rope following a polyline
export function rope(pts, r = 0.018, color = 0xd83a2a) { const c = new THREE.CatmullRomCurve3(pts); const m = new THREE.Mesh(new THREE.TubeGeometry(c, Math.max(8, pts.length * 10), r, 6), std(color, { roughness: 0.6 })); m.castShadow = true; m.userData.noOutline = true; return m; }
export function sagRope(a, b, sag = 0.4, r = 0.018, color = 0xd83a2a, n = 14) { const p = []; for (let i = 0; i <= n; i++) { const k = i / n; const q = a.clone().lerp(b, k); q.y -= Math.sin(k * Math.PI) * sag; p.push(q); } return rope(p, r, color); }
export function picket(h = 0.8) { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.05), alu()); p.position.y = h / 2 - 0.2; g.add(p); const c = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 12), std(0xd8b030, { metalness: 0.8, roughness: 0.3 })); c.position.y = h - 0.22; g.add(c); return shadowAll(g); }
export function o2bottle(col = 0xe8742a) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 6, 16), std(col, { roughness: 0.35, metalness: 0.2 })); b.position.y = 0.3; g.add(b); const v = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 10), alu()); v.position.y = 0.6; g.add(v); return shadowAll(g); }

// dome tent: colour, size; glow -> warm inner light (night)
export function tent(col = 0xe8742a, s = 1, o = {}) { const g = new THREE.Group(); const m = std(col, { roughness: 0.6, emissive: o.glow ? col : 0x000000, emissiveIntensity: o.glow ? 0.55 : 0 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); dome.scale.set(1.25 * s, 0.95 * s, 1.0 * s); g.add(dome);
  const fly = new THREE.Mesh(new THREE.SphereGeometry(1.0, 20, 8, -0.6, 1.2, Math.PI * 0.15, Math.PI * 0.35), std(0x2a2a30, { roughness: 0.7, emissive: o.glow ? 0x3a2a10 : 0, emissiveIntensity: 0.5 })); fly.scale.set(1.3 * s, 0.98 * s, 1.04 * s); fly.rotation.y = Math.PI / 2; g.add(fly);
  const pm = std(0x1a1a1e, { roughness: 0.5 }); for (const a of [0.6, -0.6]) { const p = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.022, 6, 32, Math.PI), pm); p.rotation.y = a; p.scale.set(1.25 * s, 0.97 * s, 1 * s); g.add(p); }
  const door = new THREE.Mesh(new THREE.CircleGeometry(0.42 * s, 20, 0, Math.PI), std(o.glow ? 0xffc870 : 0x1a1410, { emissive: o.glow ? 0xffa840 : 0, emissiveIntensity: o.glow ? 1.2 : 0 })); door.position.set(0, 0.02, 1.0 * s + 0.01); door.scale.y = 1.4; g.add(door);
  const skirt = new THREE.Mesh(new THREE.TorusGeometry(1.3 * s, 0.18 * s, 6, 24), std(0xf4f8fc, { roughness: 0.9 })); skirt.rotation.x = Math.PI / 2; skirt.scale.set(1.05, 0.85, 1); skirt.position.y = 0.04; g.add(skirt);
  for (const [x, z] of [[1.9, 0.9], [-1.9, 0.9], [1.9, -0.9], [-1.9, -0.9]]) g.add(sagRope(V(x * 0.62 * s, 0.75 * s, z * 0.7 * s), V(x * s, 0.02, z * 1.2 * s), 0.02, 0.008, 0xe0d040, 4));
  if (o.glow) { const l = new THREE.PointLight(0xffb060, o.glow, 9 * s, 1.6); l.position.set(0, 0.6 * s, 0); g.add(l); g.userData.light = l; }
  shadowAll(g); return g; }

// prayer flags along a sagging line; update(lt) flutters
const FC = [0x2a5ad8, 0xf4f2ea, 0xd8302a, 0x2a9a4a, 0xf2c230];
export function prayerFlags(a, b, n = 18, sag = 0.6, sz = 0.32) { const g = new THREE.Group(); g.add(sagRope(a, b, sag, 0.008, 0xd8cca8, 24)); const fl = [];
  const tex = flagTex(); for (let i = 0; i < n; i++) { const k = (i + 0.5) / n; const p = a.clone().lerp(b, k); p.y -= Math.sin(k * Math.PI) * sag;
    const geo = new THREE.PlaneGeometry(sz, sz * 1.15, 4, 1); geo.translate(sz / 2, -sz * 0.575, 0); const m = new THREE.MeshStandardMaterial({ color: FC[i % 5], map: tex, side: THREE.DoubleSide, roughness: 0.9 }); const f = new THREE.Mesh(geo, m);
    f.position.copy(p); f.lookAt(p.clone().add(b.clone().sub(a).cross(V(0, 1, 0)).normalize())); f.rotateY(-Math.PI / 2); f.castShadow = true; f.userData.noOutline = true; f.userData.ph = i * 0.7; g.add(f); fl.push(f); }
  g.userData.update = (lt, w = 1) => { for (const f of fl) { const P = f.geometry.attributes.position; for (let j = 0; j < P.count; j++) { const x = P.getX(j); P.setZ(j, Math.sin(lt * 9 * w + f.userData.ph + x * 14) * x * 0.35 * w); } P.needsUpdate = true; } };
  return g; }
let _ft; function flagTex() { if (_ft) return _ft; const cv = document.createElement('canvas'); cv.width = 128; cv.height = 148; const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, 128, 148); c.fillStyle = 'rgba(0,0,0,.28)'; for (let y = 22; y < 140; y += 10) for (let x = 12; x < 118; x += 6 + (x * y) % 5) c.fillRect(x, y, 3 + (x % 3), 2); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; c.beginPath(); c.arc(64, 58, 20, 0, 7); c.stroke(); for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(80,60,40,${Math.random() * 0.08})`; c.fillRect(Math.random() * 128, Math.random() * 148, 2, 2); } _ft = new THREE.CanvasTexture(cv); _ft.colorSpace = THREE.SRGBColorSpace; return _ft; }

// rocks / boulders sitting in snow
export function boulder(r = 1, seed = 1) { const g = new THREE.IcosahedronGeometry(r, 2); const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const v = V(P.getX(i), P.getY(i), P.getZ(i)); const n = fbm(v.x * 1.3 + seed, v.y * 1.3, seed, 3); v.multiplyScalar(0.75 + n * 0.5); v.y *= 0.7; P.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); const m = new THREE.Mesh(g, mat('basalt', 0xb8b0a8, { bump: 2 })); m.castShadow = m.receiveShadow = true; return m; }

// ---------------- Kathmandu permit office ----------------
function canvasT(w, h, f) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
export function posterTex() { return canvasT(512, 700, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a3a7a'); g.addColorStop(0.6, '#7aa8e0'); g.addColorStop(1, '#e8eef4'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#5a5e6a'; c.beginPath(); c.moveTo(-20, h * 0.85); c.lineTo(w * 0.52, h * 0.22); c.lineTo(w * 0.7, h * 0.42); c.lineTo(w * 0.85, h * 0.35); c.lineTo(w + 20, h * 0.7); c.lineTo(w + 20, h); c.lineTo(-20, h); c.fill();
  c.fillStyle = '#f4f8fc'; c.beginPath(); c.moveTo(w * 0.52, h * 0.22); c.lineTo(w * 0.62, h * 0.36); c.lineTo(w * 0.55, h * 0.34); c.lineTo(w * 0.48, h * 0.42); c.lineTo(w * 0.42, h * 0.36); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(0, h * 0.82, w, h);
  c.fillStyle = '#fff'; c.font = '900 64px Nunito'; c.textAlign = 'center'; c.fillText('SAGARMATHA', w / 2, 90); c.font = '800 34px Nunito'; c.fillText('8,849 m', w / 2, 140); c.strokeStyle = '#c9a24a'; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14); }); }
export function permitTex() { return canvasT(400, 280, (c, w, h) => { c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a2a2a'; c.lineWidth = 8; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = '#3a2a2a'; c.font = '900 34px Nunito'; c.textAlign = 'center'; c.fillText('CLIMBING PERMIT', w / 2, 62); c.font = '800 22px Nunito'; c.fillText('MT. EVEREST · SPRING SEASON', w / 2, 98); c.fillStyle = 'rgba(60,40,40,.45)'; for (let y = 130; y < 230; y += 22) c.fillRect(40, y, 200 + (y % 3) * 30, 6); c.strokeStyle = 'rgba(180,30,40,.8)'; c.lineWidth = 6; c.beginPath(); c.arc(320, 190, 46, 0, 7); c.stroke(); c.font = '900 18px Nunito'; c.fillStyle = 'rgba(180,30,40,.8)'; c.fillText('APPROVED', 320, 196); }); }
export function cashStack(n = 6) { const g = new THREE.Group(); const t = canvasT(256, 110, (c, w, h) => { c.fillStyle = '#b8d0a8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#4a6a3a'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#4a6a3a'; c.font = '900 52px Nunito'; c.textAlign = 'center'; c.fillText('100', 50, 72); c.fillText('100', w - 50, 72); c.beginPath(); c.ellipse(w / 2, h / 2, 34, 40, 0, 0, 7); c.fill(); });
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }); const side = std(0xe8e4d4); for (let i = 0; i < n; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.07), [side, side, m, side, side, side]); b.position.set((h2(i, 1, 2) - 0.5) * 0.02, 0.011 + i * 0.022, (h2(i, 3, 2) - 0.5) * 0.02); b.rotation.y = (h2(i, 5, 2) - 0.5) * 0.15; const band = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.024, 0.072), std(0xe8d8a0)); b.add(band); g.add(b); } return shadowAll(g); }
export function office() { const g = new THREE.Group(); const W_ = 6, D = 5, H = 3.1;
  const floor = box(W_, 0.1, D, mat('planks', 0xa8784a), 1.2); floor.position.y = -0.05; floor.userData.ground = true; g.add(floor);
  const wm = mat('plaster', 0xe8dcc4, { bump: 1.0 }); for (const [w, x, z, ry] of [[W_, 0, -D / 2, 0], [D, -W_ / 2, 0, Math.PI / 2], [D, W_ / 2, 0, -Math.PI / 2]]) { const m = box(w, H, 0.2, wm, 2); m.position.set(x, H / 2, z); m.rotation.y = ry; g.add(m); }
  const dado = box(W_, 1.0, 0.04, mat('plaster', 0x5a8a7a, { bump: 0.8 }), 1); dado.position.set(0, 0.5, -D / 2 + 0.12); g.add(dado);
  const ceil = box(W_, 0.12, D, mat('plaster', 0xf0e8d8), 2); ceil.position.y = H + 0.06; g.add(ceil);
  // window with Himalayan view
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.3), new THREE.MeshBasicMaterial({ map: canvasT(320, 260, (c, w, h) => { const gg = c.createLinearGradient(0, 0, 0, h); gg.addColorStop(0, '#5a9ae0'); gg.addColorStop(1, '#e8f0f8'); c.fillStyle = gg; c.fillRect(0, 0, w, h); c.fillStyle = '#c8d4e4'; c.beginPath(); c.moveTo(0, h * 0.75); c.lineTo(w * 0.3, h * 0.45); c.lineTo(w * 0.45, h * 0.6); c.lineTo(w * 0.7, h * 0.35); c.lineTo(w, h * 0.65); c.lineTo(w, h); c.lineTo(0, h); c.fill(); c.fillStyle = '#b07a5a'; for (let i = 0; i < 12; i++) c.fillRect(i * 28, h * 0.78 + (i % 3) * 8, 24, h); c.fillStyle = '#8a5a40'; for (let i = 0; i < 12; i++) c.fillRect(i * 28 + 4, h * 0.82 + (i % 3) * 8, 6, 8); }) }));
  win.position.set(-W_ / 2 + 0.11, 1.75, -0.6); win.rotation.y = Math.PI / 2; win.userData.noOutline = true; g.add(win); const fr = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.45, 1.75), mat('wood', 0x6a4a2a)); fr.position.set(-W_ / 2 + 0.08, 1.75, -0.6); g.add(fr); win.position.x += 0.03;
  for (const y of [1.75]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 1.6), mat('wood', 0x6a4a2a)); b.position.set(-W_ / 2 + 0.16, y, -0.6); g.add(b); } { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.05), mat('wood', 0x6a4a2a)); b.position.set(-W_ / 2 + 0.16, 1.75, -0.6); g.add(b); }
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.3), new THREE.MeshStandardMaterial({ map: posterTex(), roughness: 0.6 })); poster.position.set(1.2, 1.75, -D / 2 + 0.11); poster.userData.noOutline = true; g.add(poster);
  const desk = box(2.2, 0.08, 0.95, mat('planks', 0x7a4a2a), 1); desk.position.set(0, 0.78, -0.9); g.add(desk); const front = box(2.2, 0.72, 0.06, mat('wood', 0x6a3e22), 1); front.position.set(0, 0.38, -0.45); g.add(front);
  for (const x of [-1.05, 1.05]) { const l = box(0.08, 0.74, 0.9, mat('wood', 0x6a3e22), 1); l.position.set(x, 0.37, -0.9); g.add(l); }
  // paper stacks, stamp, phone, files
  for (const [x, z, n] of [[-0.8, -1.1, 14], [-0.55, -1.15, 9], [0.8, -1.15, 20]]) for (let i = 0; i < n; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.008, 0.22), std(i % 4 ? 0xf4f0e4 : 0xe8d8b0)); p.position.set(x + (h2(i, x, 1) - 0.5) * 0.02, 0.82 + i * 0.008, z); p.rotation.y = (h2(i, z, 2) - 0.5) * 0.12; g.add(p); }
  const permit = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.28), new THREE.MeshStandardMaterial({ map: permitTex(), roughness: 0.7 })); permit.rotation.x = -Math.PI / 2; permit.rotation.z = 0.08; permit.position.set(0.15, 0.825, -0.75); permit.userData.noOutline = true; g.add(permit); g.userData.permit = permit;
  const stamp = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.1, 12), mat('wood', 0x5a3a1a)); sh.position.y = 0.09; stamp.add(sh); const sb = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 16), std(0x2a2a2a)); sb.position.y = 0.02; stamp.add(sb); stamp.position.set(0.5, 0.82, -0.85); g.add(stamp); g.userData.stamp = stamp;
  const phone = box(0.22, 0.08, 0.18, std(0x1a1a1a, { roughness: 0.4 }), 1); phone.position.set(-0.3, 0.86, -1.2); g.add(phone);
  const lamp = new THREE.Group(); const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.03, 16), std(0x2a5a3a, { metalness: 0.5, roughness: 0.4 })); lamp.add(lb); const la = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), std(0x2a5a3a, { metalness: 0.5 })); la.position.y = 0.2; lamp.add(la); const ls = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.16, 20, 1, true), std(0x2a6a4a, { side: THREE.DoubleSide, metalness: 0.4, roughness: 0.4 })); ls.position.set(0, 0.42, 0.03); ls.rotation.x = 0.35; lamp.add(ls); lamp.position.set(-0.85, 0.82, -1.25); g.add(lamp);
  const ll = new THREE.PointLight(0xffd8a0, 3, 4, 1.5); ll.position.set(-0.85, 1.1, -1.1); g.add(ll);
  // cabinets with files
  for (let i = 0; i < 3; i++) { const cab = box(0.55, 1.5, 0.45, mat('iron', 0x6a7a6a, { bump: 0.5, metalness: 0.4, roughness: 0.5 }), 1); cab.position.set(2.3, 0.75, -2.15 + i * 0.6 * 0); cab.position.x = 2.55 - i * 0.6; g.add(cab); for (let k = 0; k < 3; k++) { const hdl = box(0.12, 0.02, 0.03, std(0xc8c8c8, { metalness: 0.8 }), 1); hdl.position.set(cab.position.x, 0.3 + k * 0.48, -2.15 + 0.24); g.add(hdl); } }
  for (let i = 0; i < 10; i++) { const f = box(0.06, 0.32, 0.25, std([0xd8402a, 0x2a5ad8, 0xe8c040, 0x3a8a4a][i % 4]), 1); f.position.set(2.27 - i * 0.065, 1.66, -2.15); g.add(f); }
  // ceiling fan
  const fan = new THREE.Group(); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.12, 16), std(0x8a6a4a, { metalness: 0.4 })); fan.add(hub); for (let i = 0; i < 4; i++) { const b = box(0.7, 0.012, 0.14, mat('wood', 0x6a4a2a), 1); b.position.x = 0.4; const p = new THREE.Group(); p.add(b); p.rotation.y = i * Math.PI / 2; fan.add(p); } fan.position.set(0, H - 0.35, -0.2); g.add(fan); g.userData.fan = fan; const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8), std(0x8a6a4a)); rod.position.set(0, H - 0.18, -0.2); g.add(rod);
  // chair for visitor
  const ch = new THREE.Group(); const seat = box(0.45, 0.05, 0.45, mat('wood', 0x7a4a2a), 1); seat.position.y = 0.46; ch.add(seat); for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) { const l = box(0.04, 0.46, 0.04, mat('wood', 0x6a3e22), 1); l.position.set(x, 0.23, z); ch.add(l); } const bk = box(0.45, 0.5, 0.04, mat('wood', 0x7a4a2a), 1); bk.position.set(0, 0.72, 0.21); ch.add(bk); ch.position.set(0.9, 0, 0.3); g.add(ch);
  // Nepal-style double pennant flag on a desk stand (two stacked red pennants, blue border)
  const ft = canvasT(160, 200, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#1a3a8a'; c.beginPath(); c.moveTo(4, 4); c.lineTo(150, 92); c.lineTo(60, 92); c.lineTo(150, 196); c.lineTo(4, 196); c.closePath(); c.fill(); c.fillStyle = '#c8202a'; c.beginPath(); c.moveTo(14, 20); c.lineTo(126, 86); c.lineTo(44, 86); c.lineTo(44, 100); c.lineTo(128, 188); c.lineTo(14, 188); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(40, 62, 12, 0, Math.PI); c.fill(); c.beginPath(); c.arc(42, 145, 15, 0, 7); c.fill(); });
  const fg = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2), new THREE.MeshBasicMaterial({ map: ft, transparent: true, side: THREE.DoubleSide, alphaTest: 0.1 })); fg.position.set(0.95, 1.08, -1.25); fg.userData.noOutline = true; g.add(fg); const fp = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.3, 6), std(0xc8a050, { metalness: 0.8 })); fp.position.set(0.87, 0.97, -1.25); g.add(fp);
  return shadowAll(g); }

// sea of clouds far below (canvas fbm texture on a huge plane)
let _ct; function cloudTex() { if (_ct) return _ct; const S = 512; const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'); const im = c.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const u = x / S * 6, v = y / S * 6; const n = (fbm(u, v, 21, 6) + fbm(u + 6, v, 21, 6) * 0 ) ; const tile = fbm((u % 6), (v % 6), 21, 6); const a = sm(0.38, 0.62, tile); const i = (y * S + x) * 4; const b = 225 + tile * 30; im.data[i] = b; im.data[i + 1] = b + 2; im.data[i + 2] = b + 8; im.data[i + 3] = a * 255; }
  c.putImageData(im, 0, 0); _ct = new THREE.CanvasTexture(cv); _ct.wrapS = _ct.wrapT = THREE.RepeatWrapping; _ct.colorSpace = THREE.SRGBColorSpace; return _ct; }
export function cloudSea(y, size = 30000, o = {}) { const g = new THREE.Group(); const t = cloudTex();
  for (let k = 0; k < (o.layers ?? 3); k++) { const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(size / (o.tile ?? 2400) * (1 + k * 0.37), size / (o.tile ?? 2400) * (1 + k * 0.37)); tt.offset.set(k * 0.31, k * 0.17);
    const m = new THREE.MeshLambertMaterial({ map: tt, transparent: true, depthWrite: false, color: o.color ?? 0xffffff, emissive: o.emissive ?? 0x30343c, opacity: o.opacity ?? 0.95 }); m.fog = o.fog ?? true;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m); p.rotation.x = -Math.PI / 2; p.position.y = y + k * (o.gap ?? 40); p.userData.noOutline = true; p.renderOrder = 1; g.add(p); }
  g.userData.update = (lt) => g.children.forEach((p, k) => { p.material.map.offset.x = k * 0.31 + lt * 0.0016 * (k + 1); }); return g; }
