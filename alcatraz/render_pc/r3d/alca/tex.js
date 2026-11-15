// Procedural PBR-ish textures (color + height/bump + roughness) for medieval London.
// Everything is tileable and generated once per page load.
import * as THREE from 'three';

function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
// tileable value noise with period P (integer grid cells across the texture)
function vnoise(seed) {
  const r = rng(seed), T = new Float32Array(256 * 256); for (let i = 0; i < T.length; i++) T[i] = r();
  return (x, y, P) => { // x,y in [0,1)
    const fx = x * P, fy = y * P, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const g = (a, b) => T[((a % P + P) % P) + 256 * ((b % P + P) % P)];
    const a = g(ix, iy), b = g(ix + 1, iy), c = g(ix, iy + 1), d = g(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
function fbm(n, x, y, P, oct = 5) { let s = 0, a = 0.5, t = 0; for (let o = 0; o < oct; o++) { s += a * n(x, y, P << o); t += a; a *= 0.5; } return s / t; }
// tileable worley: returns [F1, F2, cellId]
function worley(seed, P) {
  const r = rng(seed), pts = []; for (let j = 0; j < P; j++) for (let i = 0; i < P; i++) pts.push([(i + 0.15 + r() * 0.7) / P, (j + 0.15 + r() * 0.7) / P, r()]);
  return (x, y) => {
    const ci = Math.floor(x * P), cj = Math.floor(y * P); let f1 = 9, f2 = 9, id = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const i = ci + di, j = cj + dj, ii = (i % P + P) % P, jj = (j % P + P) % P, p = pts[ii + jj * P];
      const px = p[0] + (i - ii) / P, py = p[1] + (j - jj) / P; const d = Math.hypot(px - x, py - y) * P;
      if (d < f1) { f2 = f1; f1 = d; id = p[2]; } else if (d < f2) f2 = d;
    }
    return [f1, f2, id];
  };
}

function gen(N, fn) {
  const cc = document.createElement('canvas'); cc.width = cc.height = N; const hc = document.createElement('canvas'); hc.width = hc.height = N; const rc = document.createElement('canvas'); rc.width = rc.height = N;
  const C = cc.getContext('2d').createImageData(N, N), H = hc.getContext('2d').createImageData(N, N), R = rc.getContext('2d').createImageData(N, N);
  const o = { r: 0, g: 0, b: 0, h: 0, ro: 0.8 };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    o.ro = 0.85; fn(x / N, y / N, o); const k = (x + y * N) * 4;
    C.data[k] = o.r; C.data[k + 1] = o.g; C.data[k + 2] = o.b; C.data[k + 3] = 255;
    const h = Math.max(0, Math.min(255, o.h * 255)); H.data[k] = H.data[k + 1] = H.data[k + 2] = h; H.data[k + 3] = 255;
    const ro = Math.max(0, Math.min(255, o.ro * 255)); R.data[k] = R.data[k + 1] = R.data[k + 2] = ro; R.data[k + 3] = 255;
  }
  cc.getContext('2d').putImageData(C, 0, 0); hc.getContext('2d').putImageData(H, 0, 0); rc.getContext('2d').putImageData(R, 0, 0);
  const mk = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 2; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: mk(cc, true), bump: mk(hc), rough: mk(rc), canvas: cc };
}
const cl = v => Math.max(0, Math.min(1, v));
const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
function put(o, c, h, ro) { o.r = c[0]; o.g = c[1]; o.b = c[2]; o.h = h; if (ro !== undefined) o.ro = ro; }

export const T = {};
const N1 = vnoise(11), N2 = vnoise(23), N3 = vnoise(37);
const W2 = worley(31, 20);

// dark oak timber with grain, checks (cracks) and knots
T.wood = gen(512, (u, v, o) => {
  const warp = fbm(N1, u, v, 4, 4) * 3.0;
  const grain = 0.5 + 0.5 * Math.sin((u * 46 + warp * 6 + fbm(N2, u, v, 8, 3) * 2) * Math.PI);
  const fine = fbm(N3, u * 1, v, 32, 3);
  const crack = Math.abs(Math.sin(u * 9.0 * Math.PI + warp * 3)) < 0.025 && fbm(N2, u, v, 8, 2) > 0.5 ? 1 : 0;
  let c = mixc([62, 40, 24], [104, 70, 42], grain * 0.6 + fine * 0.4); c = mixc(c, [28, 18, 10], crack * 0.9);
  put(o, c, 0.45 + grain * 0.25 + fine * 0.25 - crack * 0.45, 0.8 + fine * 0.15);
});
// lighter worn planks (floors, stalls, doors)
T.planks = gen(512, (u, v, o) => {
  const row = Math.floor(v * 6), off = (row * 0.37) % 1, pv = (v * 6) % 1, pu = ((u + off) * 2) % 1;
  const seam = Math.min(pv, 1 - pv) < 0.03 || Math.min(pu, 1 - pu) < 0.006 ? 1 : 0;
  const warp = fbm(N1, u, v + row * 0.13, 4, 3);
  const grain = 0.5 + 0.5 * Math.sin((pv * 14 + warp * 8 + u * 3) * Math.PI);
  const tone = 0.75 + 0.25 * N2(0.1 * row, 0.3, 8);
  const dirt = fbm(N3, u, v, 6, 4);
  let c = mixc([120, 84, 50], [168, 122, 78], grain * 0.5 + 0.2); c = c.map(x => x * tone * (0.8 + dirt * 0.35)); c = mixc(c, [30, 20, 12], seam * 0.85);
  put(o, c, 0.55 + grain * 0.15 + dirt * 0.2 - seam * 0.55, 0.75 + dirt * 0.2);
});
// wattle & daub plaster: lumpy, stained near bottom, hairline cracks
const Wp = worley(5, 6);
T.plaster = gen(512, (u, v, o) => {
  const lump = fbm(N1, u, v, 8, 6), spot = fbm(N2, u, v, 16, 4);
  const [f1, f2] = Wp(u, v); const crack = (f2 - f1) < 0.018 && fbm(N3, u, v, 4, 2) > 0.6 ? 1 : 0;
  const stain = cl((v - 0.55) * 2.0) * (0.5 + fbm(N3, u, v, 8, 3) * 0.6);
  let c = mixc([224, 208, 176], [246, 236, 212], lump); c = mixc(c, [168, 140, 100], stain * 0.55); c = c.map(x => x * (0.9 + spot * 0.18)); c = mixc(c, [120, 100, 76], crack * 0.45);
  put(o, c, 0.4 + lump * 0.45 + spot * 0.15 - crack * 0.35, 0.9);
});
// ashlar stone blocks (bridge, walls, gate)
T.stone = gen(512, (u, v, o) => {
  const rows = 8, row = Math.floor(v * rows), pv = (v * rows) % 1; const n = 3 + (row % 2); const off = ((row * 0.618) % 1);
  const pu = ((u + off) * n) % 1, bid = Math.floor((u + off) * n) + row * 7;
  const m = Math.min(pv, 1 - pv) < 0.06 || Math.min(pu, 1 - pu) < 0.03 ? 1 : 0;
  const tone = 0.8 + 0.3 * ((Math.sin(bid * 12.9898) * 43758.5453) % 1 + 1) % 1 * 0.6;
  const rough = fbm(N1, u, v, 16, 5), moss = cl((fbm(N2, u, v, 4, 4) - 0.55) * 4) * cl((v - 0.4) * 2);
  let c = [150 * tone, 142 * tone, 128 * tone]; c = c.map(x => x * (0.78 + rough * 0.35)); c = mixc(c, [80, 96, 52], moss * 0.6); c = mixc(c, [70, 64, 56], m * 0.85);
  const edge = Math.min(Math.min(pv, 1 - pv) * 6, Math.min(pu, 1 - pu) * 10, 1);
  put(o, c, (1 - m) * (0.55 + 0.25 * edge) + rough * 0.25, 0.92);
});
// clay roof tiles (rows stacked along u = down the slope)
T.tiles = gen(512, (u, v, o) => {
  const rows = 10, row = Math.floor(u * rows), pr = (u * rows) % 1; const off = row % 2 ? 0.5 : 0; const cols = 7;
  const pc = ((v * cols + off) % 1), id = Math.floor(v * cols + off) + row * 13;
  const r = ((Math.sin(id * 78.233) * 43758.5453) % 1 + 1) % 1;
  const gap = Math.min(pc, 1 - pc) < 0.05 ? 1 : 0; const lip = pr > 0.86 ? 1 : 0;
  const grit = fbm(N1, u, v, 32, 3), lich = cl((fbm(N3, u, v, 6, 4) - 0.6) * 5);
  let c = mixc([150, 66, 40], [196, 104, 62], r); c = c.map(x => x * (0.8 + grit * 0.3)); c = mixc(c, [190, 180, 120], lich * 0.5); c = mixc(c, [50, 26, 18], Math.max(gap, lip) * 0.8);
  put(o, c, 0.2 + pr * 0.6 - gap * 0.3 - lip * 0.2 + grit * 0.15, 0.85);
});
// straw thatch (streaks along u = down the slope)
T.thatch = gen(512, (u, v, o) => {
  const s = fbm(N1, u * 0.02, v, 64, 3), s2 = fbm(N2, u, v, 8, 4); const layer = (u * 7) % 1;
  let c = mixc([150, 118, 60], [222, 186, 110], s * 0.7 + s2 * 0.3); c = c.map(x => x * (0.75 + layer * 0.3));
  put(o, c, s * 0.6 + layer * 0.3 + s2 * 0.1, 0.95);
});
// straw (mattress / floor scatter) drawn with strokes
T.straw = (() => {
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'); const r = rng(77);
  g.fillStyle = '#9a7a3e'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 2600; i++) { const x = r() * N, y = r() * N, a = r() * Math.PI, l = 20 + r() * 50; const k = 140 + r() * 100; g.strokeStyle = `rgb(${k},${k * 0.82},${k * 0.45})`; g.lineWidth = 1.5 + r() * 2; for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) { g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l); g.stroke(); } }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2;
  const b = new THREE.CanvasTexture(cv); b.wrapS = b.wrapT = THREE.RepeatWrapping; return { map: t, bump: b };
})();
// cobbles + mud mix, with height for real displacement
const Wc = worley(9, 14);
T.cobble = gen(1024, (u, v, o) => {
  const [f1, f2, id] = Wc(u, v); const e = f2 - f1; const stone = cl((e - 0.06) * 6);
  const dome = cl(1 - f1 * 1.15); const grit = fbm(N1, u, v, 64, 3);
  const mud = cl((fbm(N2, u, v, 6, 5) - 0.47) * 4.5); const wet = cl((fbm(N3, u, v, 5, 4) - 0.58) * 6);
  let c = mixc([106, 98, 86], [160, 150, 132], id); c = c.map(x => x * (0.75 + dome * 0.25 + grit * 0.2));
  const mudc = mixc([74, 56, 36], [104, 80, 52], fbm(N1, u, v, 16, 3));
  c = mixc(mixc([58, 46, 32], c, stone), mudc, mud * 0.92); c = c.map(x => x * (1 - wet * 0.35));
  const h = (stone * (0.45 + dome * 0.45) + grit * 0.1) * (1 - mud * 0.75) + mud * 0.3 - wet * 0.12;
  put(o, c, h, cl(0.85 - wet * 0.75 - stone * 0.1));
});
// plain churned mud with ruts/footprints
T.mud = gen(512, (u, v, o) => {
  const a = fbm(N1, u, v, 8, 6), b = fbm(N2, u, v, 32, 3); const rut = Math.abs(Math.sin(u * Math.PI * 4 + a * 2)) < 0.08 ? 1 : 0; const wet = cl((fbm(N3, u, v, 4, 4) - 0.56) * 5);
  let c = mixc([70, 52, 32], [118, 92, 60], a * 0.7 + b * 0.3); c = c.map(x => x * (1 - wet * 0.4 - rut * 0.25));
  put(o, c, a * 0.6 + b * 0.3 - rut * 0.3 - wet * 0.2, cl(0.9 - wet * 0.8));
});
// rough iron
T.iron = gen(256, (u, v, o) => { const a = fbm(N1, u, v, 16, 5), rust = cl((fbm(N2, u, v, 8, 4) - 0.5) * 4); let c = mixc([46, 44, 44], [110, 60, 34], rust * 0.7); c = c.map(x => x * (0.8 + a * 0.4)); put(o, c, a, 0.6 + rust * 0.3); });
// coarse cloth (tunics on props, awnings, shrouds)
T.cloth = gen(256, (u, v, o) => { const w = 0.5 + 0.25 * Math.sin(u * 256 * Math.PI) + 0.25 * Math.sin(v * 256 * Math.PI); const a = fbm(N1, u, v, 16, 4); const c = [200 + a * 40, 196 + a * 38, 184 + a * 30]; put(o, c.map(x => x * (0.85 + w * 0.15)), w * 0.5 + a * 0.5, 0.95); });
// earth (grave cross-section, fields)
T.earth = gen(512, (u, v, o) => { const a = fbm(N1, u, v, 8, 6), b = fbm(N3, u, v, 32, 3); const pebble = Worley2(u, v); let c = mixc([78, 58, 40], [124, 96, 66], a); c = mixc(c, [140, 130, 116], pebble * 0.8); put(o, c.map(x => x * (0.85 + b * 0.25)), a * 0.5 + b * 0.2 + pebble * 0.4, 0.95); });
function Worley2(u, v) { const [f1] = W2(u, v); return cl((0.22 - f1) * 8); }


// ================= ROMAN / POMPEII =================
const Wb = worley(41, 9), Wi = worley(43, 12), Wp2 = worley(47, 40), Wm = worley(53, 64);
const h1 = (k) => ((Math.sin(k * 127.1) * 43758.5453) % 1 + 1) % 1;
// big polygonal basalt paving (Pompeii streets): dark blue-grey, polished tops, deep joints
T.basalt = gen(1024, (u, v, o) => {
  const [f1, f2, id] = Wb(u, v); const e = f2 - f1; const joint = cl((e - 0.03) * 9);
  const dome = cl(1 - f1 * 0.9); const grit = fbm(N1, u, v, 64, 3), pit = cl((fbm(N3, u, v, 48, 2) - 0.62) * 6);
  const dust = cl((fbm(N2, u, v, 6, 4) - 0.5) * 3);
  let c = mixc([62, 64, 68], [96, 98, 102], id * 0.7 + grit * 0.3); c = c.map(x => x * (0.8 + dome * 0.3)); c = mixc(c, [150, 130, 100], dust * 0.35);
  c = mixc([40, 34, 28], c, joint); c = c.map(x => x * (1 - pit * 0.3));
  put(o, c, joint * (0.5 + dome * 0.4) + grit * 0.08 - pit * 0.1, cl(0.55 - dome * 0.25 + (1 - joint) * 0.4 + dust * 0.2));
});
// cocciopesto sidewalk (crushed terracotta in mortar)
T.coccio = gen(512, (u, v, o) => {
  const a = fbm(N1, u, v, 16, 4), b = fbm(N2, u, v, 64, 2); const [f1] = Wp2(u, v); const chip = cl((0.18 - f1) * 6);
  let c = mixc([168, 104, 80], [196, 136, 108], a); c = mixc(c, [120, 60, 44], chip * 0.6); c = mixc(c, [214, 200, 176], cl((b - 0.6) * 4) * 0.5);
  put(o, c, a * 0.4 + chip * 0.4 + b * 0.2, 0.9);
});
// street-facing plaster: ochre/white with red socle, weathered, patched
T.rwall = gen(1024, (u, v, o) => {
  const lump = fbm(N1, u, v, 8, 5), spot = fbm(N2, u, v, 32, 3), wear = cl((fbm(N3, u, v, 6, 5) - 0.58) * 4);
  const base = v > 0.72; const line = Math.abs(v - 0.72) < 0.006;
  let c = base ? mixc([150, 52, 40], [178, 70, 52], lump) : mixc([226, 196, 140], [240, 218, 170], lump);
  c = c.map(x => x * (0.88 + spot * 0.2)); c = mixc(c, [232, 226, 210], line ? 0.9 : 0);
  // wear exposes the opus incertum stonework underneath
  const [f1, f2, id] = Wi(u, v); const stone = mixc([150, 140, 120], [190, 176, 150], id); const mort = (f2 - f1) < 0.08;
  const under = mort ? [210, 200, 180] : stone; c = mixc(c, under, wear);
  const grime = cl((v - 0.85) * 5) * 0.5; c = mixc(c, [90, 70, 50], grime);
  put(o, c, 0.45 + lump * 0.3 + spot * 0.1 + wear * (mort ? -0.25 : 0.2), 0.88);
});
// interior fresco (Pompeian red / yellow panels, black dado and frieze); one tile = one wall height
T.fresco = gen(1024, (u, v, o) => {
  const lump = fbm(N1, u, v, 8, 4), spot = fbm(N2, u, v, 32, 3), fade = fbm(N3, u, v, 4, 4);
  let c;
  if (v > 0.74) { // dado: black with painted marble veins
    const vein = Math.abs(Math.sin((u * 6 + fbm(N1, u, v, 8, 4) * 3) * Math.PI)) < 0.04; c = vein ? [140, 120, 90] : [34, 28, 26];
  } else if (v < 0.13) { // frieze: white with red/green garland band
    c = [232, 222, 200]; const b = Math.abs(v - 0.07) < 0.02; if (b) c = (Math.floor(u * 24) % 2) ? [60, 110, 70] : [170, 50, 40];
  } else { // panels
    const pu = (u * 3) % 1, idx = Math.floor(u * 3); const border = pu < 0.04 || pu > 0.96; const inner = Math.abs(pu - 0.5) > 0.36 || v < 0.18 || v > 0.69;
    c = idx % 2 ? [176, 44, 34] : [214, 162, 58]; if (border) c = [26, 22, 20];
    if (!border && inner && Math.abs(pu - 0.5) < 0.4 && (Math.abs(Math.abs(pu - 0.5) - 0.36) < 0.006 || Math.abs(v - 0.18) < 0.004 || Math.abs(v - 0.69) < 0.004)) c = [240, 230, 200];
    // small vignette figure in the middle of panels
    const fx = (pu - 0.5) * 3, fy = (v - 0.42) * 6; if (!border && fx * fx + fy * fy < 0.12) c = idx % 2 ? [230, 200, 150] : [130, 60, 40];
  }
  c = c.map(x => x * (0.85 + lump * 0.2 + spot * 0.08)); c = mixc(c, [210, 190, 160], cl((fade - 0.62) * 3) * 0.5);
  put(o, c, 0.5 + lump * 0.3 + spot * 0.2, 0.7 + spot * 0.2);
});
{ const c = T.fresco.canvas.getContext('2d'), N = 1024; let r = 3; const pr = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 3; i++) { const x0 = i * N / 3, cx = x0 + N / 6, cy = 0.43 * N;
    // candelabrum between panels
    const lx = x0; c.strokeStyle = '#e8d8a8'; c.lineWidth = 4; c.beginPath(); c.moveTo(lx, 0.16 * N); c.lineTo(lx, 0.72 * N); c.stroke(); for (let k = 0; k < 6; k++) { const y = 0.2 * N + k * 0.085 * N; c.fillStyle = k % 2 ? '#3a7a5a' : '#e8c060'; c.beginPath(); c.ellipse(lx, y, 12, 5, 0, 0, 7); c.fill(); }
    // vignette: floating figure in a thin frame
    c.save(); c.translate(cx, cy); c.strokeStyle = 'rgba(240,230,200,.8)'; c.lineWidth = 3; c.strokeRect(-70, -80, 140, 160);
    const k = i % 3; c.lineCap = 'round';
    if (k === 0) { c.fillStyle = '#f0e2c0'; c.beginPath(); c.ellipse(0, -30, 13, 15, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-14, -14); c.quadraticCurveTo(-30, 40, -10, 60); c.lineTo(14, 60); c.quadraticCurveTo(28, 30, 14, -14); c.fill(); c.fillStyle = '#7a3a2a'; c.beginPath(); c.moveTo(-18, 0); c.quadraticCurveTo(-60, -20, -50, 30); c.quadraticCurveTo(-30, 10, -16, 20); c.fill(); c.beginPath(); c.moveTo(18, 0); c.quadraticCurveTo(60, -20, 50, 30); c.quadraticCurveTo(30, 10, 16, 20); c.fill(); }
    else if (k === 1) { c.fillStyle = '#2a1e18'; c.beginPath(); c.moveTo(-26, 50); c.quadraticCurveTo(-34, 0, -12, -20); c.lineTo(-8, -40); c.lineTo(8, -40); c.lineTo(12, -20); c.quadraticCurveTo(34, 0, 26, 50); c.closePath(); c.fill(); c.strokeStyle = '#c89040'; c.lineWidth = 3; c.beginPath(); c.moveTo(-22, 10); c.lineTo(22, 10); c.stroke(); c.fillStyle = '#5a8a40'; for (let q = 0; q < 7; q++) { c.beginPath(); c.ellipse(-30 + q * 10, -46 - Math.sin(q) * 8, 9, 4, q, 0, 7); c.fill(); } }
    else { c.fillStyle = '#3a5a3a'; c.beginPath(); c.ellipse(0, 0, 30, 18, 0, 0, 7); c.fill(); c.fillStyle = '#e8d8b0'; c.beginPath(); c.ellipse(26, -10, 10, 8, 0, 0, 7); c.fill(); c.strokeStyle = '#3a5a3a'; c.lineWidth = 4; c.beginPath(); c.moveTo(-28, 0); c.lineTo(-52, -14); c.moveTo(-28, 4); c.lineTo(-52, 12); c.stroke(); c.fillStyle = '#c83a2a'; c.beginPath(); c.moveTo(34, -10); c.lineTo(44, -6); c.lineTo(34, -4); c.fill(); }
    c.restore();
    // garland swag in the frieze
    c.strokeStyle = '#3a7a3a'; c.lineWidth = 9; c.beginPath(); c.moveTo(x0 + 10, 0.03 * N); c.quadraticCurveTo(cx, 0.15 * N, x0 + N / 3 - 10, 0.03 * N); c.stroke(); c.fillStyle = '#c83a3a'; for (let q = 0; q < 6; q++) { const t = (q + 0.5) / 6, x = x0 + 10 + t * (N / 3 - 20), y = 0.03 * N + 4 * t * (1 - t) * 0.12 * N * 0.9; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); }
  }
  // egg-and-dart band above the dado
  for (let x = 0; x < N; x += 18) { c.fillStyle = '#e8d8b0'; c.beginPath(); c.ellipse(x + 9, 0.735 * N, 6, 8, 0, 0, 7); c.fill(); c.fillStyle = '#2a1e18'; c.fillRect(x, 0.725 * N, 2, 20); }
  for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(80,60,40,${0.04 + pr() * 0.08})`; c.beginPath(); c.ellipse(pr() * N, pr() * N, 4 + pr() * 30, 3 + pr() * 18, pr() * 3, 0, 7); c.fill(); }
  T.fresco.map.needsUpdate = true; }
// opus reticulatum: diagonal net of square tuff blocks
T.reticulatum = gen(512, (u, v, o) => {
  const a = (u + v) * 10, b = (u - v) * 10; const fa = a - Math.floor(a), fb = b - Math.floor(b); const id = h1(Math.floor(a) * 17 + Math.floor(b) * 131);
  const m = Math.min(fa, 1 - fa, fb, 1 - fb) < 0.07; const g = fbm(N1, u, v, 32, 3);
  let c = mixc([170, 156, 130], [204, 190, 160], id); c = c.map(x => x * (0.85 + g * 0.25)); if (m) c = [120, 112, 100];
  put(o, c, m ? 0.15 : 0.55 + g * 0.3, 0.92);
});
// thin roman brick (columns, arches)
T.brick = gen(512, (u, v, o) => {
  const rows = 16, row = Math.floor(v * rows), pv = (v * rows) % 1, off = row % 2 ? 0.5 : 0, pu = ((u * 3 + off) % 1); const id = h1(row * 7 + Math.floor(u * 3 + off) * 3);
  const m = pv < 0.18 || pu < 0.02; const g = fbm(N1, u, v, 32, 3);
  let c = mixc([168, 84, 56], [196, 116, 80], id); c = c.map(x => x * (0.85 + g * 0.25)); if (m) c = [200, 190, 172];
  put(o, c, m ? 0.2 : 0.6 + g * 0.3, 0.9);
});
// white marble with grey veins (forum, temple)
T.marble = gen(512, (u, v, o) => {
  const w = fbm(N1, u, v, 4, 5) * 4; const vein = Math.pow(1 - Math.abs(Math.sin((u * 3 + v * 2 + w) * Math.PI)), 18); const g = fbm(N2, u, v, 32, 3);
  let c = mixc([232, 228, 218], [246, 244, 238], g); c = mixc(c, [150, 148, 146], vein * 0.6);
  put(o, c, 0.5 + g * 0.2 - vein * 0.1, 0.35 + g * 0.2);
});
// travertine / limestone paving slabs (forum)
T.travertine = gen(512, (u, v, o) => {
  const rows = 4, row = Math.floor(v * rows), pv = (v * rows) % 1, off = h1(row) * 0.5, pu = ((u * 2 + off) % 1); const id = h1(row * 11 + Math.floor(u * 2 + off));
  const m = pv < 0.015 || pv > 0.985 || pu < 0.008 || pu > 0.992; const g = fbm(N1, u, v, 32, 3), hole = cl((fbm(N3, u * 3, v, 32, 2) - 0.66) * 8);
  let c = mixc([206, 196, 172], [228, 220, 198], id); c = c.map(x => x * (0.9 + g * 0.15)); c = mixc(c, [150, 136, 110], hole * 0.6); if (m) c = [120, 110, 94];
  put(o, c, m ? 0.1 : 0.6 + g * 0.2 - hole * 0.3, 0.75);
});
// black & white tesserae mosaic floor with a meander border
T.mosaic = gen(1024, (u, v, o) => {
  const n = 160; const tx = Math.floor(u * n), ty = Math.floor(v * n), fu = u * n - tx, fv = v * n - ty; const gap = fu < 0.12 || fv < 0.12;
  const bu = Math.min(tx, n - 1 - tx), bv = Math.min(ty, n - 1 - ty), b = Math.min(bu, bv);
  let dark = false; if (b < 16) { const k = b; const along = bu < bv ? ty : tx; dark = (k === 3 || k === 12) || (k > 3 && k < 12 && ((Math.floor(along / 8) + (k > 7 ? 1 : 0)) % 2 === 0) && (along % 8 < 2 || k === 4 || k === 11)); }
  else dark = ((tx + ty) % 23 === 0) || ((tx - ty + 400) % 23 === 0);
  const t = h1(tx * 31 + ty * 7);
  let c = dark ? [36, 34, 34] : [222, 216, 200]; c = c.map(x => x * (0.9 + t * 0.15)); if (gap) c = [120, 112, 100];
  put(o, c, gap ? 0.2 : 0.6 + t * 0.1, gap ? 0.9 : 0.5);
});
// fallen pumice (lapilli): light grey porous pebbles
T.pumice = gen(1024, (u, v, o) => {
  const [f1, f2, id] = Wm(u, v); const e = f2 - f1; const pebble = cl((e - 0.05) * 5); const dome = cl(1 - f1 * 1.1);
  const pore = cl((fbm(N2, u, v, 128, 2) - 0.58) * 6); const tone = id;
  let c = mixc([168, 164, 156], [222, 218, 208], tone * 0.8 + dome * 0.2); c = c.map(x => x * (1 - pore * 0.35)); c = mixc([92, 88, 82], c, pebble);
  put(o, c, pebble * (0.4 + dome * 0.5) - pore * 0.15, 0.97);
});
// fine volcanic ash with wind ripples
T.ash = gen(512, (u, v, o) => {
  const a = fbm(N1, u, v, 8, 6), b = fbm(N2, u, v, 64, 2); const rip = 0.5 + 0.5 * Math.sin((v * 22 + a * 3) * Math.PI);
  let c = mixc([120, 116, 110], [168, 162, 152], a * 0.6 + rip * 0.25 + b * 0.15);
  put(o, c, a * 0.5 + rip * 0.3 + b * 0.2, 0.98);
});
// excavated tuff/earth cross-section with layers
T.strata = gen(1024, (u, v, o) => {
  const w = fbm(N1, u, v, 3, 4) * 0.06 + fbm(N3, u, v, 12, 3) * 0.015; const L = v + w; const g = fbm(N2, u, v, 48, 3);
  // top -> bottom: soil, surge ash laminae, grey pumice, white pumice, Roman floor level
  const B = [[0.12, 'soil'], [0.22, 'ash'], [0.3, 'surge'], [0.52, 'grey'], [0.86, 'white'], [1.1, 'floor']]; let kind = 'floor'; for (const [lim, k] of B) if (L < lim) { kind = k; break; }
  let c, h = 0.4 + g * 0.3;
  if (kind === 'soil') { c = [92 + g * 30, 74 + g * 20, 52 + g * 14]; const rt = Math.abs(Math.sin(u * 90 + fbm(N1, u, v, 20, 2) * 8)) < 0.03 && v < 0.1; if (rt) c = [60, 44, 30]; }
  else if (kind === 'ash' || kind === 'surge') { const lam = 0.5 + 0.5 * Math.sin(L * (kind === 'ash' ? 420 : 260)); c = kind === 'ash' ? [150 + lam * 26, 142 + lam * 24, 128 + lam * 20] : [126 + lam * 30, 114 + lam * 26, 98 + lam * 20]; c = c.map(x => x * (0.9 + g * 0.15)); h = 0.3 + lam * 0.2; }
  else if (kind === 'floor') { const t = (Math.floor(u * 24) + Math.floor(L * 30)) % 2; c = (t ? [150, 92, 70] : [132, 80, 60]).map(x => x * (0.85 + g * 0.25)); if (Math.abs(L - 0.86) < 0.012) c = [40, 30, 24]; }
  else { const sc = kind === 'white' ? 34 : 26; const wv = W2(u * sc / 8, L * sc / 8); const d = wv[0]; const stone = d < 0.32; const base = kind === 'white' ? [218, 212, 196] : [146, 142, 136]; const mat_ = kind === 'white' ? [176, 168, 150] : [104, 100, 96];
    if (stone) { const sh = 1 - d / 0.32; c = base.map((x, i) => x * (0.72 + sh * 0.35) + (fbm(N3, u, v, 160, 2) - 0.5) * 30); h = 0.5 + sh * 0.5; } else { c = mat_.map(x => x * (0.85 + g * 0.2)); h = 0.2; } }
  put(o, c, h, 0.97);
});

// material helpers: texture repeat is baked into geometry UVs (see uvBox), so textures stay shared.
const cache = {};
export function mat(kind, color = 0xffffff, o = {}) {
  const key = kind + color + JSON.stringify(o); if (cache[key]) return cache[key];
  const { bump, ...rest } = o; const t = T[kind];
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, map: t.map, bumpMap: t.bump, bumpScale: bump ?? 2.2, roughnessMap: t.rough, roughness: 1, metalness: 0 }, rest));
  return (cache[key] = m);
}
// scale UVs of a BoxGeometry so 1 texture tile = `s` metres on every face
export function uvBox(geo, w, h, d, s = 1.5, su = 1, sv = 1) {
  const uv = geo.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / s * su, uv.getY(i) * dims[f][1] / s * sv); }
  uv.needsUpdate = true; return geo;
}
export function uvPlane(geo, w, h, s = 1.5) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / s, uv.getY(i) * h / s); uv.needsUpdate = true; return geo; }
