// Char3D — volumetric version of the ARCHIVE404 stickman (same face, hair, jacket and Mixamo clips as chars.js),
// for top-down / side / high-angle shots where a 2D billboard would look flat. Drop-in for Char in main.js (mk3).
import * as THREE from 'three';
import { MOCAP } from './mocap.js';
import { face } from './chars.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const INK = 0x141414;
// proportions (fractions of height) taken from chars.js base space (BH = 1024, GROUND = 1010)
const P = { hip: 0.418, ul: 214 / 1024, ll: 214 / 1024, ua: 148 / 1024, fa: 134 / 1024, bodyBot: 0.40 - 0.418, bodyTop: 0.655 - 0.418, sh: 0.62 - 0.418, shX: 0.062, hipX: 0.03, headY: 0.756 - 0.418, headR: 0.117, bodyR: 0.073 };
const UP = V(0, 1, 0), DOWN = V(0, -1, 0);
function tube(r, m) { const g = new THREE.CylinderGeometry(r, r, 1, 14, 1); g.translate(0, 0.5, 0); const ms = new THREE.Mesh(g, m); ms.castShadow = true; return ms; }
function place(ms, a, b) { const d = b.clone().sub(a); const L = d.length(); ms.position.copy(a); ms.scale.set(1, Math.max(1e-4, L), 1); if (L > 1e-6) ms.quaternion.setFromUnitVectors(UP, d.normalize()); }
export class Char3D {
  constructor(o = {}) {
    this.o = Object.assign({ hat: 'none', jacket: '#2e8b7a', expr: 'neutral', skin: '#ffffff', height: 1.75, pose: 'stand', arms: 'down', extras: [] }, o);
    const h = this.o.height; this.h = h; this.is3D = true; this.ground = true; this.noBill = true;
    this.group = new THREE.Group(); this.root = new THREE.Group(); this.group.add(this.root); this.torso = new THREE.Group(); this.root.add(this.torso);
    const ink = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.55 }); const jk = new THREE.Color(this.o.jacket); const jm = new THREE.MeshStandardMaterial({ color: jk, roughness: 0.75 });
    const skin = new THREE.MeshStandardMaterial({ color: new THREE.Color(this.o.skin), roughness: 0.55 }); this.mats = [ink, jm, skin];
    // torso: rounded jacket, buttons, number patch
    const br = P.bodyR * h, bl = (P.bodyTop - P.bodyBot) * h; const body = new THREE.Mesh(new THREE.CapsuleGeometry(br, Math.max(0.01, bl - 2 * br), 8, 20), jm); body.scale.z = 0.72; body.position.y = (P.bodyBot * h + P.bodyTop * h) / 2; body.castShadow = true; this.torso.add(body);
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.0075 * h, 8, 6), ink); b.position.set(0, P.bodyTop * h - 0.06 * h - i * 0.045 * h, br * 0.72 - 0.002); this.torso.add(b); }
    if (this.o.extras.includes('inmateNo')) { const cv = document.createElement('canvas'); cv.width = 160; cv.height = 96; const c = cv.getContext('2d'); c.fillStyle = '#f6f4ec'; c.strokeStyle = '#111'; c.lineWidth = 8; c.beginPath(); c.roundRect(6, 6, 148, 84, 12); c.fill(); c.stroke(); c.fillStyle = '#111'; c.font = '900 56px Nunito, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(this.o.inmateNo || '1441', 80, 51);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const pt = new THREE.Mesh(new THREE.PlaneGeometry(0.075 * h, 0.045 * h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })); pt.position.set(0.035 * h, P.bodyTop * h - 0.075 * h, br * 0.72 * 0.93); pt.rotation.y = 0.32; this.torso.add(pt); }
    if (this.o.extras.includes('holster') || this.o.belt) { const belt = new THREE.Mesh(new THREE.TorusGeometry(br * 0.98, 0.012 * h, 6, 24), ink); belt.rotation.x = Math.PI / 2; belt.scale.y = 0.72; belt.position.y = P.bodyBot * h + 0.05 * h; this.torso.add(belt); }
    if (this.o.extras.includes('apron')) { const ap = new THREE.Mesh(new THREE.CylinderGeometry(br * 1.02, br * 1.1, bl * 0.6, 20, 1, true, -1.2, 2.4), new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.9, side: THREE.DoubleSide })); ap.scale.z = 0.74; ap.position.y = P.bodyBot * h + bl * 0.32; ap.rotation.y = Math.PI / 2 - 1.57 + 1.57; this.torso.add(ap); }
    // head with the 2D face painted on its front, hair / officer cap
    this.head = new THREE.Group(); this.head.position.y = P.headY * h; this.torso.add(this.head); const R = P.headR * h; this.R = R;
    const hs = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), skin); hs.scale.y = 1.02; hs.castShadow = true; this.head.add(hs);
    this.fcv = document.createElement('canvas'); this.fcv.width = 512; this.fcv.height = 427; this.ftex = new THREE.CanvasTexture(this.fcv); this.ftex.colorSpace = THREE.SRGBColorSpace; this.ftex.anisotropy = 8;
    const fg = new THREE.SphereGeometry(R * 1.004, 48, 32, Math.PI / 2 - 1.047, 2.094, Math.PI / 2 - 0.873, 1.745); const fm = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: this.ftex, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    fm.scale.y = 1.02; fm.userData.noOutline = true; fm.renderOrder = 2; this.head.add(fm); this._expr = null;
    const hc = new THREE.Color(this.o.hatColor || '#2a1a10');
    if (this.o.hat === 'hair') { const hm = new THREE.MeshStandardMaterial({ color: hc, roughness: 0.8 }); const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), hm); cap.rotation.x = -0.32; cap.position.set(0, R * 0.04, -R * 0.06); cap.castShadow = true; this.head.add(cap);
      for (let i = -3; i <= 3; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(R * 0.16, R * 0.34, 8), hm); const a = i * 0.24; sp.position.set(Math.sin(a) * R * 0.86, R * 0.42, Math.cos(a) * R * 0.66); sp.rotation.set(2.3, a, 0); this.head.add(sp); }
      for (const sd of [-1, 1]) { const sb = new THREE.Mesh(new THREE.SphereGeometry(R * 0.32, 12, 10), hm); sb.scale.set(0.45, 1.0, 0.8); sb.position.set(sd * R * 0.9, R * 0.12, -R * 0.12); this.head.add(sb); } }
    else if (this.o.hat === 'officer') { const nv = new THREE.MeshStandardMaterial({ color: 0x1b2a4a, roughness: 0.6 }); const cr = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.98, R * 0.88, R * 0.45, 28), nv); cr.position.y = R * 0.72; cr.rotation.x = -0.12; cr.castShadow = true; this.head.add(cr); const top = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.05, R * 0.98, R * 0.1, 28), nv); top.position.set(0, R * 0.96, -R * 0.03); top.rotation.x = -0.12; this.head.add(top);
      const vis = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.7, R * 0.7, R * 0.05, 24, 1, false, -1.2, 2.4), ink); vis.position.set(0, R * 0.52, R * 0.42); vis.rotation.x = 0.25; vis.scale.z = 1.0; this.head.add(vis); const badge = new THREE.Mesh(new THREE.SphereGeometry(R * 0.09, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd8b040, metalness: 0.8, roughness: 0.3 })); badge.position.set(0, R * 0.8, R * 0.9); badge.scale.z = 0.4; this.head.add(badge); }
    // limbs (positions solved every frame), hands, feet, sleeves
    const lr = 0.0095 * h; this.limbs = {}; const add = (k, m, r) => { const t = tube(r, m); this.root.add(t); this.limbs[k] = t; return t; };
    for (const s of ['L', 'R']) { add('th' + s, ink, lr); add('sh' + s, ink, lr); add('ua' + s, ink, lr); add('fa' + s, ink, lr); if (this.o.sleeves || this.o.hat === 'officer') add('sl' + s, jm, 0.024 * h);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.017 * h, 12, 10), ink); hand.castShadow = true; this.root.add(hand); this.limbs['hd' + s] = hand;
      const ft = new THREE.Mesh(new THREE.SphereGeometry(0.03 * h, 14, 10), ink); ft.scale.set(0.75, 0.45, 1.35); ft.castShadow = true; this.root.add(ft); this.limbs['ft' + s] = ft; }
    // contact shadow
    const sc = document.createElement('canvas'); sc.width = sc.height = 128; const g = sc.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.42 * h, 0.42 * h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })); this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.004; this.shadow.userData.noOutline = true; this.group.add(this.shadow);
    this.hands = [V(0, 0, 0), V(0, 0, 0)]; this.ik = [null, null];
    // compatibility with main.js (dispose loop / resolve)
    this.tex = { dispose() {} }; this.mesh = { material: { dispose() {} } };
  }
  set(s) { Object.assign(this.o, s); return this; }
  resolve() {}
  reach(i, worldP) { this.ik[i] = worldP ? worldP.clone() : null; return this; } // i: 0 = left hand (screen-left in front view), 1 = right
  handW(i = 1) { this.root.updateMatrixWorld(); return this.hands[Math.min(i, 1)].clone().applyMatrix4(this.root.matrixWorld); }
  _face(e, t) { if (e === this._expr && e !== 'worried') return; this._expr = e; const c = this.fcv.getContext('2d'); c.clearRect(0, 0, 512, 427); const r = 244, cx = 256, cy = 213; c.fillStyle = 'rgba(255,140,130,.18)'; for (const sd of [-1, 1]) { c.beginPath(); c.ellipse(cx + sd * r * 0.55, cy + r * 0.25, r * 0.17, r * 0.1, 0, 0, 7); c.fill(); } face(c, cx, cy, r, e, t); this.ftex.needsUpdate = true; }
  draw(t) {
    const o = this.o, h = this.h, tt = t + (o.seed || 0); this._face(o.expr, tt);
    const AUTO = { run: 'run', walk: 'walk', stand: 'idle' }; const clip = o.mocap === false ? null : (o.mocap || AUTO[o.pose] || null); const CL = clip && MOCAP[clip]; let MO = null;
    if (CL) { const n = CL.frames.length, fi = Math.floor((t - (o.mocapStart || 0)) * CL.fps * (o.mocapSpeed || 1) + (o.seed || 0) * 7); MO = CL.frames[o.mocapLoop === false ? Math.max(0, Math.min(n - 1, fi)) : ((fi % n) + n) % n]; }
    const UL = P.ul * h, LL = P.ll * h, UA = P.ua * h * (o.armK ?? 1), FA = P.fa * h * (o.armK ?? 1);
    // legs in the sagittal plane (forward = +z)
    let legs, hipY = P.hip * h, lean = 0, roll = 0;
    const legPts = (a, kb, sd) => { const hp = V(sd * P.hipX * h, 0, 0); const kn = hp.clone().add(V(0, -Math.cos(a), Math.sin(a)).multiplyScalar(UL)); const fo = kn.clone().add(V(0, -Math.cos(a - kb), Math.sin(a - kb)).multiplyScalar(LL)); return [hp, kn, fo]; };
    if (o.pose === 'sit') { const fl = o.sitFloor; legs = [legPts(fl ? 1.62 : 1.45, fl ? 0.35 : 1.45, -1), legPts(fl ? 1.62 : 1.45, fl ? 0.35 : 1.45, 1)]; legs.forEach(L => { L[1].x *= 1.6; L[2].x *= 1.7; }); }
    else if (o.pose === 'swim' || o.bust) legs = null;
    else if (MO) { const amp = o.mocapAmp ?? 1.0; legs = [legPts(MO.R[0] * amp, MO.R[1], -1), legPts(MO.L[0] * amp, MO.L[1], 1)]; lean = MO.lean * (o.leanK ?? 1); roll = (MO.roll || 0) * 0.5; }
    else { const mv = o.pose === 'walk' || o.pose === 'run'; const ph = tt * (o.pose === 'run' ? 11 : 7); const amp = o.pose === 'run' ? 0.62 : mv ? 0.42 : 0;
      legs = [0, 1].map(i => { const s = Math.sin(ph + i * Math.PI); const kb = mv ? Math.max(0, -Math.cos(ph + i * Math.PI)) * (o.pose === 'run' ? 1.2 : 0.7) : 0; return legPts(amp * s * 0.9, kb, i ? 1 : -1); }); }
    if (o.lean != null) lean = o.lean;
    let low = 0; if (legs) low = Math.min(legs[0][2].y, legs[1][2].y); let yOff = legs ? -low + 0.03 * h * 0.45 : 0.05 * h; if (o.pose === 'sit' && o.sitFloor) yOff = 0.07 * h; if (o.hipY != null) yOff = o.hipY; this.root.position.y = yOff; this.root.rotation.z = -roll;
    this.torso.rotation.x = lean; const breath = Math.sin(tt * 2.1) * 0.003 * h; this.torso.position.y = breath + (o.pose === 'sit' ? 0 : 0);
    this.head.rotation.set(-lean * 0.4 + (o.headPitch || 0), o.headYaw || 0, (MO ? -MO.tilt * 0.5 : 0) + (o.extras.includes('shiver') ? Math.sin(tt * 55) * 0.03 : 0));
    // arms: angle from straight down + elbow flex, in a plane between sideways (0) and forward (1)
    const A = o.armsOverride ? o.armsOverride : (MO && o.mocapArms !== false && o.mocap) ? [[MO.RA[0], MO.RA[1]], [MO.LA[0], MO.LA[1]]] : [[0.18 + Math.sin(tt * 2) * 0.03, -0.25], [0.18 + Math.cos(tt * 2) * 0.03, -0.25]];
    const plane = o.armPlane ?? (o.armsOverride ? 0 : 0.55);
    this.torso.updateMatrix(); const tM = this.torso.matrix;
    for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; const S = V(sd * P.shX * h, P.sh * h, 0).applyMatrix4(tM); let E, Hn;
      const tgt = this.ik[i] ? this.root.worldToLocal(this.ik[i].clone()) : null;
      if (tgt) { const d = tgt.clone().sub(S); const L = Math.min(d.length(), (UA + FA) * 0.999); const dn = d.clone().normalize(); const ca = (UA * UA + L * L - FA * FA) / (2 * UA * L); const a = Math.acos(Math.max(-1, Math.min(1, ca)));
        let pole = V(sd * 0.6, -1, -0.4).normalize(); pole.sub(dn.clone().multiplyScalar(pole.dot(dn))).normalize(); E = S.clone().add(dn.clone().multiplyScalar(Math.cos(a) * UA)).add(pole.multiplyScalar(Math.sin(a) * UA)); Hn = S.clone().add(dn.multiplyScalar(L)); }
      else { const [ang, bend] = A[i]; const lat = V(sd * (1 - plane), 0, plane).normalize(); const dirA = DOWN.clone().multiplyScalar(Math.cos(ang)).add(lat.clone().multiplyScalar(Math.sin(ang))); const ab = ang + bend * -1 * -1; const ang2 = ang + bend;
        const dirF = DOWN.clone().multiplyScalar(Math.cos(ang2)).add(lat.clone().multiplyScalar(Math.sin(ang2))); const tw = (o.foreFwd ?? 0.25) * Math.abs(bend); dirF.add(V(0, 0, tw)).normalize();
        E = S.clone().add(dirA.applyAxisAngle(V(1, 0, 0), lean).multiplyScalar(UA)); Hn = E.clone().add(dirF.applyAxisAngle(V(1, 0, 0), lean).multiplyScalar(FA)); }
      const k = i ? 'R' : 'L'; place(this.limbs['ua' + k], S, E); place(this.limbs['fa' + k], E, Hn); this.limbs['hd' + k].position.copy(Hn); this.hands[i].copy(Hn);
      if (this.limbs['sl' + k]) place(this.limbs['sl' + k], S.clone().add(E.clone().sub(S).multiplyScalar(-0.12)), S.clone().lerp(E, 0.48)); }
    for (const k of ['L', 'R']) { const vis = !!legs; ['th', 'sh', 'ft'].forEach(p => this.limbs[p + k].visible = vis); }
    if (legs) legs.forEach((L, i) => { const k = i ? 'R' : 'L'; place(this.limbs['th' + k], L[0], L[1]); place(this.limbs['sh' + k], L[1], L[2]); this.limbs['ft' + k].position.copy(L[2]).add(V(0, 0.01 * h, 0.022 * h)); });
    this.shadow.visible = this.ground !== false && !!legs;
  }
}
