// Medieval London kit: sky/haze, timber-framed houses, streets with displaced cobbles, Thames, bridge, props, particles.
import * as THREE from 'three';
import { T, mat, uvBox, uvPlane } from './tex.js';
import { mergeGeometries } from '../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
export { T, mat };

let _s = 1; export const rnd = () => (_s = (_s * 9301 + 49297) % 233280) / 233280; export const seed = (v) => { _s = v; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o));
const shadowAll = (g) => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
export function box(w, h, d, m, s = 1.5) { const g = uvBox(new THREE.BoxGeometry(w, h, d), w, h, d, s); return new THREE.Mesh(g, m); }

// ---------------- sky / light ----------------
export function sky(scene, mode = 'day') {
  const cols = { day: [0x6f8fb4, 0xb9c6cf, 0xe8dcc4], haze: [0x7d8a96, 0xb6b3a6, 0xd9cdb2], dusk: [0x27305e, 0xc86a4a, 0xf2b072], night: [0x070b1c, 0x1a2342, 0x3a3a52], plague: [0x3a3f45, 0x6d6f6a, 0x9a957f], dawn: [0x5b78a8, 0xf0a878, 0xffe0b0] }[mode];
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(cols[0]) }, mid: { value: new THREE.Color(cols[1]) }, hor: { value: new THREE.Color(cols[2]) } },
    vertexShader: 'varying vec3 vp; void main(){ vp=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top,mid,hor; varying vec3 vp;
      float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
      void main(){ float h=clamp(vp.y,0.,1.); vec3 c=mix(hor,mid,smoothstep(0.,.18,h)); c=mix(c,top,smoothstep(.18,.7,h));
        vec2 q = vp.xz/(vp.y+0.25)*2.2; float cl = vn(q)*.5+vn(q*2.3)*.3+vn(q*5.1)*.2; cl = smoothstep(.45,.85,cl)*smoothstep(0.02,.3,h);
        c = mix(c, mix(hor, vec3(1.), .35), cl*${mode === 'night' ? '0.15' : '0.55'}); gl_FragColor=vec4(c,1.); }` });
  const s = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), m); s.renderOrder = -10; s.userData.noOutline = true; scene.add(s);
  if (mode === 'night') { const n = 900, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const th = rnd() * 6.283, ph = rnd() * 1.3 + 0.1; p.set([Math.cos(th) * Math.cos(ph) * 480, Math.sin(ph) * 480, Math.sin(th) * Math.cos(ph) * 480], i * 3); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, fog: false }))); }
  const fogc = { day: 0xd8d0bc, haze: 0xc9c0aa, dusk: 0xb0705a, night: 0x1c2238, plague: 0x7c7a70, dawn: 0xe8b890 }[mode];
  scene.fog = new THREE.FogExp2(fogc, { day: 0.012, haze: 0.022, dusk: 0.016, night: 0.03, plague: 0.035, dawn: 0.014 }[mode]);
  return s;
}
export function lights(scene, mode = 'day', ext = 30) {
  const P = { day: [0xfff1d6, 0x6a5a48, 1.5, 0xfff0d0, 3.0], haze: [0xf2e8d2, 0x5a5040, 1.7, 0xffe8c8, 2.2], dusk: [0xffb48a, 0x3a2a40, 1.1, 0xff9a5a, 2.6], night: [0x5a6aa0, 0x10121c, 0.9, 0x8aa0ff, 0.9], plague: [0xc8c8c0, 0x3a3a38, 1.6, 0xd8d8d0, 1.2], dawn: [0xffd8b0, 0x50506a, 1.4, 0xffc890, 2.8] }[mode];
  scene.add(new THREE.HemisphereLight(P[0], P[1], P[2]));
  const d = new THREE.DirectionalLight(P[3], P[4]); d.position.set(-25, 40, 18); d.castShadow = true; d.shadow.mapSize.set(3072, 3072);
  Object.assign(d.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 160 }); d.shadow.bias = -0.0003; d.shadow.normalBias = 0.03; d.shadow.radius = 3;
  scene.add(d); scene.add(d.target); return d;
}

// ---------------- timber-framed house ----------------
const PL = [0xf3ead6, 0xeedcb4, 0xf0d8c4, 0xe6e0cc, 0xf2e2a8, 0xdfe2d6];
// local: front faces +Z at z=0, width along X, back at -d. Returns group with userData.windows (emissive mats) and chimney top.
export function house(o = {}) {
  const w = o.w ?? 4.2, d = o.d ?? 5, floors = o.floors ?? 3, jet = o.jet ?? 0.45, g = new THREE.Group(); g.userData.windows = []; g.userData.smoke = [];
  const plc = o.plaster ?? PL[Math.floor(rnd() * PL.length)];
  const pm = mat('plaster', plc), wm = mat('wood', o.timber ?? 0xffffff), sm = mat('stone', 0xd8d0c0);
  const H0 = 2.9, H = 2.55; let y = 0;
  // stone plinth
  const pl = box(w, 0.45, d, sm, 1.2); pl.position.set(0, 0.225, -d / 2); g.add(pl); y = 0.45;
  for (let f = 0; f < floors; f++) {
    const h = f === 0 ? H0 - 0.45 : H, oz = f * jet, wf = w + (f > 0 ? 0.0 : 0);
    const wall = box(wf, h, d, pm, 1.6); wall.position.set(0, y + h / 2, oz - d / 2); g.add(wall);
    // jetty: protruding joist ends + bressumer beam
    if (f > 0) { const br = box(wf + 0.08, 0.22, 0.26, wm, 1.0); br.position.set(0, y - 0.02, oz + 0.02); g.add(br); for (let x = -wf / 2 + 0.25; x < wf / 2; x += 0.42) { const j = box(0.14, 0.14, jet + 0.1, wm, 0.8); j.position.set(x, y - 0.2, oz - jet / 2 + 0.06); g.add(j); } }
    // frame on the front face: sill, posts, rail, braces
    const fz = oz + 0.03; const beam = (x0, y0, x1, y1, t = 0.15) => { const L = Math.hypot(x1 - x0, y1 - y0); const b = box(L, t, 0.1, wm, 1.0); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, fz); b.rotation.z = Math.atan2(y1 - y0, x1 - x0) + (rnd() - 0.5) * 0.015; g.add(b); };
    beam(-wf / 2, y + 0.07, wf / 2, y + 0.07, 0.17); beam(-wf / 2, y + h - 0.08, wf / 2, y + h - 0.08, 0.17);
    const nb = Math.max(3, Math.round(wf / 0.95)); const xs = []; for (let i = 0; i <= nb; i++) xs.push(-wf / 2 + 0.07 + i * (wf - 0.14) / nb);
    xs.forEach(x => beam(x, y + 0.1, x, y + h - 0.1, 0.16));
    if (f > 0) beam(-wf / 2, y + h * 0.42, wf / 2, y + h * 0.42, 0.12);
    // side faces: corner posts + middle post
    for (const sx of [-1, 1]) for (const z of [oz - 0.06, oz - d / 2, oz - d + 0.06]) { const p = box(0.1, h, 0.16, wm, 1.0); p.position.set(sx * (wf / 2 + 0.03), y + h / 2, z); g.add(p); }
    for (const sx of [-1, 1]) { const r = box(0.1, 0.15, d, wm, 1.0); r.position.set(sx * (wf / 2 + 0.03), y + h - 0.08, oz - d / 2); g.add(r); }
    // openings
    if (f === 0) {
      // door with planks + iron straps
      const dx = o.doorX ?? (-wf / 2 + 0.95); const door = box(1.0, 2.0, 0.08, mat('planks', 0x9a7a5a), 1.2); door.position.set(dx, y + 1.0 - 0.45 + 0.45, fz + 0.01); door.position.y = 0.45 + 1.0; g.add(door); g.userData.door = door;
      for (const yy of [0.5, 1.5]) { const st = box(0.8, 0.06, 0.03, mat('iron', 0xffffff), 0.5); st.position.set(dx - 0.05, 0.45 + yy, fz + 0.06); g.add(st); }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 14), std(0x2a2a2a, { metalness: 0.6 })); ring.position.set(dx + 0.35, 1.5, fz + 0.07); g.add(ring);
      // shop window with shutters (bottom one flipped down as a counter)
      if (o.shop !== false) {
        const sx = dx + 1.55 < wf / 2 - 0.4 ? dx + 1.55 : wf / 2 - 0.9; const ow = Math.min(1.6, wf / 2 - 0.2);
        const dark = new THREE.Mesh(new THREE.PlaneGeometry(ow, 1.1), std(0x1e140c)); dark.position.set(sx, 1.65, fz + 0.005); dark.userData.noOutline = true; g.add(dark);
        const top = box(ow, 0.08, 0.6, mat('planks', 0xb08a60), 1.0); top.position.set(sx, 2.25, fz + 0.3); top.rotation.x = -0.35; g.add(top);
        const ctr = box(ow, 0.08, 0.6, mat('planks', 0xb08a60), 1.0); ctr.position.set(sx, 1.08, fz + 0.3); g.add(ctr); g.userData.counter = V(sx, 1.12, fz + 0.3);
        for (const lx of [sx - ow / 2 + 0.05, sx + ow / 2 - 0.05]) { const leg = box(0.06, 0.6, 0.06, wm, 1); leg.position.set(lx, 0.78, fz + 0.52); g.add(leg); }
      }
    } else {
      const nW = Math.max(1, Math.floor(wf / 1.6));
      for (let i = 0; i < nW; i++) {
        const x = -wf / 2 + (i + 0.5) * wf / nW; const ww = 0.8, wh = 0.95, wy = y + h * 0.5;
        const glow = new THREE.MeshStandardMaterial({ color: 0x2a2018, emissive: 0xffa040, emissiveIntensity: 0, roughness: 0.3, metalness: 0.2 }); g.userData.windows.push(glow);
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), glow); gl.position.set(x, wy, fz + 0.02); gl.userData.noOutline = true; g.add(gl);
        // diamond lattice (leaded glass)
        const lat = new THREE.Group(); for (let k = -3; k <= 3; k++) for (const sgn of [1, -1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.018, 1.4, 0.012), std(0x2a2a2a)); b.position.set(k * 0.17, 0, 0); b.rotation.z = sgn * 0.6; lat.add(b); }
        lat.position.set(x, wy, fz + 0.03); lat.traverse(m => { m.userData.noOutline = true; }); const clipBox = new THREE.Group(); g.add(lat); lat.scale.set(ww / 1.15, wh / 1.15, 1);
        const fr = box(ww + 0.16, 0.1, 0.12, wm, 1); fr.position.set(x, wy - wh / 2 - 0.04, fz + 0.04); g.add(fr); const fr2 = fr.clone(); fr2.position.y = wy + wh / 2 + 0.04; g.add(fr2);
        // shutters open at random angles
        for (const sd of [-1, 1]) { const sh = new THREE.Group(); const p = box(ww / 2, wh, 0.05, mat('planks', o.shutter ?? [0x7a5a3a, 0x5a6e4a, 0x7a3a2a, 0x4a5a6a][Math.floor(rnd() * 4)]), 0.9); p.position.x = sd * ww / 4; sh.add(p); sh.position.set(x + sd * ww / 2, wy, fz + 0.06); sh.rotation.y = sd * (1.4 + rnd() * 0.6); g.add(sh); }
      }
    }
    y += h;
  }
  // gable roof (ridge front-to-back) with a timbered gable triangle
  const oz = (floors - 1) * jet, rw = w / 2 + 0.35, rh = o.roofH ?? (w * 0.62), L = Math.hypot(rw, rh), ang = Math.atan2(rh, rw);
  const rm = o.thatch ? mat('thatch', 0xffffff, { bump: 4 }) : mat('tiles', 0xffffff, { bump: 3 });
  for (const sd of [-1, 1]) { const s = box(L, 0.14, d + 0.6, rm, 1.8); s.position.set(sd * rw / 2 - sd * 0.0, y + rh / 2 + 0.05, oz - d / 2 + 0.15); s.rotation.z = -sd * ang; g.add(s); g.userData.roof = g.userData.roof || []; g.userData.roof.push(s); }
  const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, rh * (w / 2) / rw); tri.closePath();
  const tg = new THREE.ShapeGeometry(tri); uvPlane(tg, 1 / 1.6, 1 / 1.6, 1); const gt = new THREE.Mesh(tg, pm); gt.position.set(0, y, oz + 0.001); g.add(gt);
  const gth = rh * (w / 2) / rw; const kp = box(0.15, gth * 0.9, 0.1, wm, 1); kp.position.set(0, y + gth * 0.45, oz + 0.03); g.add(kp);
  for (const sd of [-1, 1]) { const L2 = Math.hypot(w / 2, gth); const bb = box(L2, 0.18, 0.12, wm, 1); bb.position.set(sd * w / 4, y + gth / 2 + 0.05, oz + 0.06); bb.rotation.z = -sd * Math.atan2(gth, w / 2); g.add(bb); }
  const cb = box(w * 0.55, 0.13, 0.1, wm, 1); cb.position.set(0, y + gth * 0.45, oz + 0.03); g.add(cb);
  // chimney (stone) on one slope
  if (o.chimney !== false) { const cx = (rnd() > 0.5 ? 1 : -1) * w * 0.22, ch = box(0.6, rh + 1.2, 0.6, mat('stone', 0xb8a890), 0.8); ch.position.set(cx, y + rh * 0.5 + 0.3, oz - d * 0.65); g.add(ch); g.userData.smoke.push(V(cx, y + rh + 1.0, oz - d * 0.65)); }
  // hanging trade sign
  if (o.sign) { const arm = box(1.1, 0.06, 0.06, mat('iron', 0xffffff), 0.5); arm.position.set(w / 2 - 0.6, 3.6, oz + 0.55); arm.rotation.y = Math.PI / 2; g.add(arm); const sg = signBoard(o.sign); sg.position.set(w / 2 - 0.6, 3.15, oz + 0.85); sg.rotation.y = Math.PI / 2; g.add(sg); g.userData.sign = sg; }
  g.userData.top = y + rh; g.userData.floors = floors; g.userData.front = oz; g.userData.w = w; g.userData.d = d;
  shadowAll(g); if (o.bake !== false) bake(g); g.rotation.z = (rnd() - 0.5) * 0.012; return g;
}
export function signBoard(kind) {
  const g = new THREE.Group(); const cv = document.createElement('canvas'); cv.width = 256; cv.height = 192; const c = cv.getContext('2d');
  c.fillStyle = '#5a3a22'; c.fillRect(0, 0, 256, 192); c.strokeStyle = '#c9a54a'; c.lineWidth = 10; c.strokeRect(8, 8, 240, 176);
  c.fillStyle = '#e8c35a'; c.strokeStyle = '#1a1006'; c.lineWidth = 6;
  if (kind === 'ale') { c.beginPath(); c.roundRect(88, 50, 80, 100, 10); c.fill(); c.stroke(); c.beginPath(); c.arc(175, 100, 22, -1.3, 1.3); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(128, 52, 46, 16, 0, 0, 7); c.fill(); }
  else if (kind === 'bread') { c.beginPath(); c.ellipse(128, 100, 80, 46, 0, 0, 7); c.fill(); c.stroke(); for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(128 + i * 30 - 12, 78); c.lineTo(128 + i * 30 + 12, 122); c.stroke(); } }
  else if (kind === 'key') { c.beginPath(); c.arc(80, 96, 28, 0, 7); c.fill(); c.stroke(); c.fillRect(105, 88, 110, 16); c.strokeRect(105, 88, 110, 16); c.fillRect(185, 104, 14, 26); c.fillRect(205, 104, 10, 18); }
  else { c.beginPath(); c.moveTo(128, 40); c.lineTo(190, 150); c.lineTo(66, 150); c.closePath(); c.fill(); c.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.56, 0.05), [std(0x4a2e1a), std(0x4a2e1a), std(0x4a2e1a), std(0x4a2e1a), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })]); g.add(b);
  for (const x of [-0.25, 0.25]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4), std(0x222222)); ch.position.set(x, 0.38, 0); g.add(ch); }
  return g;
}
// cheap low-detail house for skylines (instanced in town())
export function town(scene, { n = 260, area = [-120, 120, -160, -20], exclude = [], seedv = 4, roofThatch = 0 } = {}) {
  seed(seedv); const wallGeo = new THREE.BoxGeometry(1, 1, 1); wallGeo.translate(0, 0.5, 0);
  const roofGeo = new THREE.CylinderGeometry(0.72, 0.72, 1, 3, 1); roofGeo.rotateX(Math.PI / 2); roofGeo.rotateZ(Math.PI / 2 * 0); roofGeo.scale(1, 0.62, 1); roofGeo.translate(0, 0.3, 0);
  const wallM = mat('plaster', 0xffffff, { bump: 1.2 }), roofM = mat('tiles', 0xffffff, { bump: 1.5 }), frameM = std(0x3a2616);
  const iw = new THREE.InstancedMesh(wallGeo, wallM, n), ir = new THREE.InstancedMesh(roofGeo, roofM, n); const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(); const C = new THREE.Color();
  let k = 0; for (let tries = 0; k < n && tries < n * 20; tries++) {
    const x = area[0] + rnd() * (area[1] - area[0]), z = area[2] + rnd() * (area[3] - area[2]); if (exclude.some(e => x > e[0] && x < e[1] && z > e[2] && z < e[3])) continue;
    const w = 3.5 + rnd() * 2.5, d = 4 + rnd() * 3, h = 5 + rnd() * 5, ry = Math.round(rnd() * 4) * Math.PI / 2 + (rnd() - 0.5) * 0.2;
    Q.setFromAxisAngle(V(0, 1, 0), ry); M.compose(P.set(x, 0, z), Q, S.set(w, h, d)); iw.setMatrixAt(k, M); iw.setColorAt(k, C.setHex(PL[k % PL.length]));
    M.compose(P.set(x, h - 0.05, z), Q, S.set(w * 0.82, w * 0.75, d * 1.05)); ir.setMatrixAt(k, M); ir.setColorAt(k, C.setHSL(0.03 + rnd() * 0.03, 0.45, 0.42 + rnd() * 0.15)); k++;
  }
  iw.count = ir.count = k; [iw, ir].forEach(m => { m.castShadow = m.receiveShadow = true; m.userData.noOutline = true; scene.add(m); });
  return { iw, ir };
}
// Old St Paul's: long nave + crossing tower + very tall spire
export function stPauls() {
  const g = new THREE.Group(); const sm = mat('stone', 0xc8c0b0, { bump: 1.5 });
  const nave = box(14, 16, 80, sm, 4); nave.position.set(0, 8, 0); g.add(nave);
  const tr = box(40, 15, 12, sm, 4); tr.position.set(0, 7.5, -8); g.add(tr);
  for (const sd of [-1, 1]) { const rf = box(10.5, 0.6, 81, std(0x55606a, { metalness: 0.3, roughness: 0.6 }), 4); rf.position.set(sd * 3.6, 19, 0); rf.rotation.z = -sd * 0.85; g.add(rf); }
  const tw = box(14, 18, 14, sm, 4); tw.position.set(0, 25, -8); g.add(tw);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const pn = new THREE.Mesh(new THREE.ConeGeometry(0.9, 6, 6), sm); pn.position.set(sx * 6.5, 37, -8 + sz * 6.5); g.add(pn); }
  const sp = new THREE.Mesh(new THREE.ConeGeometry(6.2, 70, 8, 6), std(0x4c5560, { metalness: 0.35, roughness: 0.55 })); sp.position.set(0, 69, -8); g.add(sp);
  const cross = box(0.5, 4, 0.5, std(0xd4a640, { metalness: 0.8, roughness: 0.3 })); cross.position.set(0, 106, -8); g.add(cross);
  for (let z = -36; z <= 36; z += 6) for (const sd of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2, 6), std(0x2a3442)); w.position.set(sd * 7.02, 9, z); w.rotation.y = sd * Math.PI / 2; g.add(w); const bt = box(1.2, 14, 2, sm, 3); bt.position.set(sd * 7.8, 7, z + 3); g.add(bt); }
  return shadowAll(g);
}

// ---------------- ground: displaced cobbles / mud, with central gutter ----------------
export function street({ w = 7, len = 60, kind = 'cobble', gutter = true, seg = 260 } = {}) {
  const g = new THREE.Group(); const t = T[kind];
  const geo = new THREE.PlaneGeometry(w, len, Math.round(seg * w / len) + 40, seg); geo.rotateX(-Math.PI / 2); uvPlane(geo, w, len, kind === 'cobble' ? 2.0 : 4);
  // gutter dip down the middle (V-shaped "kennel")
  const p = geo.attributes.position; if (gutter) for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setY(i, -0.09 * Math.max(0, 1 - Math.abs(x) / 0.75)); }
  geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 3, roughnessMap: t.rough, roughness: 1, displacementMap: t.bump, displacementScale: kind === 'cobble' ? 0.07 : 0.05, displacementBias: -0.03 });
  const gr = new THREE.Mesh(geo, m); gr.receiveShadow = true; gr.userData.ground = true; gr.userData.noOutline = true; g.add(gr);
  if (gutter) { const wg = new THREE.PlaneGeometry(0.75, len, 4, 100); wg.rotateX(-Math.PI / 2); const wm = new THREE.MeshStandardMaterial({ color: 0x4a3a1e, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.92 }); const water = new THREE.Mesh(wg, wm); water.position.y = -0.045; water.userData.noOutline = true; water.receiveShadow = true; g.add(water); g.userData.gutter = water;
    // floating muck in the gutter
    const mk = []; for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.03 + rnd() * 0.05, 6, 5), std([0x3a2a12, 0x5a4a22, 0x6a5a3a][i % 3])); b.scale.y = 0.4; b.position.set((rnd() - 0.5) * 0.4, -0.035, (rnd() - 0.5) * len); b.userData.noOutline = true; g.add(b); mk.push(b); } g.userData.muck = mk; }
  return g;
}
export function flowGutter(g, t) { if (!g.userData.muck) return; const len = g.userData.len || 60; g.userData.muck.forEach((b, i) => { b.position.z = ((b.userData.z0 ?? (b.userData.z0 = b.position.z)) + t * 0.6 + len / 2) % len - len / 2; }); }

// a full street set: houses both sides along Z, facing the middle
export function streetSet({ len = 46, w = 6.5, n = 7, kind = 'cobble', signs = true, seedv = 7, thatch = false, nightGlow = 0 } = {}) {
  seed(seedv); const g = new THREE.Group(); const st = street({ w: w + 2, len, kind }); g.add(st); g.userData.street = st; const H = [];
  for (const sd of [-1, 1]) { let z = len / 2 - 1; for (let i = 0; i < n && z > -len / 2 + 2; i++) { const hw = 3.6 + rnd() * 1.6; const h = house({ w: hw, d: 5, floors: 2 + Math.floor(rnd() * 2.2), sign: signs && rnd() < 0.35 ? ['ale', 'bread', 'key', 'x'][Math.floor(rnd() * 4)] : null, thatch: thatch && rnd() < 0.5 }); h.position.set(sd * (w / 2 + 0.05), 0, z - hw / 2); h.rotation.y = -sd * Math.PI / 2; g.add(h); H.push(h); h.userData.side = sd; z -= hw + 0.04 + (rnd() < 0.15 ? 1.2 : 0); } }
  g.userData.houses = H; H.forEach(h => h.userData.windows.forEach(m => m.emissiveIntensity = nightGlow));
  return g;
}

// ---------------- Thames + bridge ----------------
export class River {
  constructor(scene, size = 600, seg = 180, color = 0x55603a) {
    this.geo = new THREE.PlaneGeometry(size, size, seg, seg); this.geo.rotateX(-Math.PI / 2); this.base = this.geo.attributes.position.array.slice();
    this.mesh = new THREE.Mesh(this.geo, new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.25, side: THREE.DoubleSide })); this.mesh.receiveShadow = true; this.mesh.userData.noOutline = true; scene.add(this.mesh); this.amp = 0.08;
  }
  update(t) { const p = this.geo.attributes.position.array, b = this.base; for (let i = 0; i < p.length; i += 3) { const x = b[i], z = b[i + 2]; p[i + 1] = this.amp * (Math.sin(x * 0.5 + t * 1.3) * 0.6 + Math.sin(z * 0.7 - t * 0.9) * 0.5 + Math.sin((x - z) * 1.6 + t * 2.1) * 0.2); } this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); }
}
// London Bridge: runs along X. Starlings (boat-shaped piers) + arches + road deck at y=deckY + houses on top.
export function bridge({ len = 120, deckY = 6, houses = true, gate = true, detail = 1 } = {}) {
  const g = new THREE.Group(); const sm = mat('stone', 0xcfc6b4, { bump: 2 }); const span = 7.2, pier = 3.2, wd = 9;
  const nP = Math.floor(len / span);
  for (let i = 0; i <= nP; i++) {
    const x = -len / 2 + i * span;
    const st = new THREE.Shape(); st.moveTo(-pier / 2, -wd / 2 - 2.2); st.lineTo(pier / 2, -wd / 2 - 2.2); st.lineTo(pier / 2, wd / 2 + 2.2); st.lineTo(0, wd / 2 + 3.6); st.lineTo(-pier / 2, wd / 2 + 2.2); st.closePath();
    const sg = new THREE.ExtrudeGeometry(st, { depth: 1.6, bevelEnabled: false }); sg.rotateX(-Math.PI / 2); sg.translate(0, -1.2, 0); const s = new THREE.Mesh(sg, std(0x9a9080)); s.position.x = x; g.add(s); // starling (rubble base)
    const p = box(pier, deckY, wd, sm, 2.2); p.position.set(x, deckY / 2 - 0.4, 0); g.add(p);
    if (i < nP) { // arch: deck slab + rounded arch ring (half torus)
      const ar = new THREE.Mesh(new THREE.TorusGeometry((span - pier) / 2, 0.55, 10, 24, Math.PI), sm); ar.scale.z = wd / 1.1; ar.position.set(x + span / 2, deckY - 2.6, 0); g.add(ar);
      const sl = box(span - pier + 0.02, 1.9, wd, sm, 2.2); sl.position.set(x + span / 2, deckY - 0.95, 0); g.add(sl);
    }
  }
  const road = box(len + 4, 0.3, wd - 0.4, mat('mud', 0xffffff), 3); road.position.set(0, deckY + 0.15, 0); road.userData.ground = true; road.userData.noOutline = true; g.add(road);
  const parapet = (z) => { const pp = box(len + 4, 1.0, 0.4, sm, 1.5); pp.position.set(0, deckY + 0.5, z); g.add(pp); }; parapet(wd / 2 - 0.2); parapet(-wd / 2 + 0.2);
  if (houses) { seed(51); for (const sd of [-1, 1]) { let x = -len / 2 + 6; while (x < len / 2 - 8) { const hw = 4 + rnd() * 1.4; if (Math.abs(x) < 7 && rnd() < 0.9) { x += 10; continue; } const h = house({ w: hw, d: 3.2, floors: 3 + Math.floor(rnd() * 2), jet: 0.35, chimney: rnd() < 0.6, shop: true }); h.position.set(x + hw / 2, deckY + 0.3, sd * 1.25); h.rotation.y = sd > 0 ? Math.PI : 0; g.add(h); x += hw + 0.05; } } }
  if (gate) { const gt = gatehouse(); gt.position.set(-len / 2 + 9, deckY + 0.3, 0); g.add(gt); g.userData.gate = gt; }
  g.userData.deckY = deckY + 0.3; g.userData.windows = []; g.userData.tops = []; g.children.forEach(h => { if (h.userData.windows && h.userData.top) { g.userData.windows.push(...h.userData.windows); g.userData.tops.push(h.localToWorld ? (h.updateMatrix(), new THREE.Vector3(0, h.userData.top - 0.6, -1.5).applyMatrix4(h.matrix)) : null); } }); shadowAll(g); return bake(g);
}
export function gatehouse({ w = 9, h = 11 } = {}) {
  const g = new THREE.Group(); const sm = mat('stone', 0xc8bfae, { bump: 2.4 });
  for (const sd of [-1, 1]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, h + 2, 16), sm); uvCyl(tw.geometry, 2.0, h + 2); tw.position.set(0, (h + 2) / 2, sd * (w / 2 + 0.6)); g.add(tw); crenel(g, 0, h + 2, sd * (w / 2 + 0.6), 2.0, sm); }
  const body = box(4, h, w, sm, 2); body.position.set(0, h / 2, 0); g.add(body);
  const arch = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 5.2), std(0x120c08)); arch.position.set(2.02, 2.6, 0); arch.rotation.y = Math.PI / 2; arch.userData.noOutline = true; g.add(arch);
  const archTop = new THREE.Mesh(new THREE.CircleGeometry(2.1, 20, 0, Math.PI), std(0x120c08)); archTop.position.set(2.02, 5.2, 0); archTop.rotation.y = Math.PI / 2; archTop.userData.noOutline = true; g.add(archTop);
  for (let z = -w / 2 + 0.5; z <= w / 2; z += 1.0) { const c = box(4, 0.9, 0.55, sm, 1); c.position.set(0, h + 0.45, z); if (Math.round(z) % 2 === 0) g.add(c); }
  g.userData.top = h + 0.9; return shadowAll(g);
}
function crenel(g, x, y, z, r, m) { for (let i = 0; i < 10; i++) { if (i % 2) continue; const a = i / 10 * Math.PI * 2; const c = box(0.6, 0.8, 0.4, m, 1); c.position.set(x + Math.cos(a) * r, y + 0.4, z + Math.sin(a) * r); c.rotation.y = -a; g.add(c); } }
function uvCyl(geo, r, h, s = 2) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * Math.PI * r / s, uv.getY(i) * h / s); uv.needsUpdate = true; }

// city wall gate (Ludgate-style) with two swinging doors; returns doors for animation
export function cityGate() {
  const g = new THREE.Group(); const sm = mat('stone', 0xbfb5a2, { bump: 2.4 });
  const wall = (x, w) => { const b = box(w, 9, 3, sm, 2); b.position.set(x, 4.5, 0); g.add(b); for (let k = -w / 2 + 0.4; k < w / 2; k += 1.2) { const c = box(0.7, 0.9, 3, sm, 1); c.position.set(x + k, 9.45, 0); g.add(c); } };
  wall(-11, 16); wall(11, 16); const top = box(6, 3.4, 3, sm, 2); top.position.set(0, 7.3, 0); g.add(top);
  for (const sx of [-1, 1]) { const tw = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.3, 13, 16), sm); uvCyl(tw.geometry, 2, 13); tw.position.set(sx * 4.6, 6.5, 0.4); g.add(tw); crenel(g, sx * 4.6, 13, 0.4, 2.0, sm); const cap = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3.5, 16), mat('tiles', 0xd09070)); cap.position.set(sx * 4.6, 15.2, 0.4); g.add(cap); }
  const archTop = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.02, 20, 1, false, 0, Math.PI), std(0x0e0a07, { side: THREE.DoubleSide })); archTop.rotation.z = Math.PI / 2; archTop.rotation.y = Math.PI / 2; archTop.position.set(0, 5.5, 0); archTop.userData.noOutline = true;
  const doors = []; for (const sd of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sd * 1.5, 0, 1.52); const d = box(1.5, 5.6, 0.18, mat('planks', 0x8a6a48), 1.4); d.position.set(-sd * 0.75, 2.8, 0); piv.add(d); for (const y of [1.0, 2.6, 4.2]) { const s = box(1.4, 0.12, 0.05, mat('iron', 0xffffff), 0.5); s.position.set(-sd * 0.75, y, 0.12); piv.add(s); } for (let k = 0; k < 10; k++) { const nl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), std(0x222222, { metalness: 0.6 })); nl.position.set(-sd * (0.15 + (k % 5) * 0.28), 1.0 + Math.floor(k / 5) * 1.6, 0.13); piv.add(nl); } g.add(piv); doors.push(piv); }
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(3, 5.6), std(0x0c0805)); dark.position.set(0, 2.8, 1.0); dark.userData.noOutline = true; g.add(dark);
  const hole = box(3, 0.02, 3.2, std(0x0c0805)); hole.position.set(0, 5.6, 0); g.add(hole);
  g.userData.doors = doors; return shadowAll(g);
}

// ---------------- interiors ----------------
export function room(w = 6, h = 3.0, d = 6, o = {}) {
  const g = new THREE.Group(); const pm = mat('plaster', o.wall ?? 0xf0e4c8), wm = mat('wood', 0xffffff);
  const floor = box(w, 0.1, d, o.floor === 'straw' ? new THREE.MeshStandardMaterial({ map: T.straw.map, bumpMap: T.straw.bump, bumpScale: 3, roughness: 1 }) : mat('planks', 0xd8c0a0), 1.4); floor.position.y = -0.05; floor.userData.ground = true; floor.userData.noOutline = true; g.add(floor);
  const wall = (W, x, z, ry) => { const m = box(W, h, 0.2, pm, 1.6); m.position.set(x, h / 2, z); m.rotation.y = ry; g.add(m); return m; };
  g.userData.back = wall(w, 0, -d / 2, 0); wall(d, -w / 2, 0, Math.PI / 2); wall(d, w / 2, 0, -Math.PI / 2);
  const ceil = box(w, 0.12, d, mat('planks', 0x9a7a5a), 1.4); ceil.position.y = h + 0.06; g.add(ceil);
  for (let x = -w / 2 + 0.6; x < w / 2; x += 1.1) { const b = box(0.2, 0.24, d, wm, 1); b.position.set(x, h - 0.12, 0); g.add(b); }
  for (const x of [-w / 2 + 0.12, -w / 4, 0, w / 4, w / 2 - 0.12]) { const p = box(0.18, h, 0.14, wm, 1); p.position.set(x, h / 2, -d / 2 + 0.12); g.add(p); }
  const rail = box(w, 0.16, 0.12, wm, 1); rail.position.set(0, h * 0.45, -d / 2 + 0.12); g.add(rail);
  for (const [x0, y0, x1, y1] of [[-w / 2 + 0.2, h * 0.47, -w / 4, h - 0.2], [w / 4, h - 0.2, w / 2 - 0.2, h * 0.47]]) { const L = Math.hypot(x1 - x0, y1 - y0); const b = box(L, 0.13, 0.1, wm, 1); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, -d / 2 + 0.13); b.rotation.z = Math.atan2(y1 - y0, x1 - x0); g.add(b); }
  return shadowAll(g);
}
export function strawBed() { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ map: T.straw.map, bumpMap: T.straw.bump, bumpScale: 4, roughness: 1, color: 0xe8d8b0 });
  const geo = new THREE.BoxGeometry(2.0, 0.28, 1.0, 20, 4, 10); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y > 0) p.setY(i, y + 0.05 * Math.sin(x * 5) * Math.cos(z * 6) - 0.06 * (x * x / 1.2 + z * z / 0.3) ); p.setX(i, x * (1 - 0.06 * (y < 0 ? 0 : 1))); } geo.computeVertexNormals();
  const mat_ = new THREE.Mesh(geo, m); mat_.position.y = 0.14; mat_.userData.ground = true; g.add(mat_);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 1.04, 10, 1, 6), mat('cloth', 0x8a5a4a)); blanket.position.set(0.35, 0.3, 0); blanket.rotation.z = -0.03; g.add(blanket);
  const pillow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 10), mat('cloth', 0xd8ccb0)); pillow.scale.set(0.9, 0.35, 1.3); pillow.position.set(-0.75, 0.32, 0); g.add(pillow);
  return shadowAll(g); }

// ---------------- props ----------------
export function barrel(s = 1) { const g = new THREE.Group(); const geo = new THREE.CylinderGeometry(0.36, 0.36, 0.9, 24, 8); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = 1 + 0.16 * Math.cos(y / 0.45 * Math.PI / 2); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } geo.computeVertexNormals(); uvCyl(geo, 0.36, 0.9, 0.7);
  const b = new THREE.Mesh(geo, mat('planks', 0xc09060)); b.position.y = 0.45; g.add(b); for (const y of [0.12, 0.32, 0.58, 0.78]) { const k = 1 + 0.16 * Math.cos((y - 0.45) / 0.45 * Math.PI / 2); const r = new THREE.Mesh(new THREE.TorusGeometry(0.365 * k, 0.018, 6, 28), mat('iron', 0xffffff)); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
  const lid = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), mat('planks', 0xa07850)); lid.rotation.x = -Math.PI / 2; lid.position.y = 0.9; g.add(lid); g.scale.setScalar(s); return shadowAll(g); }
export function crate() { const g = new THREE.Group(); const b = box(0.7, 0.55, 0.6, mat('planks', 0xc8a070), 0.8); b.position.y = 0.275; g.add(b); for (const y of [0.06, 0.49]) { const s = box(0.72, 0.07, 0.62, mat('wood', 0xffffff), 0.6); s.position.y = y; g.add(s); } return shadowAll(g); }
export function cart() { const g = new THREE.Group(); const bed = box(1.5, 0.12, 2.6, mat('planks', 0xb08860), 1); bed.position.y = 0.75; g.add(bed); for (const sd of [-1, 1]) { const side = box(0.08, 0.45, 2.6, mat('planks', 0xa07850), 1); side.position.set(sd * 0.72, 1.0, 0); g.add(side); const wh = wheel(0.55); wh.position.set(sd * 0.86, 0.55, 0.2); g.add(wh); g.userData.wheels = (g.userData.wheels || []).concat(wh); } const sh = box(0.08, 0.08, 2.2, mat('wood', 0xffffff), 1); sh.position.set(-0.4, 0.62, 2.2); sh.rotation.x = 0.2; g.add(sh); const sh2 = sh.clone(); sh2.position.x = 0.4; g.add(sh2); return shadowAll(g); }
export function wheel(r = 0.55) { const g = new THREE.Group(); const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 8, 28), mat('wood', 0xffffff)); g.add(rim); const t = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.02, 6, 28), mat('iron', 0xffffff)); g.add(t); for (let i = 0; i < 8; i++) { const sp = box(0.04, r * 2, 0.04, mat('wood', 0xffffff), 1); sp.rotation.z = i * Math.PI / 8; g.add(sp); } const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 12), mat('wood', 0xffffff)); hub.rotation.x = Math.PI / 2; g.add(hub); g.rotation.y = Math.PI / 2; return g; }
export function stall(goods = 'bread') {
  const g = new THREE.Group(); const tb = box(2.4, 0.1, 1.1, mat('planks', 0xc09a70), 1); tb.position.y = 0.9; g.add(tb);
  for (const [x, z] of [[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]]) { const l = box(0.08, 0.9, 0.08, mat('wood', 0xffffff), 1); l.position.set(x, 0.45, z); g.add(l); }
  for (const x of [-1.15, 1.15]) { const p = box(0.08, 2.4, 0.08, mat('wood', 0xffffff), 1); p.position.set(x, 1.2, -0.5); g.add(p); }
  // striped cloth awning (slightly sagging)
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d'); const cols = [['#b8392e', '#efe2c4'], ['#2e5a8a', '#efe2c4'], ['#3a7a3e', '#e8d8a0']][Math.floor(rnd() * 3)]; for (let i = 0; i < 8; i++) { c.fillStyle = cols[i % 2]; c.fillRect(i * 32, 0, 32, 64); } const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const ag = new THREE.PlaneGeometry(2.6, 1.5, 16, 8); const ap = ag.attributes.position; for (let i = 0; i < ap.count; i++) { const x = ap.getX(i), y = ap.getY(i); ap.setZ(i, -0.08 * Math.cos(x / 1.3 * Math.PI / 2) * Math.cos(y / 0.75 * Math.PI / 2)); } ag.computeVertexNormals();
  const aw = new THREE.Mesh(ag, new THREE.MeshStandardMaterial({ map: tx, bumpMap: T.cloth.bump, bumpScale: 2, roughness: 0.95, side: THREE.DoubleSide })); aw.position.set(0, 2.15, 0.1); aw.rotation.x = -Math.PI / 2 + 0.45; g.add(aw);
  const items = new THREE.Group(); g.add(items); items.position.y = 0.95;
  if (goods === 'bread') for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), mat('cloth', 0xc8843e, { bump: 4 })); b.scale.set(1.3, 0.7, 1); b.position.set(-0.9 + (i % 5) * 0.42, 0.1, -0.2 + Math.floor(i / 5) * 0.38); items.add(b); }
  if (goods === 'apples') for (let i = 0; i < 26; i++) { const a = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), std(i % 3 ? 0xb8322a : 0x7aa03a, { roughness: 0.4 })); a.position.set(-1 + (i % 9) * 0.25, 0.08 + Math.floor(i / 18) * 0.12, -0.3 + (Math.floor(i / 9) % 2) * 0.3); items.add(a); }
  if (goods === 'fish') for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), std(0xa8b8c0, { metalness: 0.5, roughness: 0.3 })); f.scale.set(3, 0.6, 1); f.position.set(-0.8 + i * 0.27, 0.05, 0); f.rotation.y = 0.3; items.add(f); }
  g.userData.items = items; return shadowAll(g);
}
export function bucket() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.35, 16, 1, true), mat('planks', 0xb08a60, { side: THREE.DoubleSide })); b.position.y = 0.175; g.add(b); const bt = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), mat('planks', 0x806040)); bt.rotation.x = -Math.PI / 2; bt.position.y = 0.01; g.add(bt); for (const y of [0.06, 0.28]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.17 + y * 0.12, 0.012, 6, 20), mat('iron', 0xffffff)); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); } return shadowAll(g); }
export function haybale() { const g = new THREE.Group(); const b = box(1.0, 0.5, 0.6, mat('thatch', 0xffffff, { bump: 5 }), 0.6); b.position.y = 0.25; g.add(b); return shadowAll(g); }
export function tankard() { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.16, 16), mat('planks', 0xa07850)); c.position.y = 0.08; g.add(c); const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 6, 0, 6.283, 0, 1.2), std(0xfff6e0)); f.position.y = 0.155; g.add(f); const h = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12, Math.PI), mat('planks', 0x806040)); h.position.set(0.07, 0.09, 0); h.rotation.z = -Math.PI / 2; g.add(h); return shadowAll(g); }
export function table(w = 1.8, d = 0.9) { const g = new THREE.Group(); const t = box(w, 0.08, d, mat('planks', 0xc8a078), 1); t.position.y = 0.78; g.add(t); for (const x of [-w / 2 + 0.15, w / 2 - 0.15]) { const tr = box(0.08, 0.74, d * 0.8, mat('wood', 0xffffff), 1); tr.position.set(x, 0.37, 0); g.add(tr); } const st = box(w - 0.3, 0.06, 0.08, mat('wood', 0xffffff), 1); st.position.y = 0.2; g.add(st); return shadowAll(g); }
export function stool() { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 14), mat('planks', 0xb08a60)); s.position.y = 0.45; g.add(s); for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283; const l = box(0.04, 0.46, 0.04, mat('wood', 0xffffff), 1); l.position.set(Math.cos(a) * 0.13, 0.22, Math.sin(a) * 0.13); l.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); g.add(l); } return shadowAll(g); }
export function candle() { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.18, 10), std(0xf0e6c8)); c.position.y = 0.09; g.add(c); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 })); fl.scale.y = 2; fl.position.y = 0.21; fl.userData.noOutline = true; g.add(fl); const l = new THREE.PointLight(0xffa850, 3, 5, 1.6); l.position.y = 0.3; g.add(l); g.userData.light = l; g.userData.flame = fl; return g; }
export function torch() { const g = new THREE.Group(); const s = box(0.06, 0.7, 0.06, mat('wood', 0xffffff), 1); s.position.y = 0.35; g.add(s); const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.14, 8), std(0x2a1a10)); head.position.y = 0.74; g.add(head); const l = new THREE.PointLight(0xff8a30, 10, 10, 1.5); l.position.y = 1.0; l.castShadow = false; g.add(l); g.userData.light = l; g.userData.tip = V(0, 0.82, 0); return g; }
export function bell() { const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new THREE.Vector2(0.15 + 0.55 * Math.pow(t, 1.8) + (t > 0.9 ? (t - 0.9) * 1.2 : 0), -t * 1.0)); } const geo = new THREE.LatheGeometry(pts, 32); const m = new THREE.Mesh(geo, std(0xb08a3a, { metalness: 0.85, roughness: 0.35, side: THREE.DoubleSide })); const g = new THREE.Group(); g.add(m); const cl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), std(0x3a3020, { metalness: 0.7 })); cl.position.y = -0.85; g.add(cl); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12), std(0x6a5020, { metalness: 0.6 })); top.position.y = 0.04; g.add(top); return shadowAll(g); }
export function coin() { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 28), std(0xd0d0d6, { metalness: 0.9, roughness: 0.3, bumpMap: T.iron.bump, bumpScale: 1.5 })); g.add(c); const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = '#c8c8ce'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#6a6a72'; x.lineWidth = 5; x.beginPath(); x.arc(64, 64, 58, 0, 7); x.stroke(); x.beginPath(); x.moveTo(64, 12); x.lineTo(64, 116); x.moveTo(12, 64); x.lineTo(116, 64); x.lineWidth = 9; x.stroke(); for (const [a, b] of [[38, 38], [90, 38], [38, 90], [90, 90]]) { x.beginPath(); x.arc(a, b, 7, 0, 7); x.fillStyle = '#6a6a72'; x.fill(); } const t = new THREE.CanvasTexture(cv); const f = new THREE.Mesh(new THREE.CircleGeometry(0.098, 28), new THREE.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: 3, metalness: 0.85, roughness: 0.32 })); f.rotation.x = -Math.PI / 2; f.position.y = 0.0065; f.userData.noOutline = true; g.add(f); return g; }
export function egg() { const geo = new THREE.SphereGeometry(0.5, 32, 20); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 - 0.18 * (y / 0.5); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); p.setY(i, y * 1.28); } geo.computeVertexNormals(); return new THREE.Mesh(geo, std(0xf2e6d0, { roughness: 0.6, bumpMap: T.plaster.bump, bumpScale: 0.6 })); }
export function gallows() { const g = new THREE.Group(); const wm = mat('wood', 0xffffff); for (const x of [-1.5, 1.5]) { const p = box(0.3, 5, 0.3, wm, 1); p.position.set(x, 2.5, 0); g.add(p); } const b = box(3.6, 0.3, 0.3, wm, 1); b.position.y = 5; g.add(b); const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), std(0xb89a60)); rope.position.set(0, 4.15, 0); g.add(rope); const n = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 16), std(0xb89a60)); n.position.set(0, 3.2, 0); g.add(n); g.userData.rope = [rope, n]; const plat = box(4.4, 0.25, 2.4, mat('planks', 0xa08060), 1.2); plat.position.y = 0.6; g.add(plat); for (const x of [-2, 2]) for (const z of [-1, 1]) { const l = box(0.2, 0.6, 0.2, wm, 1); l.position.set(x, 0.3, z); g.add(l); } return shadowAll(g); }
export function pike(h = 5) { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, h, 6), mat('wood', 0xffffff)); s.position.y = h / 2; g.add(s); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.4, 6), mat('iron', 0xffffff)); tip.position.y = h + 0.2; g.add(tip); return shadowAll(g); }
export function bars(w = 3, h = 3) { const g = new THREE.Group(); const m = mat('iron', 0xffffff); for (let x = -w / 2; x <= w / 2 + 0.01; x += 0.22) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, h, 8), m); b.position.set(x, h / 2, 0); g.add(b); } for (const y of [0.2, h * 0.55, h - 0.1]) { const r = box(w + 0.1, 0.08, 0.08, m, 0.5); r.position.y = y; g.add(r); } return shadowAll(g); }
export function scroll(text = 'STATUTE', w = 1.2, h = 1.6) { const g = new THREE.Group(); const cv = document.createElement('canvas'); cv.width = 384; cv.height = 512; const c = cv.getContext('2d'); c.fillStyle = '#efe0b8'; c.fillRect(0, 0, 384, 512); for (let i = 0; i < 2000; i++) { c.fillStyle = `rgba(120,90,40,${Math.random() * 0.06})`; c.fillRect(Math.random() * 384, Math.random() * 512, 3, 3); } c.fillStyle = '#3a2410'; c.textAlign = 'center'; c.font = '900 40px Georgia'; text.split('\n').forEach((l, i) => c.fillText(l, 192, 70 + i * 48)); c.fillStyle = 'rgba(60,40,20,.55)'; for (let i = 0; i < 9; i++) c.fillRect(40, 200 + i * 28, 300 - (i % 3) * 40, 8); c.fillStyle = '#9a1e1e'; c.beginPath(); c.arc(192, 470, 26, 0, 7); c.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const geo = new THREE.PlaneGeometry(w, h, 12, 1); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.04 * Math.sin(p.getX(i) * 4)); geo.computeVertexNormals(); const pg = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, bumpMap: T.cloth.bump, bumpScale: 1, side: THREE.DoubleSide, roughness: 0.9 })); g.add(pg);
  for (const y of [-h / 2, h / 2]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, w + 0.2, 12), mat('wood', 0xffffff)); r.rotation.z = Math.PI / 2; r.position.y = y; g.add(r); } return g; }
export function throne() { const g = new THREE.Group(); const gm = std(0xc8a040, { metalness: 0.7, roughness: 0.35 }); const seat = box(1.2, 0.5, 1.0, mat('wood', 0xffffff), 1); seat.position.y = 0.5; g.add(seat); const back = box(1.2, 2.2, 0.2, mat('wood', 0xffffff), 1); back.position.set(0, 1.5, -0.45); g.add(back); const cush = box(1.0, 0.12, 0.8, mat('cloth', 0x8a1a2a), 0.6); cush.position.y = 0.8; g.add(cush); const bk = box(0.9, 1.6, 0.05, mat('cloth', 0x8a1a2a), 0.6); bk.position.set(0, 1.6, -0.33); g.add(bk); for (const x of [-0.6, 0.6]) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), gm); p.position.set(x, 2.8, -0.45); g.add(p); } return shadowAll(g); }
export function banner(color = '#b81e2a', w = 1.2, h = 2.6) { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256; const c = cv.getContext('2d'); c.fillStyle = color; c.fillRect(0, 0, 128, 256); c.fillStyle = '#e8c040'; for (let i = 0; i < 3; i++) { const y = 50 + i * 60; c.beginPath(); c.moveTo(30, y); c.lineTo(98, y); c.lineTo(64, y + 40); c.closePath(); c.fill(); } const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const geo = new THREE.PlaneGeometry(w, h, 8, 16); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.06 * Math.sin(p.getY(i) * 3 + p.getX(i))); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, bumpMap: T.cloth.bump, bumpScale: 2, side: THREE.DoubleSide, roughness: 0.9 })); return m; }
export function boat() { const g = new THREE.Group(); const s = new THREE.Shape(); s.moveTo(0, -2.2); s.quadraticCurveTo(1.1, -1.2, 0.9, 0.8); s.lineTo(0.7, 2.0); s.lineTo(-0.7, 2.0); s.lineTo(-0.9, 0.8); s.quadraticCurveTo(-1.1, -1.2, 0, -2.2); const geo = new THREE.ExtrudeGeometry(s, { depth: 0.7, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 }); geo.rotateX(Math.PI / 2); uvPlane(geo, 1, 1, 1); const h = new THREE.Mesh(geo, mat('planks', 0x9a7450)); h.position.y = 0.45; g.add(h); const sm = box(1.6, 0.06, 0.3, mat('wood', 0xffffff), 1); sm.position.set(0, 0.5, 0); g.add(sm); return shadowAll(g); }
export function cog() { // merchant ship (cog) with mast + furled sail
  const g = new THREE.Group(); const s = new THREE.Shape(); s.moveTo(0, -7); s.quadraticCurveTo(3.2, -4, 3, 1); s.lineTo(2.6, 6); s.lineTo(-2.6, 6); s.lineTo(-3, 1); s.quadraticCurveTo(-3.2, -4, 0, -7); const geo = new THREE.ExtrudeGeometry(s, { depth: 3.4, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.2, bevelSegments: 2 }); geo.rotateX(Math.PI / 2); uvPlane(geo, 1 / 2, 1 / 2, 1); const h = new THREE.Mesh(geo, mat('planks', 0x8a6444)); h.position.y = 2.6; g.add(h);
  const cas = box(5, 2, 3, mat('planks', 0x9a7450), 1.2); cas.position.set(0, 3.4, 4.2); g.add(cas); const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 14, 10), mat('wood', 0xffffff)); mast.position.y = 9; g.add(mast); const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 7, 8), mat('wood', 0xffffff)); yard.rotation.z = Math.PI / 2; yard.position.y = 13.5; g.add(yard);
  const sail = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 6.6, 12), mat('cloth', 0xe8dcc0)); sail.rotation.z = Math.PI / 2; sail.position.y = 13.1; g.add(sail); return shadowAll(g); }

// ---------------- living detail: rat, flea, chickens ----------------
export function rat(s = 1) { const g = new THREE.Group(); const fur = std(0x5a5048, { roughness: 1, bumpMap: T.cloth.bump, bumpScale: 3 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), fur); body.scale.set(1, 0.8, 1.7); body.position.y = 0.1; g.add(body);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 12), fur); head.rotation.x = Math.PI / 2; head.position.set(0, 0.11, 0.27); g.add(head);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), std(0xd88a9a)); nose.position.set(0, 0.11, 0.37); g.add(nose);
  for (const sd of [-1, 1]) { const ear = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), std(0xd89aa0, { side: THREE.DoubleSide })); ear.position.set(sd * 0.05, 0.18, 0.2); ear.rotation.y = sd * 0.5; g.add(ear); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), std(0x050505, { roughness: 0.1 })); eye.position.set(sd * 0.04, 0.14, 0.29); g.add(eye); }
  const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0.08, -0.18), V(0.05, 0.04, -0.35), V(-0.06, 0.02, -0.5), V(0.03, 0.02, -0.65)]), 16, 0.012, 6), std(0xd8a0a0)); g.add(tail); g.userData.tail = tail;
  const legs = []; for (const [x, z] of [[-0.07, 0.12], [0.07, 0.12], [-0.07, -0.1], [0.07, -0.1]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.06, 6), std(0xd8a0a0)); l.position.set(x, 0.03, z); g.add(l); legs.push(l); } g.userData.legs = legs;
  g.scale.setScalar(s); return shadowAll(g); }
export function flea() { // stylised macro flea: segmented glossy body, long jumping legs, bristles
  const g = new THREE.Group(); const shell = std(0x6a3418, { roughness: 0.28, metalness: 0.15, bumpMap: T.iron.bump, bumpScale: 1.5 });
  const segs = []; for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.5 - Math.abs(i - 2.2) * 0.06, 24, 16), shell); s.scale.set(0.55, 1.0, 0.42); s.position.set(-0.3 + i * 0.18, 0.75 + Math.sin(i / 5 * Math.PI) * 0.12, 0); g.add(s); segs.push(s); }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), shell); head.scale.set(1.1, 0.9, 0.7); head.position.set(-0.62, 0.72, 0); g.add(head);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), std(0x111111, { roughness: 0.1 })); eye.position.set(-0.75, 0.82, 0.16); g.add(eye); const eye2 = eye.clone(); eye2.position.z = -0.16; g.add(eye2);
  const leg = (x, len, z, ang) => { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, len, 8), shell); const p = new THREE.Group(); a.position.y = -len / 2; p.add(a); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.02, len * 1.1, 8), shell); const p2 = new THREE.Group(); p2.position.y = -len; b.position.y = -len * 0.55; p2.add(b); p.add(p2); p.position.set(x, 0.6, z); p.rotation.z = ang; p2.rotation.z = -ang * 2.2; g.add(p); return p; };
  const L = []; for (const z of [0.18, -0.18]) { L.push(leg(-0.4, 0.4, z, -0.6)); L.push(leg(-0.05, 0.45, z, -0.2)); L.push(leg(0.35, 0.65, z, 0.9)); }
  const br = new THREE.Group(); for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.002, 0.18, 4), std(0x2a1408)); const s = segs[i % 6]; b.position.copy(s.position).add(V((Math.random() - 0.5) * 0.2, 0.42, (Math.random() - 0.5) * 0.3)); b.rotation.z = 0.8 + Math.random() * 0.4; br.add(b); } br.traverse(o => o.userData.noOutline = true); g.add(br);
  g.userData.legs = L; return shadowAll(g); }
export function chicken() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), std(0xf0ece0)); b.scale.set(1, 0.85, 1.3); b.position.y = 0.25; g.add(b); const h = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), std(0xf0ece0)); h.position.set(0, 0.42, 0.16); g.add(h); const cm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.08), std(0xd02020)); cm.position.set(0, 0.5, 0.17); g.add(cm); const bk = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), std(0xe0a020)); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.41, 0.25); g.add(bk); const tl = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 8), std(0xe8e4d8)); tl.position.set(0, 0.35, -0.2); tl.rotation.x = -0.8; g.add(tl); for (const x of [-0.05, 0.05]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 4), std(0xe0a020)); l.position.set(x, 0.07, 0); g.add(l); } return shadowAll(g); }
export function shroud(len = 1.75) { const geo = new THREE.CapsuleGeometry(0.22, len - 0.44, 6, 14); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) * (1 + 0.08 * Math.sin(y * 9))); p.setZ(i, p.getZ(i) * 0.7); } geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat('cloth', 0xe0d6c0, { bump: 3 })); m.rotation.z = Math.PI / 2; m.castShadow = m.receiveShadow = true; const g = new THREE.Group(); g.add(m); for (const x of [-0.5, 0.1, 0.6]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 6, 16), std(0x8a7a5a)); t.rotation.y = Math.PI / 2; t.position.x = x; t.scale.z = 0.7; g.add(t); } return g; }

// inverted-hull ink outline (Ricks Clips look)
const OUT = {};
export function outline(root, th = 0.02) {
  const key = th.toFixed(4); const m = OUT[key] || (OUT[key] = new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { th: { value: th } },
    vertexShader: 'uniform float th; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vec3 n = normalize(normalMatrix*normal); mv.xyz += n*th*(-mv.z)*0.6; gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(0.07,0.06,0.05,1.); }' }));
  const list = []; root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !o.userData.noOutline && !o.userData.isOutline && o.geometry && o.geometry.attributes.normal && !(o.material && (o.material.transparent || o.material.displacementMap))) list.push(o); });
  for (const o of list) { const mm = new THREE.Mesh(o.geometry, m); mm.userData.isOutline = true; mm.userData.noOutline = true; mm.raycast = () => {}; mm.castShadow = false; o.add(mm); }
  return root;
}

// merge all static meshes under root into one mesh per material (keeps look, slashes draw calls)
export function bake(root) {
  root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(); const groups = new Map(); const kill = [];
  const walk = (o, f) => { f(o); for (const c of o.children) if (!c.userData.baked) walk(c, f); };
  walk(root, o => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.keep || Array.isArray(o.material) || !o.geometry.attributes.uv || !o.geometry.attributes.normal) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const key = o.material.uuid + (o.userData.noOutline ? 'n' : '') + (o.userData.ground ? 'g' : ''); if (!groups.has(key)) groups.set(key, { m: o.material, gs: [], noOutline: o.userData.noOutline, ground: o.userData.ground, cs: o.castShadow }); groups.get(key).gs.push(g); kill.push(o);
  });
  kill.forEach(o => { o.parent.remove(o); });
  const prune = (o) => { if (o.userData.baked) return; [...o.children].forEach(prune); if (!o.isMesh && o !== root && o.children.length === 0 && !o.isLight) o.parent.remove(o); }; prune(root);
  for (const { m, gs, noOutline, ground, cs } of groups.values()) { const geo = mergeGeometries(gs, false); if (!geo) continue; const mm = new THREE.Mesh(geo, m); mm.castShadow = cs; mm.receiveShadow = true; mm.userData.noOutline = noOutline; mm.userData.ground = ground; root.add(mm); }
  root.userData.baked = true; return root;
}
