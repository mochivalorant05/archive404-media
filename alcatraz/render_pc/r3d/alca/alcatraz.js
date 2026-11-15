// Alcatraz 1962 — sets: the island & bay, cellhouse ("Broadway"), a B-block cell, utility corridor, barbershop, guard tower, raft & props.
import * as THREE from 'three';
import { mat, T, uvBox } from './tex.js';
import * as R from './rome.js';
import { fbm } from './everest.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o));
const box = (w, h, d, m, s = 1.5) => new THREE.Mesh(uvBox(new THREE.BoxGeometry(w, h, d), w, h, d, s), m);
const shadowAll = (g) => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const glowM = (c, op = 1) => { const m = new THREE.MeshBasicMaterial({ color: c, transparent: op < 1, opacity: op, fog: false }); return m; };
function canvasT(w, h, f) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
let _s = 11; const rnd = () => (_s = (_s * 16807) % 2147483647) / 2147483647; export function seed(v) { _s = v; }

// ---------------- skies (bay at night, blue hour, dawn fog) ----------------
Object.assign(R.SKY, {
  bayNight: { c: [0x02050e, 0x0a1428, 0x1c2a44], fog: 0x0c1626, fd: 0.0022, hemi: [0x6a86c0, 0x0a0e16, 0.55], sun: [0x9ab4ff, 1.1], cloud: 0.05 },
  bayBlue: { c: [0x0a1838, 0x23406c, 0x50668a], fog: 0x2c3e5a, fd: 0.0026, hemi: [0x8aa4d8, 0x1a2030, 0.8], sun: [0xb8c8ff, 1.4], cloud: 0.1 },
  bayDawn: { c: [0x46587a, 0x9aa2b0, 0xe6c6a6], fog: 0xb4b6ba, fd: 0.006, hemi: [0xffe6d6, 0x485058, 1.15], sun: [0xffd6ae, 1.9], cloud: 0.55 },
  bayDay: { c: [0x5a86b8, 0xa6c0d8, 0xe2e4e0], fog: 0xc6ccd2, fd: 0.004, hemi: [0xf4f6ff, 0x5a5c58, 1.35], sun: [0xfff4e4, 2.8], cloud: 0.45 },
});

// ---------------- materials ----------------
export const M = {
  concrete: () => mat('plaster', 0xd4d0c6, { bump: 2.2 }), concreteDk: () => mat('plaster', 0x9c988e, { bump: 2.5 }), wallGreen: () => mat('plaster', 0xb8c8a8, { bump: 1.6 }), wallCream: () => mat('plaster', 0xe8e0c8, { bump: 1.4 }),
  iron: () => mat('iron', 0xb8bcc4, { bump: 1 }), ironDk: () => mat('iron', 0x6a6e78, { bump: 1 }), rock: () => mat('stone', 0x8c7e6c, { bump: 4 }), floor: () => mat('plaster', 0xa8a49a, { bump: 0.8 }),
};

// ---------------- the island: sandstone rock, cellhouse, lighthouse, water tower, guard towers ----------------
export function island(o = {}) {
  const g = new THREE.Group(); const S = o.s ?? 1;
  const geo = new THREE.CylinderGeometry(1, 1.25, 1, 96, 14, false); const P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) { let x = P.getX(i), y = P.getY(i), z = P.getZ(i); const a = Math.atan2(z, x); const n = fbm(Math.cos(a) * 3 + y * 2, Math.sin(a) * 3 + y * 2, 4, 4); const r = 1 + (n - 0.5) * 0.35 + (y < 0 ? (0.5 - y) * 0.1 : 0);
    const top = y > 0.45; P.setXYZ(i, x * r * 80 * S, (y + 0.5) * 24 * S - 6 * S + (top ? (fbm(x * 4, z * 4, 2, 3) - 0.5) * 3 * S : 0), z * r * 26 * S); }
  geo.computeVertexNormals(); const rock = new THREE.Mesh(geo, mat('stone', 0x8a7c68, { bump: 5 })); rock.receiveShadow = rock.castShadow = true; rock.userData.noOutline = true; g.add(rock);
  const topY = 18 * S; const plateau = box(140 * S, 2 * S, 34 * S, M.concreteDk(), 6); plateau.position.set(0, topY - 1 * S, 0); plateau.userData.ground = true; g.add(plateau);
  // cellhouse: long 3-storey block with tall barred windows
  const ch = new THREE.Group(); const L = 92 * S, H = 14 * S, D = 26 * S; const body = box(L, H, D, M.wallCream(), 4); body.position.y = H / 2; ch.add(body);
  const roof = box(L + 1 * S, 0.8 * S, D + 1 * S, M.concreteDk(), 4); roof.position.y = H + 0.4 * S; ch.add(roof);
  const winLit = [], winM = std(0x1a1e26, { roughness: 0.4, metalness: 0.2 }), litM = glowM(0xffd890);
  for (const sd of [-1, 1]) for (let x = -L / 2 + 4 * S; x < L / 2 - 2 * S; x += 4.2 * S) { const lit = rnd() < 0.4; const w = box(2.2 * S, 7.5 * S, 0.3 * S, lit ? litM : winM, 1); w.position.set(x, 7.5 * S, sd * (D / 2 + 0.05 * S)); ch.add(w); if (lit) winLit.push(w);
    for (let k = -2; k <= 2; k++) { const b = box(0.08 * S, 7.5 * S, 0.12 * S, M.ironDk(), 1); b.position.set(x + k * 0.45 * S, 7.5 * S, sd * (D / 2 + 0.22 * S)); ch.add(b); } }
  for (let x = -L / 2 + 6 * S; x < L / 2; x += 12 * S) { const sk = box(5 * S, 1.2 * S, D * 0.7, std(0x9fb4c8, { roughness: 0.3, metalness: 0.3 }), 1); sk.position.set(x, H + 1.2 * S, 0); ch.add(sk); }
  ch.position.set(-6 * S, topY, -1 * S); g.add(ch); g.userData.cellhouse = ch; g.userData.winLit = winLit;
  // lighthouse
  const lh = new THREE.Group(); const tw = new THREE.Mesh(new THREE.CylinderGeometry(1.6 * S, 2.2 * S, 22 * S, 16), M.wallCream()); tw.position.y = 11 * S; lh.add(tw);
  const gal = new THREE.Mesh(new THREE.CylinderGeometry(2.6 * S, 2.6 * S, 0.4 * S, 20), M.ironDk()); gal.position.y = 22.2 * S; lh.add(gal);
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.4 * S, 1.4 * S, 2.6 * S, 16), glowM(0xfff2c0)); lantern.position.y = 23.7 * S; lh.add(lantern);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.8 * S, 1.6 * S, 16), M.ironDk()); cap.position.y = 25.8 * S; lh.add(cap);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(9 * S, 140 * S, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff4d0, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  beam.geometry.translate(0, -70 * S, 0); beam.geometry.rotateZ(Math.PI / 2); beam.position.y = 23.7 * S; beam.userData.noOutline = true; lh.add(beam); const beamL = new THREE.PointLight(0xfff0c8, 40, 60 * S, 1.6); beamL.position.y = 23.7 * S; lh.add(beamL);
  lh.position.set(52 * S, topY, -4 * S); g.add(lh); g.userData.beam = beam;
  // water tower (on legs) and warden's house, small buildings, guard towers
  const wt = new THREE.Group(); const tank = new THREE.Mesh(new THREE.CylinderGeometry(4 * S, 4 * S, 6 * S, 20), std(0xc8c0b0)); tank.position.y = 15 * S; wt.add(tank); const tc = new THREE.Mesh(new THREE.ConeGeometry(4.4 * S, 2 * S, 20), M.ironDk()); tc.position.y = 19 * S; wt.add(tc);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const leg = box(0.4 * S, 12 * S, 0.4 * S, M.ironDk(), 1); leg.position.set(Math.cos(a) * 3.4 * S, 6 * S, Math.sin(a) * 3.4 * S); wt.add(leg); }
  wt.position.set(48 * S, topY - 8 * S, 16 * S); g.add(wt);
  const wh = box(16 * S, 8 * S, 10 * S, M.wallCream(), 3); wh.position.set(38 * S, topY + 4 * S, 9 * S); g.add(wh);
  for (const [x, z] of [[-62, 14], [-30, -20], [20, 22]]) { const gt = guardTower(S * 0.9); gt.position.set(x * S, topY - 1 * S, z * S); g.add(gt); }
  for (let i = 0; i < 9; i++) { const b = box((5 + rnd() * 8) * S, (3 + rnd() * 5) * S, (5 + rnd() * 5) * S, M.concrete(), 3); b.position.set((-70 + i * 16) * S, topY - 10 * S + rnd() * 3 * S, (20 + rnd() * 4) * S); g.add(b); }
  shadowAll(g); rock.castShadow = false; beam.castShadow = false;
  // shoreline foam ring + wet dark rocks
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; const b = new THREE.Mesh(new THREE.IcosahedronGeometry((2 + rnd() * 4) * S, 1), mat('stone', 0x4a4038, { bump: 4 })); b.position.set(Math.cos(a) * 92 * S, -1 * S, Math.sin(a) * 31 * S); b.scale.y = 0.6; g.add(b); }
  return g;
}
export function guardTower(S = 1, o = {}) {
  const g = new THREE.Group(); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = box(0.35 * S, 10 * S, 0.35 * S, M.ironDk(), 1); l.position.set(x * 1.6 * S, 5 * S, z * 1.6 * S); l.rotation.set(z * 0.06, 0, -x * 0.06); g.add(l); }
  for (const y of [3, 6.5]) for (const r of [0, Math.PI / 2]) { const br = box(3.6 * S, 0.15 * S, 0.15 * S, M.ironDk(), 1); br.position.y = y * S; br.rotation.y = r; br.position.x = r ? 0 : 0; g.add(br); }
  const deck = box(5.4 * S, 0.3 * S, 5.4 * S, M.concreteDk(), 1); deck.position.y = 10 * S; deck.userData.ground = true; g.add(deck);
  const cab = new THREE.Group(); const lower = box(4.4 * S, 1.1 * S, 4.4 * S, M.wallCream(), 1); lower.position.y = 0.55 * S; cab.add(lower);
  for (const [x, z, r] of [[-2.15, 0, 0], [2.15, 0, 0], [0, -2.15, 1], [0, 2.15, 1]]) { const gl = box(r ? 4.3 * S : 0.06 * S, 1.5 * S, r ? 0.06 * S : 4.3 * S, std(0x8aa6c0, { roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.35 }), 1); gl.position.set(x * S, 1.85 * S, z * S); gl.userData.noOutline = true; cab.add(gl); }
  for (const [x, z] of [[-2.15, -2.15], [2.15, -2.15], [-2.15, 2.15], [2.15, 2.15]]) { const p = box(0.15 * S, 1.6 * S, 0.15 * S, M.ironDk(), 1); p.position.set(x * S, 1.9 * S, z * S); cab.add(p); }
  const rf = new THREE.Mesh(new THREE.ConeGeometry(3.6 * S, 1.2 * S, 4), M.ironDk()); rf.rotation.y = Math.PI / 4; rf.position.y = 3.3 * S; cab.add(rf);
  for (const [x, z] of [[-2.6, 0], [2.6, 0]]) { const rail = box(0.08 * S, 0.9 * S, 5.4 * S, M.ironDk(), 1); rail.position.set(x * S, 0.45 * S, z); cab.add(rail); }
  cab.position.y = 10.15 * S; g.add(cab);
  // searchlight on the roof edge
  const sl = new THREE.Group(); const can = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * S, 0.55 * S, 0.9 * S, 16), std(0x3a3e46, { metalness: 0.6, roughness: 0.4 })); can.rotation.x = Math.PI / 2; sl.add(can);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.44 * S, 20), glowM(0xfffae0)); lens.position.z = 0.46 * S; lens.userData.noOutline = true; sl.add(lens);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(6 * S, 60 * S, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: o.beamOp ?? 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  cone.geometry.translate(0, -30 * S, 0); cone.geometry.rotateX(-Math.PI / 2); cone.position.z = 0.5 * S; cone.userData.noOutline = true; sl.add(cone);
  sl.position.set(0, 12.6 * S, 2.2 * S); g.add(sl); g.userData.search = sl; g.userData.cone = cone; return shadowAll(g);
}

// ---------------- the bay: San Francisco skyline + Golden Gate in the distance ----------------
export function skyline(o = {}) {
  const g = new THREE.Group(); const S = o.s ?? 1; const n = o.n ?? 140; const night = o.night ?? true;
  const wtex = canvasT(64, 128, (c, w, h) => { c.fillStyle = night ? '#141a26' : '#a8adb4'; c.fillRect(0, 0, w, h); for (let y = 4; y < h; y += 8) for (let x = 3; x < w; x += 7) { const on = Math.random() < (night ? 0.38 : 0.0); c.fillStyle = on ? (Math.random() < 0.7 ? '#ffd890' : '#d8e8ff') : (night ? '#1e2432' : '#7a828c'); c.fillRect(x, y, 4, 5); } });
  wtex.wrapS = wtex.wrapT = THREE.RepeatWrapping; const bm = new THREE.MeshBasicMaterial({ map: wtex, fog: true });
  for (let i = 0; i < n; i++) { const w = (6 + rnd() * 16) * S, h = (8 + Math.pow(rnd(), 2.2) * 70) * S, d = (6 + rnd() * 10) * S; const geo = new THREE.BoxGeometry(w, h, d); const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / (8 * S), uv.getY(k) * h / (16 * S)); const b = new THREE.Mesh(geo, bm); const x = (rnd() - 0.5) * 900 * S; b.position.set(x, h / 2 + (Math.abs(x) > 300 * S ? 20 * S * rnd() : 0) + Math.max(0, 60 - Math.abs(x) / S * 0.1) * S * 0.4, (rnd() - 0.5) * 120 * S); b.userData.noOutline = true; g.add(b); }
  const hill = new THREE.Mesh(new THREE.SphereGeometry(500 * S, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), std(night ? 0x0a0e16 : 0x6a7466)); hill.scale.set(1.3, 0.12, 0.25); hill.position.set(0, -5 * S, 60 * S); hill.userData.noOutline = true; g.add(hill);
  return g;
}
export function goldenGate(o = {}) {
  const g = new THREE.Group(); const S = o.s ?? 1; const red = std(0xc0442a, { roughness: 0.6 }); const span = 1280 * S, th = 227 * S, deck = 67 * S;
  for (const x of [-span / 2, span / 2]) { const tw = new THREE.Group(); for (const z of [-9, 9]) { const leg = box(9 * S, th, 6 * S, red, 4); leg.position.set(0, th / 2, z * S); tw.add(leg); } for (let k = 0; k < 4; k++) { const b = box(9 * S, 8 * S, 24 * S, red, 4); b.position.y = (deck + 20 * S) + k * 42 * S; tw.add(b); } tw.position.x = x; g.add(tw);
    const lt = new THREE.Mesh(new THREE.SphereGeometry(3 * S, 8, 6), glowM(0xff3020)); lt.position.set(x, th + 4 * S, 0); lt.userData.noOutline = true; g.add(lt); }
  const dk = box(span * 1.8, 6 * S, 28 * S, red, 8); dk.position.y = deck; g.add(dk);
  for (const z of [-11, 11]) { const pts = []; for (let i = 0; i <= 60; i++) { const x = -span * 0.9 + i / 60 * span * 1.8; const k = x / (span / 2); const y = Math.abs(k) <= 1 ? deck + 8 * S + (th - deck - 8 * S) * k * k : th - (Math.abs(k) - 1) * (th - deck) * 1.2; pts.push(V(x, Math.max(deck, y), z * S)); } const c = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 1.4 * S, 6), red); g.add(c); }
  if (o.lights !== false) for (let i = 0; i < 40; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(1.6 * S, 6, 4), glowM(0xffd8a0)); l.position.set(-span * 0.9 + i / 39 * span * 1.8, deck + 5 * S, 14 * S); l.userData.noOutline = true; g.add(l); }
  g.traverse(m => { if (m.isMesh) m.userData.noOutline = true; }); return g;
}
// current arrows painted on the water (ribbons that slide toward the Golden Gate)
export function currentArrows(n = 9, o = {}) {
  const g = new THREE.Group(); const tex = canvasT(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 4; i++) { const x = i * 64 + 8; c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.moveTo(x, 18); c.lineTo(x + 34, 18); c.lineTo(x + 34, 6); c.lineTo(x + 56, 32); c.lineTo(x + 34, 58); c.lineTo(x + 34, 46); c.lineTo(x, 46); c.closePath(); c.fill(); } });
  tex.wrapS = THREE.RepeatWrapping; const arrows = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(o.len ?? 60, o.w ?? 5), new THREE.MeshBasicMaterial({ map: tex.clone(), transparent: true, opacity: 0.0, depthWrite: false, color: o.color ?? 0x9fdcff, fog: false })); m.material.map.needsUpdate = true; m.material.map.wrapS = THREE.RepeatWrapping; m.material.map.repeat.set((o.len ?? 60) / 20, 1);
    m.rotation.x = -Math.PI / 2; m.userData.noOutline = true; m.position.set((rnd() - 0.5) * (o.spread ?? 120), 0.6, (rnd() - 0.5) * (o.spreadZ ?? 120)); g.add(m); arrows.push(m); }
  g.userData.update = (t, a = 1) => arrows.forEach((m, i) => { m.material.map.offset.x = -t * 0.6 - i * 0.13; m.material.opacity = 0.55 * a; }); g.rotation.y = o.rot ?? 0; return g;
}

// ---------------- cell (B-block, 5 x 9 ft = 1.52 x 2.74 m, 7 ft high) ----------------
export const CW = 1.52, CD = 2.74, CH = 2.13;
export function cell(o = {}) {
  const g = new THREE.Group(); const wm = M.wallCream(), lowM = M.wallGreen();
  const floor = box(CW, 0.08, CD + 0.2, M.floor(), 1.2); floor.position.set(0, -0.04, -CD / 2 + 0.1); floor.userData.ground = true; g.add(floor);
  const wall = (w, h, x, y, z, ry, m) => { const b = box(w, h, 0.12, m, 1.4); b.position.set(x, y, z); b.rotation.y = ry; g.add(b); return b; };
  wall(CW + 0.24, CH, 0, CH / 2, -CD - 0.06, 0, wm); for (const sd of [-1, 1]) { const w = wall(CD + 0.12, CH * 0.45, sd * (CW / 2 + 0.06), CH * 0.225, -CD / 2, Math.PI / 2, lowM); const w2 = wall(CD + 0.12, CH * 0.55, sd * (CW / 2 + 0.06), CH * 0.725, -CD / 2, Math.PI / 2, wm); }
  const back = wall(CW, CH * 0.45, 0, CH * 0.225, -CD + 0.005, 0, lowM);
  const ceil = box(CW + 0.24, 0.1, CD + 0.12, M.concrete(), 1); ceil.position.set(0, CH + 0.05, -CD / 2); if (o.ceil !== false) g.add(ceil);
  // front: bars + door (slides along x)
  const front = new THREE.Group(); const im = M.iron();
  for (let x = -CW / 2; x <= CW / 2 + 0.01; x += 0.11) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, CH, 8), im); b.position.set(x, CH / 2, 0); front.add(b); }
  for (const y of [0.12, 1.0, 1.08, CH - 0.06]) { const r = box(CW + 0.04, y === 1.0 || y === 1.08 ? 0.03 : 0.06, 0.05, im, 0.5); r.position.y = y; front.add(r); }
  if (o.front !== false) g.add(front); g.userData.front = front;
  // sink + toilet on back wall, vent grille below the sink
  const sink = new THREE.Group(); const basin = box(0.42, 0.12, 0.34, std(0xf2f2ee, { roughness: 0.25 }), 1); basin.position.y = 0.82; sink.add(basin); const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), std(0xc0c4cc, { metalness: 0.8, roughness: 0.3 })); tap.position.set(0, 0.95, -0.12); sink.add(tap);
  sink.position.set(0.28, 0, -CD + 0.2); g.add(sink);
  const toilet = new THREE.Group(); const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.4, 20), std(0xf2f2ee, { roughness: 0.25 })); bowl.position.y = 0.2; toilet.add(bowl); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 20), std(0xf2f2ee, { roughness: 0.25 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.41; toilet.add(rim);
  toilet.position.set(-0.36, 0, -CD + 0.28); g.add(toilet);
  const vent = new THREE.Group(); const hole = box(0.26, 0.2, 0.02, glowM(0x050505), 1); hole.position.z = 0.0; vent.add(hole); const grille = new THREE.Group();
  const fr = box(0.28, 0.22, 0.02, M.ironDk(), 1); fr.material = fr.material.clone(); grille.add(fr); for (let i = -4; i <= 4; i++) { const s = box(0.012, 0.2, 0.03, M.iron(), 1); s.position.set(i * 0.03, 0, 0.012); grille.add(s); } for (let j = -3; j <= 3; j++) { const s = box(0.26, 0.012, 0.03, M.iron(), 1); s.position.set(0, j * 0.03, 0.014); grille.add(s); }
  grille.position.z = 0.012; vent.add(grille); vent.position.set(0.28, 0.32, -CD + 0.07); g.add(vent); g.userData.vent = vent; g.userData.grille = grille;
  // cot along the left wall: steel frame, mattress, grey blanket, pillow
  const bed = new THREE.Group(); const fm = M.ironDk(); const frame = box(0.72, 0.05, 1.92, fm, 1); frame.position.y = 0.4; bed.add(frame); for (const [x, z] of [[-0.33, -0.92], [0.33, -0.92], [-0.33, 0.92], [0.33, 0.92]]) { const l = box(0.04, 0.4, 0.04, fm, 1); l.position.set(x, 0.2, z); bed.add(l); }
  const mat_ = box(0.68, 0.1, 1.86, mat('cloth', 0xe8e4d8, { bump: 1 }), 0.6); mat_.position.y = 0.48; bed.add(mat_);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 1.35, 6, 1, 10), mat('cloth', 0x6a7078, { bump: 2 })); blanket.position.set(0, 0.56, 0.3); bed.add(blanket); bed.userData.blanket = blanket;
  const pillow = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.38, 6, 12), mat('cloth', 0xf4f2ea, { bump: 1 })); pillow.rotation.z = Math.PI / 2; pillow.scale.set(1, 1, 0.55); pillow.position.set(0, 0.58, -0.72); bed.add(pillow);
  bed.position.set(-CW / 2 + 0.38, 0, -CD / 2 - 0.1); g.add(bed); g.userData.bed = bed;
  // shelves with books, folding table & seat on the right wall, a light bulb, cup, accordion
  for (const y of [1.45, 1.75]) { const sh = box(0.62, 0.03, 0.22, mat('wood', 0xc8a878), 0.6); sh.position.set(0.3, y, -CD + 0.13); g.add(sh); }
  for (let i = 0; i < 7; i++) { const bk = box(0.04 + rnd() * 0.02, 0.18 + rnd() * 0.06, 0.15, std([0x8a2a2a, 0x2a4a8a, 0x3a6a3a, 0xc8a050, 0x5a3a2a][i % 5]), 0.4); bk.position.set(0.05 + i * 0.065, 1.56, -CD + 0.14); g.add(bk); }
  const tb = box(0.04, 0.42, 0.5, mat('wood', 0xb89870), 0.6); tb.position.set(CW / 2 - 0.02, 0.86, -1.1); tb.rotation.z = 0; const tt = box(0.36, 0.03, 0.5, mat('wood', 0xc8a878), 0.6); tt.position.set(CW / 2 - 0.2, 0.78, -1.1); g.add(tt);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 12), std(0xd8d8d0, { metalness: 0.6, roughness: 0.4 })); cup.position.set(CW / 2 - 0.18, 0.84, -1.2); g.add(cup); g.userData.table = [tt, cup];
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), glowM(0xfff0c0)); bulb.position.set(0, CH - 0.12, -CD + 0.3); bulb.userData.noOutline = true; g.add(bulb); g.userData.bulb = bulb;
  const bl = new THREE.PointLight(0xffe2b0, o.bulb ?? 1.6, 6, 1.6); bl.position.copy(bulb.position).add(V(0, -0.1, 0.2)); bl.castShadow = o.bulbShadow ?? true; if (bl.castShadow) { bl.shadow.mapSize.set(1024, 1024); bl.shadow.bias = -0.002; } g.add(bl); g.userData.bulbL = bl;
  const acc = new THREE.Group(); const abody = box(0.32, 0.26, 0.18, std(0x9a2a2a, { roughness: 0.5 }), 0.4); acc.add(abody); for (let i = -3; i <= 3; i++) { const f = box(0.01, 0.27, 0.19, std(0x1a1a1a), 0.4); f.position.x = i * 0.035; acc.add(f); } acc.position.set(-0.05, 1.93, -CD + 0.14); g.add(acc); g.userData.acc = acc;
  return shadowAll(g);
}

// ---------------- cellhouse interior: "Broadway" between B and C blocks, 3 tiers ----------------
export function cellhouse(o = {}) {
  const g = new THREE.Group(); const n = o.n ?? 14, tiers = 3, aisle = o.aisle ?? 4.6, tierH = 2.75;
  const len = n * CW; const floor = box(len + 20, 0.1, aisle + 20, mat('plaster', 0xb4b0a6, { bump: 0.6 }), 2); floor.position.y = -0.05; floor.userData.ground = true; floor.material.roughness = 0.35; floor.material.metalness = 0.05; g.add(floor);
  const lamps = []; const cells = [];
  for (const sd of [-1, 1]) for (let t = 0; t < tiers; t++) for (let i = 0; i < n; i++) {
    const x = -len / 2 + CW / 2 + i * CW; const y = t * tierH; const fr = new THREE.Group();
    for (let bx = -CW / 2; bx <= CW / 2 + 0.01; bx += 0.11) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, CH, 6), M.iron()); b.position.set(bx, CH / 2, 0); fr.add(b); }
    for (const yy of [0.12, 1.04, CH - 0.06]) { const r = box(CW, 0.05, 0.05, M.iron(), 0.5); r.position.y = yy; fr.add(r); }
    const sep = box(0.18, CH, 0.24, M.concrete(), 1); sep.position.set(CW / 2, CH / 2, -0.1); fr.add(sep);
    const dark = box(CW - 0.1, CH - 0.1, 0.04, std(0x2a2824, { roughness: 1 }), 1); dark.position.set(0, CH / 2, -CD * 0.9); fr.add(dark);
    const inLit = rnd() < 0.55; if (inLit) { const glow = box(0.6, 0.5, 0.02, glowM(0xffd8a0, 0.5), 1); glow.position.set((rnd() - 0.5) * 0.6, 1.6, -CD * 0.88); glow.userData.noOutline = true; fr.add(glow); lamps.push({ m: glow, kind: 'cell', x, sd, t }); }
    fr.position.set(x, y, sd * aisle / 2); fr.rotation.y = sd > 0 ? Math.PI : 0; g.add(fr); cells.push({ x, y, sd, t, g: fr });
  }
  for (const sd of [-1, 1]) { // block walls above/beside the cells + tier slabs + catwalk railings
    for (let t = 0; t < tiers; t++) { const y = t * tierH; const slab = box(len + 0.4, 0.3, 1.0, M.concrete(), 2); slab.position.set(0, y + CH + 0.28, sd * (aisle / 2 + 0.2)); g.add(slab);
      if (t > 0) { const walk = box(len + 0.4, 0.08, 0.9, M.ironDk(), 1); walk.position.set(0, y - 0.04, sd * (aisle / 2 - 0.45)); walk.userData.ground = true; g.add(walk); const rail = box(len + 0.4, 0.05, 0.05, M.ironDk(), 1); rail.position.set(0, y + 1.0, sd * (aisle / 2 - 0.9)); g.add(rail); for (let x = -len / 2; x <= len / 2; x += 1.2) { const p = box(0.04, 1.0, 0.04, M.ironDk(), 1); p.position.set(x, y + 0.5, sd * (aisle / 2 - 0.9)); g.add(p); } } }
    const top = box(len + 0.4, 4, 3, M.concrete(), 2); top.position.set(0, tiers * tierH + 2, sd * (aisle / 2 + 1.4)); g.add(top);
    const outer = box(len + 20, 16, 0.4, M.wallCream(), 3); outer.position.set(0, 8, sd * (aisle / 2 + 6)); g.add(outer);
  }
  const ceilY = tiers * tierH + 4.2; const ceil = box(len + 20, 0.3, aisle + 14, M.concrete(), 3); ceil.position.y = ceilY; g.add(ceil);
  for (let x = -len / 2; x < len / 2; x += 4.5) { const sk = box(2.4, 0.06, 2.8, glowM(o.skyCol ?? 0x141a26), 1); sk.position.set(x, ceilY - 0.16, 0); sk.userData.noOutline = true; g.add(sk); const beam = box(0.3, 0.5, aisle + 14, M.concreteDk(), 1); beam.position.set(x + 2.25, ceilY - 0.4, 0); g.add(beam); }
  // hanging lamps over the aisle (each with a point light) — switched off in cascade
  for (let x = -len / 2 + 2; x < len / 2; x += 4.2) { const lg = new THREE.Group(); const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 2.5, 4), std(0x111111)); cord.position.y = 1.25; lg.add(cord); const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.22, 16, 1, true), std(0x2a4a3a, { side: THREE.DoubleSide, metalness: 0.4, roughness: 0.5 })); lg.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), glowM(0xfff2cc)); bulb.position.y = -0.1; bulb.userData.noOutline = true; lg.add(bulb); const pl = new THREE.PointLight(0xffe6b8, o.lampI ?? 9, 14, 1.4); pl.position.y = -0.3; lg.add(pl);
    lg.position.set(x, ceilY - 2.7, 0); g.add(lg); lamps.push({ m: bulb, l: pl, kind: 'aisle', x }); }
  const clock = clockFace(o.clock ?? 21.5); clock.position.set(len / 2 + 2.5, 6.2, 0); clock.rotation.y = -Math.PI / 2; g.add(clock); g.userData.clock = clock;
  g.userData.lamps = lamps; g.userData.cells = cells; g.userData.len = len; g.userData.aisle = aisle; g.userData.tierH = tierH; return shadowAll(g);
}
export function clockFace(h = 21.5) {
  const g = new THREE.Group(); const face = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 40), std(0xf4f0e4, { roughness: 0.5 })); face.rotation.x = Math.PI / 2; g.add(face); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 8, 40), std(0x2a2a2a, { metalness: 0.6 })); g.add(rim);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const t = box(0.04, i % 3 ? 0.08 : 0.16, 0.02, std(0x111111), 1); t.position.set(Math.sin(a) * 0.6, Math.cos(a) * 0.6, 0.06); t.rotation.z = -a; g.add(t); }
  const hh = box(0.05, 0.36, 0.02, std(0x111111), 1); hh.geometry.translate(0, 0.16, 0); hh.position.z = 0.08; g.add(hh); const mh = box(0.035, 0.55, 0.02, std(0x111111), 1); mh.geometry.translate(0, 0.25, 0); mh.position.z = 0.09; g.add(mh);
  const set = (hr) => { hh.rotation.z = -(hr % 12) / 12 * Math.PI * 2; mh.rotation.z = -(hr % 1) * Math.PI * 2; }; set(h); g.userData.set = set; return g;
}

// ---------------- utility corridor behind the cells: pipes, conduits, the vertical shaft to the roof ----------------
export function utilityCorridor(o = {}) {
  const g = new THREE.Group(); const len = o.len ?? 16, w = 0.95, h = 9;
  const floor = box(len, 0.1, w + 0.4, M.concreteDk(), 1); floor.position.y = -0.05; floor.userData.ground = true; g.add(floor);
  for (const sd of [-1, 1]) { const wall = box(len, h, 0.25, mat('plaster', sd > 0 ? 0xa8a498 : 0x8e8a80, { bump: 3 }), 2); wall.position.set(0, h / 2, sd * (w / 2 + 0.12)); g.add(wall);
    for (let k = 0; k < 7; k++) { const r = 0.03 + (k % 3) * 0.025; const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), std([0x6a5a4a, 0x8a8e94, 0x4a5a4a][k % 3], { metalness: 0.5, roughness: 0.55, bumpMap: T.iron.bump, bumpScale: 1 })); p.rotation.z = Math.PI / 2; p.position.set(0, 0.5 + k * 1.1 + (sd > 0 ? 0.3 : 0), sd * (w / 2 - 0.05 - r)); g.add(p); }
    for (let x = -len / 2 + 0.8; x < len / 2; x += 1.6) { const vent = box(0.26, 0.2, 0.04, glowM(o.ventGlow ?? 0x2a2418), 1); vent.position.set(x, 0.32, sd * (w / 2 - 0.0)); g.add(vent); } }
  for (let x = -len / 2 + 2; x < len / 2; x += 4) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), glowM(0xffd8a0)); b.position.set(x, h - 0.5, 0); b.userData.noOutline = true; g.add(b); const pl = new THREE.PointLight(0xffc888, o.lampI ?? 1.2, 6, 1.6); pl.position.set(x, h - 0.7, 0); g.add(pl); }
  return shadowAll(g);
}
export function shaft(o = {}) { // vertical vent shaft with ladder rungs (pipes) and a roof hatch at the top
  const g = new THREE.Group(); const h = o.h ?? 9, w = 0.9;
  for (const [x, z, ry] of [[0, -w / 2, 0], [-w / 2, 0, Math.PI / 2], [w / 2, 0, Math.PI / 2]]) { const wl = box(w + 0.2, h, 0.15, mat('plaster', 0x9a968a, { bump: 3 }), 1.2); wl.position.set(x, h / 2, z); wl.rotation.y = ry; g.add(wl); }
  for (let y = 0.4; y < h - 0.2; y += 0.42) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, w - 0.1, 8), std(0x7a7e86, { metalness: 0.6, roughness: 0.4 })); r.rotation.z = Math.PI / 2; r.position.set(0, y, -w / 2 + 0.12); g.add(r); }
  for (const x of [-0.32, 0.32]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 10), std(0x5a5e66, { metalness: 0.6, roughness: 0.4 })); p.position.set(x, h / 2, -w / 2 + 0.14); g.add(p); }
  const hatch = box(w * 0.8, 0.06, w * 0.8, M.ironDk(), 1); hatch.geometry.translate(w * 0.4, 0, 0); hatch.position.set(-w * 0.4, h, 0); g.add(hatch); g.userData.hatch = hatch;
  const sky = box(w * 0.75, 0.02, w * 0.75, glowM(o.sky ?? 0x1a2a4a), 1); sky.position.set(0, h + 0.3, 0); sky.userData.noOutline = true; g.add(sky);
  return shadowAll(g);
}

// ---------------- props ----------------
export function spoon() { const g = new THREE.Group(); const sm = std(0xd8dce4, { metalness: 0.9, roughness: 0.25 }); const handle = box(0.012, 0.004, 0.13, sm, 0.3); handle.position.z = 0.07; g.add(handle); const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), sm); bowl.scale.set(1, 0.35, 1.5); bowl.rotation.x = Math.PI; bowl.position.z = -0.01; g.add(bowl); const tip = box(0.008, 0.003, 0.03, sm, 0.3); tip.position.z = -0.045; g.add(tip); return g; }
export function dummyHead(o = {}) {
  const g = new THREE.Group(); const skin = std(o.skin ?? 0xe4b490, { roughness: 0.55, bumpMap: T.plaster.bump, bumpScale: 0.8 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 24), skin); head.scale.set(0.9, 1.08, 1); g.add(head);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), skin); nose.scale.set(0.8, 1, 1.2); nose.position.set(0, -0.005, 0.108); g.add(nose);
  for (const sd of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), skin); ear.scale.set(0.4, 1, 0.7); ear.position.set(sd * 0.098, 0, 0); g.add(ear);
    const lid = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 12, Math.PI), std(0x3a2a20)); lid.position.set(sd * 0.038, 0.022, 0.098); lid.rotation.z = Math.PI; g.add(lid);
    }
  const mouth = box(0.04, 0.005, 0.01, std(0x9a5a4a), 0.2); mouth.position.set(0, -0.055, 0.1); g.add(mouth);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.118, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), mat('thatch', o.hairC ?? 0x5a3a24, { bump: 6 })); hair.scale.set(0.92, 1.05, 1.02); hair.position.set(0, 0.012, -0.008); hair.rotation.x = -0.25; g.add(hair); g.userData.hair = hair; g.userData.skin = skin;
  return shadowAll(g);
}
export function raft(o = {}) {
  const g = new THREE.Group(); const rub = std(o.col ?? 0x6e6a38, { roughness: 0.55, bumpMap: T.cloth.bump, bumpScale: 1.4 });
  const tube = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.2, 14, 40), rub); tube.rotation.x = Math.PI / 2; tube.scale.set(1.0, 0.5, 1); tube.position.y = 0.2; g.add(tube);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(0.95, 32), std(0x5a5428, { roughness: 0.7, bumpMap: T.cloth.bump, bumpScale: 2 })); fl.rotation.x = -Math.PI / 2; fl.scale.set(1.0, 0.5, 1); fl.position.y = 0.06; g.add(fl);
  g.scale.set(1, 1, 1.0); g.userData.tube = tube; return shadowAll(g);
}
export function paddle() { const g = new THREE.Group(); const sh = box(0.04, 0.03, 1.1, mat('wood', 0xd0b080), 0.4); g.add(sh); const bl = box(0.16, 0.015, 0.3, mat('planks', 0xc8a070), 0.4); bl.position.z = 0.65; g.add(bl); return shadowAll(g); }
export function raincoat(col = 0x8a8240) { const geo = new THREE.PlaneGeometry(0.9, 1.2, 10, 12); const P = geo.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, Math.sin(P.getX(i) * 7 + P.getY(i) * 3) * 0.03); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, std(col, { roughness: 0.5, side: THREE.DoubleSide, bumpMap: T.cloth.bump, bumpScale: 1.4 })); m.castShadow = m.receiveShadow = true; return m; }
export function soapBar() { const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.06, 4, 2, 4), std(0xf4ecd0, { roughness: 0.35 })); m.castShadow = true; return m; }
export function tpRoll() { const g = new THREE.Group(); const r = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 24, 1, true), std(0xf8f6f0, { side: THREE.DoubleSide, bumpMap: T.cloth.bump, bumpScale: 0.6 })); g.add(r); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 12, 1, true), std(0xa88a60, { side: THREE.DoubleSide })); g.add(c); return shadowAll(g); }
export function paintPot(col = 0xe4b490) { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16), std(0xb8bcc4, { metalness: 0.7, roughness: 0.35 })); g.add(c); const p = new THREE.Mesh(new THREE.CircleGeometry(0.036, 16), std(col, { roughness: 0.3 })); p.rotation.x = -Math.PI / 2; p.position.y = 0.031; g.add(p); const br = box(0.008, 0.008, 0.16, mat('wood', 0xc8a878), 0.2); br.position.set(0.02, 0.06, 0); br.rotation.x = 0.9; g.add(br); return shadowAll(g); }
export function barberChair() { const g = new THREE.Group(); const red = std(0x9a1e24, { roughness: 0.45 }), chrome = std(0xd0d4dc, { metalness: 0.9, roughness: 0.2 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 24), chrome); base.position.y = 0.04; g.add(base); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.36, 12), chrome); post.position.y = 0.26; g.add(post);
  const seat = box(0.56, 0.14, 0.52, red, 0.6); seat.position.y = 0.5; g.add(seat); const back = box(0.56, 0.62, 0.12, red, 0.6); back.position.set(0, 0.86, -0.22); back.rotation.x = -0.12; g.add(back); for (const sd of [-1, 1]) { const arm = box(0.08, 0.06, 0.48, chrome, 0.4); arm.position.set(sd * 0.3, 0.72, 0); g.add(arm); }
  const foot = box(0.4, 0.03, 0.18, chrome, 0.4); foot.position.set(0, 0.2, 0.42); g.add(foot); return shadowAll(g); }
export function hairClumps(n = 160, area = [1.6, 1.4], col = 0x4a3020) { const geo = new THREE.SphereGeometry(0.018, 6, 4); const m = new THREE.MeshStandardMaterial({ color: col, roughness: 1, bumpMap: T.thatch.bump, bumpScale: 4 }); const im = new THREE.InstancedMesh(geo, m, n); const q = new THREE.Object3D(); const C = new THREE.Color();
  for (let i = 0; i < n; i++) { q.position.set((rnd() - 0.5) * area[0], 0.006, (rnd() - 0.5) * area[1]); q.scale.set(0.6 + rnd() * 1.4, 0.15, 0.4 + rnd()); q.rotation.y = rnd() * 6.28; q.updateMatrix(); im.setMatrixAt(i, q.matrix); C.setHex([0x4a3020, 0x2a1e14, 0x8a6a40, 0x6a5a50][i % 4]); im.setColorAt(i, C); } im.receiveShadow = true; im.userData.noOutline = true; return im; }
export function calendar() { // tear-off wall calendar; returns {g, tear(k)}
  const mk = (txt, big, red) => canvasT(512, 640, (c, w, h) => { c.fillStyle = '#f6f2e6'; c.fillRect(0, 0, w, h); c.fillStyle = '#b81e24'; c.fillRect(0, 0, w, 150); c.fillStyle = '#fff'; c.font = '900 92px Nunito, Arial'; c.textAlign = 'center'; c.fillText(txt, w / 2, 110); c.fillStyle = red ? '#b81e24' : '#1a1a1a'; c.font = '900 330px Nunito, Arial'; c.fillText(big, w / 2, 500); c.font = '800 54px Nunito, Arial'; c.fillStyle = '#555'; c.fillText(big === '11' ? 'MONDAY' : 'SUNDAY', w / 2, 600); if (red) { c.strokeStyle = 'rgba(200,20,20,.85)'; c.lineWidth = 16; c.beginPath(); c.ellipse(w / 2, 390, 200, 150, -0.1, 0, 7); c.stroke(); } });
  const g = new THREE.Group(); const back = box(0.66, 0.84, 0.03, std(0x8a5a30), 0.6); back.position.z = -0.02; g.add(back);
  const p11 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.75), new THREE.MeshStandardMaterial({ map: mk('JUNE 1962', '11', true), roughness: 0.9 })); p11.position.z = 0.0; g.add(p11);
  const p10 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.75, 8, 8), new THREE.MeshStandardMaterial({ map: mk('JUNE 1962', '10', false), roughness: 0.9, side: THREE.DoubleSide })); p10.geometry.translate(0, -0.375, 0); p10.position.set(0, 0.375, 0.004); g.add(p10);
  const tear = (k) => { p10.rotation.x = -k * 2.4; p10.position.z = 0.004 + k * 0.25; p10.position.y = 0.375 - k * k * 0.6; p10.visible = k < 0.98; };
  return { g: shadowAll(g), tear };
}
export function fbiFile() {
  const tex = canvasT(900, 1200, (c, w, h) => { c.fillStyle = '#f2ead4'; c.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(120,90,40,${Math.random() * 0.05})`; c.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    c.fillStyle = '#1a1a1a'; c.textAlign = 'center'; c.font = '900 50px Courier New, monospace'; c.fillText('FEDERAL BUREAU OF', w / 2, 90); c.fillText('INVESTIGATION', w / 2, 146); c.font = '700 34px Courier New, monospace'; c.fillText('ESCAPE — U.S. PENITENTIARY ALCATRAZ', w / 2, 210); c.fillText('JUNE 11-12, 1962', w / 2, 255);
    const names = ['MORRIS, F.', 'ANGLIN, J.', 'ANGLIN, C.']; names.forEach((n, i) => { const x = 160 + i * 290, y = 340; c.fillStyle = '#d8d4cc'; c.fillRect(x - 115, y, 230, 290); c.strokeStyle = '#333'; c.lineWidth = 4; c.strokeRect(x - 115, y, 230, 290);
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y + 120, 70, 0, 7); c.fill(); c.lineWidth = 7; c.strokeStyle = '#111'; c.stroke(); c.fillStyle = '#111'; c.beginPath(); c.arc(x - 24, y + 115, 7, 0, 7); c.arc(x + 24, y + 115, 7, 0, 7); c.fill(); c.lineWidth = 5; c.beginPath(); c.moveTo(x - 20, y + 152); c.lineTo(x + 20, y + 152); c.stroke(); c.fillStyle = '#9ab4d8'; c.fillRect(x - 70, y + 196, 140, 94);
      c.fillStyle = '#111'; c.font = '700 30px Courier New, monospace'; c.fillText(n, x, y + 330); });
    c.textAlign = 'left'; c.font = '600 28px Courier New, monospace'; c.fillStyle = '#333'; ['Raft (rubberized raincoats) — not recovered intact.', 'Paddle and life vest found in the bay.', 'No bodies recovered.', 'Case closed: December 31, 1979.'].forEach((l, i) => c.fillText(l, 70, 760 + i * 52));
    c.fillStyle = 'rgba(0,0,0,.6)'; for (let i = 0; i < 4; i++) c.fillRect(70, 1000 + i * 40, 560 - i * 90, 16); });
  const g = new THREE.Group(); const folder = box(0.95, 0.02, 1.2, std(0xc8a868, { roughness: 0.9 }), 0.6); folder.position.set(0.04, -0.012, -0.02); g.add(folder); const tab = box(0.3, 0.02, 0.1, std(0xc8a868), 0.4); tab.position.set(-0.28, -0.012, -0.66); g.add(tab);
  const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.13), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); pg.rotation.x = -Math.PI / 2; g.add(pg);
  return shadowAll(g);
}
export function deskLamp() { const g = new THREE.Group(); const dm = std(0x2a4a3a, { metalness: 0.5, roughness: 0.4 }); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 20), dm); g.add(base); const arm = box(0.02, 0.4, 0.02, dm, 0.3); arm.position.set(0, 0.2, 0); arm.rotation.z = 0.2; g.add(arm); const sh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.14, 20, 1, true), std(0x2a4a3a, { side: THREE.DoubleSide, metalness: 0.5 })); sh.position.set(0.1, 0.4, 0); sh.rotation.z = -0.9; g.add(sh); const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), glowM(0xfff2cc)); b.position.set(0.13, 0.37, 0); b.userData.noOutline = true; g.add(b); const l = new THREE.SpotLight(0xffe2b0, 6, 4, 0.9, 0.5, 1.4); l.position.set(0.13, 0.37, 0); l.target.position.set(0.6, -0.4, 0); g.add(l); g.add(l.target); l.castShadow = true; return shadowAll(g); }
export function flashlight(sc) { // flashlight cone + spot attached to a guard
  const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.22, 10), std(0x2a2a2e, { metalness: 0.6, roughness: 0.4 })); body.rotation.x = Math.PI / 2; g.add(body); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 12), glowM(0xfffae0)); lens.position.z = 0.111; lens.userData.noOutline = true; g.add(lens);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 3, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff4d0, transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); cone.geometry.translate(0, -1.5, 0); cone.geometry.rotateX(-Math.PI / 2); cone.position.z = 0.11; cone.userData.noOutline = true; g.add(cone);
  const sp = new THREE.SpotLight(0xfff2d0, 140, 14, 0.32, 0.45, 1.3); sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); sp.position.z = 0.12; g.add(sp); const tg = new THREE.Object3D(); tg.position.z = 3; g.add(tg); sp.target = tg; g.userData.spot = sp; g.userData.cone = cone; return g;
}
export function wallSection(w = 6, h = 3, m) { const b = box(w, h, 0.3, m ?? M.wallCream(), 2); b.position.y = h / 2; return shadowAll(b); }
export function barbedFence(len = 30) { const g = new THREE.Group(); for (let x = -len / 2; x <= len / 2; x += 3) { const p = box(0.12, 3, 0.12, M.ironDk(), 1); p.position.set(x, 1.5, 0); g.add(p); const t = box(0.08, 0.8, 0.08, M.ironDk(), 1); t.position.set(x, 3.2, 0.25); t.rotation.x = 0.6; g.add(t); }
  for (let k = 0; k < 6; k++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 4), std(0x8a8e94, { metalness: 0.8, roughness: 0.4 })); w.rotation.z = Math.PI / 2; w.position.set(0, 0.5 + k * 0.48, 0); g.add(w); }
  for (let x = -len / 2; x < len / 2; x += 0.4) { const coil = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.008, 4, 10), std(0x8a8e94, { metalness: 0.8, roughness: 0.4 })); coil.position.set(x, 3.45, 0.42); coil.rotation.y = Math.PI / 2 + 0.3; g.add(coil); } return g; }
