import * as THREE from 'three';
let _rs = 1; Math.random = () => { _rs = (_rs * 16807) % 2147483647; return (_rs - 1) / 2147483646; };
import { Char } from './chars.js';
import { Char3D } from './chars3d.js';
import * as W from './world.js';
import * as R from './rome.js';
import { Post } from './post.js';
import { FX, Puffs, fall, motes, puffPlume, setGLH, tx } from './fx.js';
import * as E from './everest.js';
import * as A from './alcatraz.js';

const WIDTH = 1080, HEIGHT = 1920, SS = 2, GLW = WIDTH * SS, GLH = HEIGHT * SS; setGLH(GLH);
const gl = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
gl.setSize(GLW, GLH, false); gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFShadowMap; gl.localClippingEnabled = true;
gl.toneMapping = THREE.NoToneMapping;
const out = document.getElementById('out'); const octx = out.getContext('2d');
const POST = new Post(gl, GLW, GLH); const PMREM = new THREE.PMREMGenerator(gl);

let WORDS = []; const norm = s => s.toLowerCase().replace(/[^a-z0-9']/g, ''); let cursor = 0;
function find(phrase) { const toks = phrase.split(' ').map(norm); for (let i = cursor; i < WORDS.length; i++) { let ok = true; for (let k = 0; k < toks.length; k++) { if (!WORDS[i + k] || norm(WORDS[i + k].w) !== toks[k]) { ok = false; break; } } if (ok) { cursor = i + 1; return i; } } console.warn('anchor not found', phrase); return -1; }
const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, easeOut = x => 1 - Math.pow(1 - x, 3), easeIn = x => x * x * x;
const clamp01 = x => Math.max(0, Math.min(1, x)), lerp = (a, b, k) => a + (b - a) * k; const V = (x, y, z) => new THREE.Vector3(x, y, z);
function camMove(cam, k, p0, p1, l0, l1, fov0, fov1) { const e = ease(clamp01(k)); cam.position.lerpVectors(p0, p1 || p0, e); cam.lookAt(new THREE.Vector3().lerpVectors(l0, l1 || l0, e)); if (fov0) { cam.fov = lerp(fov0, fov1 || fov0, e); cam.updateProjectionMatrix(); } }
function shake(cam, amt, t) { cam.position.x += Math.sin(t * 61) * amt + Math.sin(t * 23) * amt * 0.5; cam.position.y += Math.sin(t * 47 + 1) * amt; cam.rotation.z += Math.sin(t * 39) * amt * 0.25; }
function handheld(cam, amt, t) { cam.rotation.z += Math.sin(t * 1.3) * amt * 0.5; cam.rotation.x += Math.sin(t * 0.9 + 1) * amt * 0.4; cam.rotation.y += Math.sin(t * 0.7 + 2) * amt * 0.4; }
function persp(fov = 55, near = 0.1, far = 30000) { return new THREE.PerspectiveCamera(fov, WIDTH / HEIGHT, near, far); }
const chars = []; const AUTO = [];
function mk3(par, o, pos, rotY = 0) { const c = new Char3D(o); c.group.position.copy(pos); c.group.rotation.y = rotY; par.add(c.group); chars.push(c); return c; }
function mk(par, o, pos, rotY = 0) { const c = new Char(o); if (o.bust) c.ground = false; c.group.position.copy(pos); c.group.rotation.y = rotY; par.add(c.group); chars.push(c); return c; }
const SHOTS = []; const shot = (anchor, build, lead = 0) => SHOTS.push({ anchor, build, lead });
const CLOCKS = []; const clock = (anchor, text, lead = 0) => CLOCKS.push({ anchor, text, lead });
const STAMPS = []; const stamp = (anchor, text, dur = 1.6, color = '#ffffff', y = 620) => STAMPS.push({ anchor, text, dur, color, y });
function bursts(fx, list, t) { fx.a.fill(0); let k = 0;
  for (const b of list) { const n = b.n ?? 20, life = b.life ?? 0.5, sp = b.sp ?? 3; const dt = t - b.t0; if (dt < 0 || dt > life) { k += n; continue; }
    for (let j = 0; j < n && k < fx.n; j++, k++) { const R_ = fx.R[k]; const vx = (R_[0] - 0.5) * 2 * sp + (b.dir ?? 0) * sp, vy = (R_[1] * (b.up ?? 1.2) + 0.15) * sp, vz = (R_[2] - 0.5) * sp;
      const y = Math.max(b.floor ?? -999, b.p.y + vy * dt - 4.9 * (b.g ?? 1) * dt * dt); fx.set(k, b.p.x + vx * dt, y, b.p.z + vz * dt, (1 - dt / life) * (b.a ?? 1), (b.size ?? 0.03) * (0.5 + R_[3])); } }
  fx.commit(); }
function wt(w, after = 0) { const n = norm(w); for (const x of WORDS) if (norm(x.w) === n && x.s >= after) return x.s; return 1e9; }

import { mat } from './tex.js';
// =====================================================================
//  ALCATRAZ · 1962 — "Would you have tried?"  (Morris & the Anglin brothers)
// =====================================================================
const YOU = { hat: 'hair', hatColor: '#5a3a24', jacket: '#9cbbe0', sleeves: true, noButtons: false, extras: ['inmateNo'], inmateNo: '1441', expr: 'serious', seed: 0 };
const JOHN = { ...YOU, hatColor: '#c89a58', inmateNo: '1476', seed: 3.1 }, CLAR = { ...YOU, hatColor: '#8a6038', inmateNo: '1485', seed: 5.3 };
const INM = (i) => ({ ...YOU, hatColor: ['#2a1e14', '#7a5a3a', '#c8a060', '#4a3a2a', '#1a1a1a'][i % 5], jacket: ['#9cbbe0', '#a8c4e4', '#90b0d8'][i % 3], inmateNo: String(1300 + i * 37), seed: 7 + i * 1.9, expr: 'neutral' });
const GUARD = { hat: 'officer', hatColor: '#2a3040', jacket: '#3a4252', extras: ['holster'], belt: true, expr: 'serious', seed: 9 };
const AB = (k) => 1 - Math.pow(1 - clamp01(k), 2);

function bayScene(mode, o = {}) { const scene = new THREE.Scene(); const sky = E.skyE(scene, mode, o.sunDir ?? V(-0.4, 0.25, -0.6)); const sun = R.lights(scene, mode, o.ext ?? 40);
  const sd = (o.sunDir ?? V(-0.4, 0.25, -0.6)).clone().normalize(); sun.userData.off = sd.multiplyScalar(90); sun.position.copy(sun.userData.off); sun.shadow.mapSize.set(4096, 4096); sun.shadow.camera.far = 400; sun.shadow.bias = -0.0004;
  if (o.fd != null) scene.fog.density = o.fd; scene.userData.expo = o.expo ?? 1.0; scene.userData.sat = o.sat ?? 1.05; scene.userData.warm = o.warm ?? -0.05; scene.add(new THREE.AmbientLight(o.ambC ?? 0x9ab0e0, o.amb ?? 0.25));
  sun.follow = (p) => { sun.target.position.copy(p); sun.position.copy(p).add(sun.userData.off); }; return { scene, sun, sky }; }
// interior night: dark blue fill + optional warm practicals
function nightRoom(o = {}) { const scene = new THREE.Scene(); scene.background = new THREE.Color(o.bg ?? 0x05070c); scene.fog = new THREE.FogExp2(o.fog ?? 0x0a0e16, o.fd ?? 0.04);
  scene.add(new THREE.HemisphereLight(o.hemiT ?? 0x6a80b0, o.hemiB ?? 0x0a0a10, o.hemi ?? 0.35)); scene.userData.expo = o.expo ?? 1.05; scene.userData.sat = o.sat ?? 1.05; scene.userData.warm = o.warm ?? 0.0; return scene; }
function seaGroup(scene, col, amp = 0.35, size = 9000, o = {}) { const sea = new R.Sea(scene, size, 200, col); sea.amp = amp; const m = sea.mesh.material; m.envMapIntensity = o.env ?? 0.35; m.roughness = o.rough ?? 0.3; m.userData.hazeC.value.setHex(o.hz ?? 0x101a28); m.userData.haze.value = o.hza ?? 0.12; m.normalScale.set(o.ns ?? 0.3, o.ns ?? 0.3); return sea; }
function labelTex(txt, col = '#ffd23f') { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const c = cv.getContext('2d'); c.font = '900 110px Nunito'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 22; c.strokeStyle = '#111'; c.strokeText(txt, 256, 84); c.fillStyle = col; c.fillText(txt, 256, 84); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
function measure(len, txt, col = '#ffd23f') { // arrow line + label lying on the floor
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false }); const ln = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.035), m); g.add(ln);
  for (const sd of [-1, 1]) { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-0.11, 0.06); s.lineTo(-0.11, -0.06); s.closePath(); const h = new THREE.Mesh(new THREE.ShapeGeometry(s), m); h.position.x = sd * len / 2; h.rotation.z = sd > 0 ? 0 : Math.PI; g.add(h); }
  const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.28), new THREE.MeshBasicMaterial({ map: labelTex(txt, col), transparent: true, depthWrite: false })); lb.position.y = 0.22; g.add(lb);
  g.traverse(o => { o.userData.noOutline = true; o.renderOrder = 5; }); g.userData.mat = [m, lb.material]; return g; }

// ============ 1. Alcatraz. 1962. — drone over the night bay toward the Rock, lighthouse sweeping, SF lights behind ============
shot(null, (S) => {
  const { scene, sun } = bayScene('bayNight', { sunDir: V(0.3, 0.35, -0.8), expo: 1.1, sat: 1.1, amb: 0.35, fd: 0.0012 });
  const sea = seaGroup(scene, 0x06101c, 0.5, 9000, { env: 0.3, hz: 0x0a1424 }); const isl = A.island({ s: 1 }); scene.add(isl);
  const sf = A.skyline({ s: 1.6, n: 180, night: true }); sf.position.set(200, -2, -2300); scene.add(sf);
  const gg = A.goldenGate({ s: 1 }); gg.position.set(-2600, 0, -900); gg.rotation.y = 0.5; scene.add(gg); E.stars(scene, 2200);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4f0e0, fog: false })); moon.position.set(900, 1300, -4200); moon.userData.noOutline = true; scene.add(moon);
  const fog = new FX(scene, 160, 'steam'); const cam = persp(48, 0.5, 30000); const towers = []; isl.traverse(o => { if (o.userData.search) { towers.push(o); o.userData.cone.visible = false; } }); isl.userData.beam.material.opacity = 0.035;
  return { scene, cam, env: true, envI: 0.35, post: { focus: 160 }, upd(lt, d) { sea.update(lt + 3); isl.userData.beam.rotation.y = 2.2 + lt * 0.45; towers.forEach((t, i) => { t.userData.search.rotation.y = Math.sin(lt * 0.8 + i * 2) * 1.2; t.userData.search.rotation.x = 0.18; });
    E.driftFX(fog, V(30, 4, 60), lt, { w: 240, d: 200, size: 18, alpha: 0.06, wind: V(4, 0.2, 1) }); sun.follow(V(0, 0, 0));
    camMove(cam, lt / d, V(125, 10, 180), V(80, 30, 125), V(-6, 13, 0), V(-6, 18, -4), 46, 46); handheld(cam, 0.004, lt); } };
});
clock(null, 'ALCATRAZ · 1962');

// ============ 2. Your cell is five feet by nine. — overhead into the cell, measurements drawn on the floor ============
shot('your cell is', (S) => {
  const scene = nightRoom({ hemi: 0.5, fd: 0.02, expo: 1.08, warm: 0.12 }); const c = A.cell({ ceil: false, bulb: 2.4, front: false }); scene.add(c);
  const hall = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), A.M.floor()); hall.rotation.x = -Math.PI / 2; hall.position.set(0, -0.01, 1.4); hall.userData.ground = true; scene.add(hall);
  const keyL = new THREE.SpotLight(0xd8e4ff, 18, 12, 0.7, 0.6, 1.4); keyL.position.set(0.5, 3.4, 2.8); keyL.target.position.set(0, 0, -1.3); keyL.castShadow = true; keyL.shadow.mapSize.set(2048, 2048); scene.add(keyL); scene.add(keyL.target);
  const you = mk3(scene, { ...YOU, mocap: 'idle', expr: 'worried' }, V(0.18, 0, -1.0), 0.3);
  const mw = measure(A.CW, '5 FT'); mw.rotation.x = -Math.PI / 2; mw.position.set(0, 0.02, -0.25); scene.add(mw); const md = measure(A.CD, '9 FT'); md.rotation.set(-Math.PI / 2, 0, Math.PI / 2); md.position.set(A.CW / 2 - 0.2, 0.02, -A.CD / 2); scene.add(md);
  const dust = new FX(scene, 90, 'dust', true); const cam = persp(44, 0.05, 60);
  return { scene, cam, hero: you, env: false, upd(lt, d) { motes(dust, [-0.7, 0.2, 0.7, 2.0, -2.6, 0.2], lt, 0.01);
    const k1 = clamp01((lt - 0.45) / 0.35), k2 = clamp01((lt - 0.95) / 0.35); mw.scale.set(AB(k1), 1, 1); md.scale.set(AB(k2), 1, 1); mw.userData.mat.forEach(m => m.opacity = k1); md.userData.mat.forEach(m => m.opacity = k2);
    camMove(cam, lt / d, V(0.2, 4.4, 1.1), V(0.1, 3.7, 0.6), V(0, 0, -1.3), V(0, 0, -1.37), 54, 58); } };
});
stamp('nine', '1.5 m × 2.7 m', 1.5, '#ffd23f', 560);

// ============ 3. Stretch your arms... and you touch both walls. ============
shot('stretch your arms', (S) => {
  const scene = nightRoom({ hemi: 0.45, fd: 0.03, expo: 1.08, warm: 0.15 }); const c = A.cell({ bulb: 2.6, front: false }); scene.add(c);
  const fill = new THREE.PointLight(0xc8d8ff, 2.2, 6, 1.5); fill.position.set(0.3, 1.6, 0.9); scene.add(fill);
  const you = mk(scene, { ...YOU, height: 1.8, mocap: 'idle', expr: 'serious', arms: 'down' }, V(0, 0, -1.25), 0);
  const dust = new FX(scene, 60, 'dust', true); const touch = new FX(scene, 40, 'dust', true); const cam = persp(52, 0.05, 40); const tT = Math.max(0.9, wt('touch', S.t) - S.t);
  return { scene, cam, hero: you, env: false, upd(lt, d) { motes(dust, [-0.7, 0.2, 0.7, 2.0, -2.6, 0.2], lt, 0.008);
    const k = AB(clamp01((lt - 0.15) / 0.9)), kk = AB(clamp01((lt - tT + 0.35) / 0.4)); const ang = lerp(0.15, 1.57, k); const ak = lerp(1, 1.315, kk);
    you.set({ armsOverride: [[ang, lerp(0, 0.05, k)], [ang, lerp(0, 0.05, k)]], armK: ak, expr: kk > 0.9 ? 'shock' : (k > 0.5 ? 'worried' : 'serious'), mocap: k > 0.05 ? false : 'idle' });
    bursts(touch, kk >= 1 ? [{ p: V(-A.CW / 2 + 0.02, 1.33, -1.25), t0: tT, n: 18, sp: 0.4, life: 0.8, size: 0.03, g: 0.3 }, { p: V(A.CW / 2 - 0.02, 1.33, -1.25), t0: tT, n: 18, sp: 0.4, life: 0.8, size: 0.03, g: 0.3 }] : [], lt);
    camMove(cam, lt / d, V(0, 1.25, 1.35), V(0, 1.3, 0.85), V(0, 1.12, -1.3), V(0, 1.15, -1.3), 58, 56); if (lt > tT && lt < tT + 0.2) shake(cam, 0.006, lt); } };
});

// ============ 4. Lights out at 9:30. — Broadway: the lamps go dark one by one ============
shot('lights out', (S) => {
  const scene = nightRoom({ hemi: 0.22, fd: 0.035, bg: 0x03050a, expo: 1.1, warm: 0.05 }); const ch = A.cellhouse({ n: 22, clock: 21.5, lampI: 10 }); scene.add(ch);
  const guard = mk(scene, { ...GUARD, pose: 'walk', mocap: 'walk', mocapSpeed: 0.8 }, V(-10, 0, 0.4), Math.PI / 2);
  const inmates = [[-3.8, -1], [-0.8, 1], [3.7, -1], [6.8, 1]].map(([x, sd], i) => mk(scene, { ...INM(i), mocap: i % 2 ? 'idle' : 'look', height: 1.7 }, V(x, 0, sd * (ch.userData.aisle / 2 + 0.7)), sd > 0 ? Math.PI : 0));
  const cam = persp(50, 0.1, 200); const L = ch.userData.lamps.filter(l => l.kind === 'aisle').sort((a, b) => b.x - a.x); const C_ = ch.userData.lamps.filter(l => l.kind === 'cell');
  return { scene, cam, hero: guard, env: false, upd(lt, d) { guard.group.position.x = -10 + lt * 1.2;
    L.forEach((l, i) => { const on = lt < 0.25 + i * 0.12 ? 1 : 0; l.m.material.color.setHex(on ? 0xfff2cc : 0x1a1a14); l.l.intensity = on ? 10 : 0; });
    C_.forEach((l) => { l.m.visible = lt < 0.3 + (11 - l.x) * 0.05; }); scene.userData.expo = lerp(1.1, 1.45, clamp01((lt - 0.3) / 1.2));
    camMove(cam, lt / d, V(13.5, 1.3, 0.2), V(12.2, 1.5, 0.1), V(0, 2.6, 0), V(0, 2.4, 0), 50, 48); } };
});
clock('930', '9:30 PM');

// ============ 5. The guards count you 13 times a day. — flashlight through the bars ============
shot('the guards count', (S) => {
  const scene = nightRoom({ hemi: 0.35, fd: 0.03, expo: 1.3 }); const c = A.cell({ bulb: 0 }); c.userData.bulb.visible = false; scene.add(c);
  for (const sd of [-3, -2, -1, 1, 2]) { const n = A.cell({ bulb: 0.6, bulbShadow: false }); n.position.x = sd * (A.CW + 0.24); scene.add(n); }
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), A.M.floor()); fl.rotation.x = -Math.PI / 2; fl.position.set(0, -0.01, 1.8); fl.userData.ground = true; scene.add(fl);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(14, 0.06, 0.06), A.M.ironDk()); rail.position.set(0, 1.0, 2.6); scene.add(rail);
  const you = mk(scene, { ...YOU, mocap: 'idle', expr: 'serious' }, V(0.1, 0, -0.45), 0);
  const guard = mk(scene, { ...GUARD, pose: 'walk', mocap: 'walk', mocapSpeed: 0.6 }, V(-3, 0, 1.0), Math.PI / 2); const fl2 = A.flashlight(); scene.add(fl2);
  fl2.userData.cone.material.opacity = 0.035; const cam = persp(48, 0.05, 60); const cor = new THREE.PointLight(0x8aa4d8, 4, 9, 1.5); cor.position.set(0.5, 2.6, 2.0); scene.add(cor);
  return { scene, cam, hero: you, env: false, upd(lt, d) { const x = -3.4 + lt * 1.05; guard.group.position.set(x, 0, 1.0); const hp = guard.handW(1); fl2.position.copy(hp.y > 0.3 ? hp : V(x + 0.25, 1.1, 1.0));
    const aim = V(0.1 + Math.sin(lt * 2.5) * 0.1, 1.3, -0.45); fl2.lookAt(aim); guard.set({ armsOverride: [[0.2, 0], [1.25, -0.2]] }); you.set({ expr: Math.abs(x - you.group.position.x) < 1.2 ? 'scared' : 'serious' });
    camMove(cam, lt / d, V(5.6, 1.5, 1.45), V(5.1, 1.45, 1.35), V(-1.0, 1.1, 0.2), V(-0.8, 1.1, 0.15), 46, 44); } };
});
stamp('13', '13 COUNTS A DAY', 1.8, '#ffffff', 560);

// ============ 6. All around you: 50°F water, and currents that drag men out to sea. ============
shot('all around you', (S) => {
  const { scene, sun } = bayScene('bayBlue', { sunDir: V(-0.6, 0.12, -0.5), expo: 1.05, fd: 0.0016, amb: 0.4 });
  const sea = seaGroup(scene, 0x0c2236, 0.55, 9000, { env: 0.45, hz: 0x2c3e5a }); const isl = A.island({ s: 1 }); isl.position.set(-60, 0, -220); isl.rotation.y = 0.3; scene.add(isl);
  const gg = A.goldenGate({ s: 0.9 }); gg.position.set(-1900, 0, -600); gg.rotation.y = 0.9; scene.add(gg); const sf = A.skyline({ s: 1.4, n: 140 }); sf.position.set(600, -2, -1800); sf.rotation.y = -0.3; scene.add(sf);
  const arrows = A.currentArrows(14, { len: 70, w: 4.5, spread: 160, spreadZ: 160, rot: 0.55 }); scene.add(arrows);
  const swim = mk(scene, { ...JOHN, pose: 'swim', expr: 'scared', extras: ['inmateNo', 'shiver'] }, V(4, 0, 6), -1.2); swim.ground = false;
  const ther = new THREE.Group(); const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.6, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.1 })); tube.position.y = 1.3; ther.add(tube);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: 0x3aa8ff })); ther.add(bulb); const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 12), new THREE.MeshBasicMaterial({ color: 0x3aa8ff })); liq.geometry.translate(0, 0.5, 0); liq.position.y = 0.2; ther.add(liq); ther.position.set(-3.4, 0.3, 4); ther.traverse(o => o.userData.noOutline = true); scene.add(ther);
  const spray = new FX(scene, 120, 'steam'); const cam = persp(52, 0.1, 30000); const tC = Math.max(1.8, wt('currents', S.t) - S.t);
  return { scene, cam, hero: swim, env: true, envI: 0.45, upd(lt, d) { sea.update(lt + 9); const ka = clamp01((lt - tC + 0.3) / 0.6); arrows.userData.update(lt, ka);
    const drift = Math.max(0, lt - tC) ; swim.group.position.set(4 - drift * 2.3, sea.amp * Math.sin(lt * 1.3) * 0.4 - 0.55, 6 - drift * 1.4); swim.set({ expr: drift > 0.2 ? 'shock' : 'scared' });
    liq.scale.y = lerp(1.9, 0.55, AB(clamp01((lt - 0.8) / 1.0))); ther.visible = lt < tC + 0.4; ther.position.y = 0.3 + Math.sin(lt * 1.2) * 0.08;
    for (let i = 0; i < spray.n; i++) { const R_ = spray.R[i]; const ph = (lt * 0.4 + R_[0]) % 1; const p = swim.group.position; spray.set(i, p.x + (R_[1] - 0.5) * 1.6, 0.1 + ph * 0.5, p.z + (R_[2] - 0.5) * 1.6, 0.12 * Math.sin(ph * Math.PI), 0.15 + ph * 0.25); } spray.commit(); sun.follow(V(0, 0, 0));
    const p = swim.group.position; camMove(cam, lt / d, V(2.4, 1.6, 9.5), V(p.x + 2.4, 2.2, p.z + 6.5), V(0, 0.6, 2), V(p.x - 2, 0.0, p.z - 6), 50, 54); handheld(cam, 0.01, lt); } };
});
stamp('50f', '50°F · 10°C', 1.8, '#9fdcff', 560);

// ============ 7. Nobody escapes the Rock. — guard tower, searchlight, barbed wire ============
shot('nobody escapes', (S) => {
  const { scene, sun } = bayScene('bayNight', { sunDir: V(0.4, 0.4, -0.6), expo: 1.15, fd: 0.004, amb: 0.3 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), A.M.concreteDk()); ground.rotation.x = -Math.PI / 2; ground.userData.ground = true; ground.receiveShadow = true; scene.add(ground);
  const sea = seaGroup(scene, 0x06101c, 0.4, 9000, { env: 0.3, hz: 0x0a1424 }); sea.mesh.position.y = -12; const tw = A.guardTower(1, { beamOp: 0.09 }); tw.position.set(0, 0, -6); scene.add(tw);
  const fence = A.barbedFence(40); fence.position.set(0, 0, 1.5); scene.add(fence); const wall = A.wallSection(40, 4, A.M.wallCream()); wall.position.set(0, 0, -16); scene.add(wall);
  const guard = mk(scene, { ...GUARD, prop: 'rifle', mocap: 'look' }, V(0.6, 10.45, -5.5), 0); guard.ground = false; const sf = A.skyline({ s: 1.4, n: 120 }); sf.position.set(0, -12, -2200); scene.add(sf); E.stars(scene, 1800);
  const fog = new FX(scene, 90, 'steam'); const cam = persp(52, 0.2, 30000);
  return { scene, cam, hero: guard, env: false, upd(lt, d) { sea.update(lt); const s = tw.userData.search; s.rotation.y = lerp(-1.1, 0.25, ease(clamp01(lt / d))); s.rotation.x = 0.35 - lt * 0.05;
    E.driftFX(fog, V(0, 3, -4), lt, { w: 40, d: 30, size: 6, alpha: 0.12, wind: V(2, 0.2, 0.4) }); sun.follow(V(0, 0, 0));
    camMove(cam, lt / d, V(3.8, 1.2, 6.5), V(3.0, 1.0, 5.6), V(0, 9.5, -6), V(0, 10.5, -6), 52, 50); } };
});

// ============ 8. So you dig. — kneeling at the vent under the sink, cell dark ============
shot('so you dig', (S) => {
  const scene = nightRoom({ hemi: 0.3, fd: 0.03, expo: 1.15, warm: 0.1 }); const c = A.cell({ bulb: 0.0, front: true }); c.userData.bulb.visible = false; scene.add(c);
  const cand = W.candle(); cand.position.set(-0.1, 0, -A.CD + 0.55); scene.add(cand); const moon = new THREE.SpotLight(0x8aa6e0, 10, 10, 0.5, 0.6, 1.4); moon.position.set(0.6, 2.4, 2.5); moon.target.position.set(0.2, 0.3, -2.4); scene.add(moon); scene.add(moon.target);
  const you = mk3(scene, { ...YOU, mocap: 'kneel', mocapLoop: false, expr: 'serious' }, V(-0.08, 0, -A.CD + 0.6), Math.PI * 0.85);
  const cam = persp(52, 0.05, 40);
  return { scene, cam, hero: you, env: false, upd(lt, d) { cand.userData.flame.scale.y = 2 + Math.sin(lt * 23) * 0.3; cand.userData.light.intensity = 3 + Math.sin(lt * 17) * 0.4;
    camMove(cam, lt / d, V(0.62, 1.45, -0.5), V(0.6, 1.3, -0.75), V(0.0, 0.5, -A.CD + 0.4), V(0.05, 0.45, -A.CD + 0.3), 56, 52); } };
});

// ============ 9. Every night, with a sharpened spoon, you scrape the concrete around your air vent. ============
shot('every night', (S) => {
  const scene = nightRoom({ hemi: 0.3, fd: 0.02, expo: 1.1, warm: 0.12 }); const c = A.cell({ bulb: 0, front: true }); c.userData.bulb.visible = false; scene.add(c);
  const cand = W.candle(); cand.position.set(-0.25, 0, -A.CD + 0.5); scene.add(cand); cand.userData.light.intensity = 1.2; const fill = new THREE.PointLight(0x9ab0e0, 1.2, 4, 1.5); fill.position.set(0.9, 0.9, -1.4); scene.add(fill);
  const vent = c.userData.vent; const vp = vent.getWorldPosition(new THREE.Vector3());
  const you = mk3(scene, { ...YOU, mocap: 'kneel', mocapLoop: false, mocapStart: -3, expr: 'serious', extras: ['inmateNo'], height: 1.75 }, V(vp.x - 0.3, 0, vp.z + 0.55), Math.PI * 0.82);
  const sp = A.spoon(); sp.scale.setScalar(1.7); scene.add(sp); let solves = 0; c.userData.table.forEach(m => m.visible = false);
  const cracks = new THREE.Group(); for (let i = 0; i < 4; i++) { const cr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.014), new THREE.MeshBasicMaterial({ color: 0x1a1612 })); cr.userData.noOutline = true; cr.position.set(vp.x + [-0.145, 0.145, 0, 0][i], vp.y + [0, 0, 0.112, -0.112][i], vp.z + 0.004); cr.rotation.z = i < 2 ? Math.PI / 2 : 0; cracks.add(cr); } scene.add(cracks);
  const dust = new FX(scene, 260, 'dust'); const cam = persp(46, 0.02, 30); let off = null;
  return { scene, cam, hero: null, post: { focus: 0.75 }, env: false, upd(lt, d) { cand.userData.flame.scale.y = 2 + Math.sin(lt * 23) * 0.3; cand.userData.light.intensity = 1.2 + Math.sin(lt * 17) * 0.15;
    const scr = Math.sin(lt * 9); const corner = Math.floor(lt / 1.15) % 4; const o = [[-0.14, 0.1], [0.14, 0.1], [0.14, -0.1], [-0.14, -0.1]][corner]; const along = corner % 2 ? V(0, 1, 0) : V(1, 0, 0);
    const tip = V(vp.x + o[0], vp.y + o[1], vp.z + 0.01).addScaledVector(along, scr * 0.025); const dir = V(-0.1, 0.35, 0.93).normalize();
    sp.position.copy(tip).addScaledVector(dir, 0.06 * 1.7); sp.lookAt(sp.position.clone().add(dir)); const grip = tip.clone().addScaledVector(dir, 0.3 * 1.7);
    you.reach(1, null).reach(0, grip); you.set({ expr: 'serious', headPitch: 0.25 });
    const k = clamp01(lt / (d * 0.9)); cracks.children.forEach((cr, i) => { cr.scale.x = clamp01(k * 1.4 - i * 0.12); });
    bursts(dust, Array.from({ length: 10 }, (_, i) => ({ p: tip.clone(), t0: i * 0.45, n: 26, sp: 0.18, life: 1.4, size: 0.008, up: 0.3, g: 0.12, floor: 0.0 })), lt);
    camMove(cam, lt / d, V(vp.x + 0.42, vp.y + 0.95, vp.z + 1.55), V(vp.x + 0.4, vp.y + 0.82, vp.z + 1.35), vp.clone().add(V(-0.12, 0.2, 0.25)), vp.clone().add(V(-0.1, 0.16, 0.2)), 50, 46); handheld(cam, 0.005, lt); } };
});
stamp('spoon', 'SHARPENED SPOON', 1.6, '#e8eef8', 560);

// ============ 10. You build a fake head out of soap, toilet paper... ============
shot('you build a', (S) => {
  const scene = nightRoom({ hemi: 0.25, fd: 0.02, expo: 1.1, warm: 0.25 }); const c = A.cell({ bulb: 0, front: true }); c.userData.bulb.visible = false; scene.add(c);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.5), mat('wood', 0xc8a878)); top.position.set(0.3, 0.78, -1.2); top.castShadow = top.receiveShadow = true; scene.add(top);
  const cand = W.candle(); cand.position.set(0.5, 0.8, -1.38); scene.add(cand);
  const soap = A.soapBar(); soap.position.set(0.12, 0.815, -1.08); scene.add(soap); const tp = A.tpRoll(); tp.position.set(0.48, 0.85, -1.05); scene.add(tp); const pot = A.paintPot(); pot.position.set(0.12, 0.83, -1.32); scene.add(pot);
  const head = A.dummyHead(); head.position.set(0.3, 0.9, -1.2); scene.add(head); head.userData.hair.visible = false; const key = new THREE.SpotLight(0xffe4c0, 9, 4, 0.6, 0.5, 1.4); key.position.set(0.9, 1.5, -0.4); key.target.position.set(0.3, 0.85, -1.2); key.castShadow = true; scene.add(key); scene.add(key.target);
  const scraps = []; for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.05), W.std(0xf8f6f0, { side: THREE.DoubleSide })); s.position.set(0.2 + (i % 3) * 0.08, 0.802, -1.0 - Math.floor(i / 3) * 0.05); s.rotation.set(-Math.PI / 2, 0, i); scene.add(s); scraps.push(s); }
  const you = mk3(scene, { ...YOU, pose: 'stand', mocap: 'idle', expr: 'serious' }, V(-0.22, 0, -1.2), Math.PI / 2);
  const cam = persp(44, 0.02, 30); const white = new THREE.Color(0xf6f4ee), skin = new THREE.Color(0xe4b490);
  return { scene, cam, hero: null, post: { focus: 0.62 }, env: false, upd(lt, d) { cand.userData.flame.scale.y = 2 + Math.sin(lt * 23) * 0.3;
    const k = AB(clamp01((lt - 0.2) / 1.6)); head.scale.set(lerp(0.45, 1, k), lerp(0.35, 1, k), lerp(0.45, 1, k)); head.rotation.y = 0.5 + Math.sin(lt * 0.8) * 0.35; const kp = clamp01((lt - 1.9) / 1.0); head.userData.skin.color.copy(white).lerp(skin, kp);
    scraps.forEach((s, i) => s.visible = lt < 0.4 + i * 0.18); soap.scale.setScalar(lerp(1, 0.4, k));
    const hr = 0.11 * lerp(0.45, 1, k); you.reach(0, head.position.clone().add(V(-0.02 + Math.sin(lt * 6) * 0.015, 0.02, hr + 0.01))).reach(1, head.position.clone().add(V(-0.02, 0.03 + Math.sin(lt * 6 + 2) * 0.015, -hr - 0.01))); you.set({ expr: kp > 0.5 ? 'smug' : 'serious', headPitch: 0.35 });
    camMove(cam, lt / d, V(0.62, 1.5, -0.25), V(0.55, 1.38, -0.4), V(0.12, 0.95, -1.2), V(0.15, 0.95, -1.2), 50, 46); } };
});

// ============ 11. ...and real hair from the barbershop. ============
shot('and real hair', (S) => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1c20); scene.fog = new THREE.FogExp2(0x2a2c30, 0.03); scene.userData.expo = 1.0; scene.userData.sat = 1.08; scene.userData.warm = 0.05;
  const room = W.room(6, 3.2, 5, { wall: 0xd8dcc8 }); scene.add(room); scene.add(new THREE.HemisphereLight(0xfff6e8, 0x4a4a48, 0.9));
  const key = new THREE.DirectionalLight(0xfff4e0, 2.4); key.position.set(-3, 5, 3); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); scene.add(key);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), new THREE.MeshBasicMaterial({ color: 0xdfe8f0 })); win.position.set(-1, 1.9, -2.38); scene.add(win); for (let k = -3; k <= 3; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6), A.M.ironDk()); b.position.set(-1 + k * 0.2, 1.9, -2.35); scene.add(b); }
  const ch = A.barberChair(); ch.position.set(0.2, 0, -0.9); scene.add(ch); const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), W.std(0xb8c8d8, { metalness: 0.9, roughness: 0.1 })); mirror.position.set(0.2, 1.6, -2.38); scene.add(mirror);
  const hairF = A.hairClumps(600, [2.4, 2.0]); hairF.position.set(0.2, 0, -0.6); scene.add(hairF);
  const sitter = mk3(scene, { ...INM(1), pose: 'sit', mocap: false, expr: 'neutral', extras: ['inmateNo', 'apron'], armsOverride: [[0.5, -1.2], [0.5, -1.2]], armPlane: 0.8 }, V(0.2, 0.18, -0.95), 0); sitter.ground = false;
  const barber = mk3(scene, { ...INM(3), mocap: 'idle', expr: 'neutral', extras: ['inmateNo'] }, V(0.75, 0, -1.05), -1.2);
  const you = mk3(scene, { ...YOU, mocap: 'crouch', mocapLoop: false, expr: 'smug' }, V(-0.55, 0, -0.15), 0.5);
  const comb = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.12), W.std(0x1a1a1a)); scene.add(comb);
  const fall_ = new FX(scene, 80, 'dot'); const pocket = A.hairClumps(18, [0.2, 0.2]); scene.add(pocket); const cam = persp(48, 0.05, 40);
  return { scene, cam, hero: you, env: false, upd(lt, d) { const hd = sitter.head.getWorldPosition(new THREE.Vector3()); barber.reach(0, hd.clone().add(V(0.05 + Math.sin(lt * 14) * 0.03, 0.2, 0.05))).reach(1, hd.clone().add(V(0.12, 0.1, -0.08))); comb.position.copy(barber.handW(0)); barber.set({ headPitch: 0.3 });
    for (let i = 0; i < fall_.n; i++) { const R_ = fall_.R[i]; const ph = (lt * 0.7 + R_[0]) % 1; fall_.set(i, 0.2 + (R_[1] - 0.5) * 0.5, 1.75 - ph * 1.7, -0.9 + (R_[2] - 0.5) * 0.4, 0.8, 0.015 + R_[3] * 0.015); } fall_.commit();
    const kg = clamp01((lt - 1.1) / 0.6); const pile = V(-0.35, 0.02, -0.35); you.reach(1, lt < 1.1 ? pile : pile.clone().lerp(V(-0.5, 0.75, -0.05), kg)); const hw = you.handW(1); pocket.position.copy(lt < 0.6 ? pile : hw.clone().add(V(0, -0.02, 0))); pocket.scale.setScalar(1 - kg * 0.2); you.set({ expr: lt > 1.2 ? 'smug' : 'serious', headPitch: lt < 1.1 ? 0.5 : 0 });
    camMove(cam, lt / d, V(-1.3, 2.3, 2.2), V(-1.1, 2.0, 1.8), V(0.0, 0.5, -0.6), V(-0.1, 0.55, -0.5), 50, 48); } };
});

// ============ 12. You glue 50 raincoats into a raft. — on top of the cellblock, under the roof ============
shot('you glue', (S) => {
  const scene = nightRoom({ hemi: 0.4, fd: 0.05, expo: 1.1, warm: 0.08 }); const flo = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), A.M.concreteDk()); flo.rotation.x = -Math.PI / 2; flo.userData.ground = true; flo.receiveShadow = true; scene.add(flo);
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 14, 10), W.std([0x6a5a4a, 0x8a8e94][i % 2], { metalness: 0.5, roughness: 0.5 })); p.rotation.z = Math.PI / 2; p.position.set(0, 2.2 + i * 0.25, -2.5 - (i % 2) * 0.3); scene.add(p); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 10), A.M.concrete()); beam.position.set(-1.2, 3.4, 0); scene.add(beam); const beam2 = beam.clone(); beam2.position.x = 2.4; scene.add(beam2);
  const lamp = W.candle(); lamp.position.set(1.0, 0, -0.6); scene.add(lamp); const bulb = new THREE.PointLight(0xffe2c0, 4, 9, 1.4); bulb.position.set(0.4, 2.0, 0.3); scene.add(bulb);
  const raft = A.raft(); raft.position.set(0.2, 0, -0.2); scene.add(raft); const coats = []; for (let i = 0; i < 14; i++) { const r = A.raincoat([0x8a8240, 0x6a6430, 0x9a9050][i % 3]); r.rotation.set(-Math.PI / 2, 0, i * 1.7); r.position.set(-2.2 + (i % 5) * 0.9 + (i > 9 ? 0.3 : 0), 0.01 + i * 0.002, 1.3 - Math.floor(i / 5) * 0.4 - (i % 2) * 2.8); r.scale.setScalar(0.7); scene.add(r); coats.push(r); }
  const you = mk3(scene, { ...YOU, mocap: 'kneel', mocapLoop: false, mocapStart: -3, expr: 'serious' }, V(-1.1, 0, -0.15), Math.PI / 2); const john = mk3(scene, { ...JOHN, mocap: 'kneel', mocapLoop: false, mocapStart: -3, expr: 'smug' }, V(1.5, 0, -0.3), -Math.PI / 2);
  const cam = persp(48, 0.05, 40); const dust = new FX(scene, 80, 'dust', true);
  return { scene, cam, hero: raft, env: false, post: { focus: 3.0 }, upd(lt, d) { motes(dust, [-2, 0.2, 2, 2.6, -2, 1], lt, 0.01); const k = AB(clamp01((lt - 0.3) / 2.2)); raft.userData.tube.scale.set(1.0, lerp(0.15, 0.5, k), lerp(0.12, 1, k)); raft.scale.set(lerp(0.85, 1, k), 1, lerp(0.8, 1, k));
    const ty = raft.userData.tube.scale.y * 0.4 + 0.05; you.reach(0, V(-0.72, ty, -0.15 + 0.25 + Math.sin(lt * 7) * 0.05)).reach(1, V(-0.72, ty, -0.15 - 0.25)); john.reach(0, V(1.12, ty, -0.3 - 0.25 + Math.sin(lt * 6 + 1) * 0.05)).reach(1, V(1.12, ty, -0.3 + 0.25)); you.set({ headPitch: 0.4 }); john.set({ headPitch: 0.4 });
    coats.forEach((r, i) => r.visible = lt < 2.6 - i * 0.12 || i > 9);
    camMove(cam, lt / d, V(0.6, 4.4, 5.6), V(0.45, 3.9, 4.9), V(0.2, 0.2, -0.4), V(0.2, 0.3, -0.4), 50, 48); } };
});
stamp('raincoats', '50 RAINCOATS', 1.7, '#e8e070', 560);

// ============ 13. June eleventh. — calendar page torn off ============
shot('june eleventh', (S) => {
  const scene = nightRoom({ hemi: 0.4, fd: 0.02, expo: 1.1, warm: 0.15 }); const wl = A.wallSection(4, 3, A.M.wallCream()); wl.position.z = -0.2; scene.add(wl);
  const cal = A.calendar(); cal.g.position.set(0, 1.55, -0.02); scene.add(cal.g); const key = new THREE.SpotLight(0xffe8c0, 14, 6, 0.5, 0.5, 1.4); key.position.set(0.8, 2.4, 1.6); key.target.position.set(0, 1.5, 0); key.castShadow = true; scene.add(key); scene.add(key.target);
  const cam = persp(40, 0.05, 30);
  return { scene, cam, hero: null, post: { focus: 1.6 }, env: false, upd(lt, d) { cal.tear(AB(clamp01((lt - 0.12) / 0.55))); camMove(cam, lt / d, V(0.1, 1.55, 1.75), V(0.05, 1.55, 1.45), V(0, 1.55, 0), V(0, 1.52, 0), 38, 36); if (lt > 0.4 && lt < 0.6) shake(cam, 0.004, lt); } };
});

// ============ 14. You leave the dummy in your bed... — flashlight sweeps over the fake head ============
shot('you leave the', (S) => {
  const scene = nightRoom({ hemi: 0.3, fd: 0.03, expo: 1.12, bg: 0x020306 }); const c = A.cell({ bulb: 0 }); c.userData.bulb.visible = false; scene.add(c); const cor = new THREE.PointLight(0x7a94c8, 3, 7, 1.5); cor.position.set(0.2, 2.2, 1.6); scene.add(cor);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), A.M.floor()); fl.rotation.x = -Math.PI / 2; fl.position.set(0, -0.01, 1.8); fl.userData.ground = true; scene.add(fl);
  const bed = c.userData.bed; const bw = bed.getWorldPosition(new THREE.Vector3()); const head = A.dummyHead(); head.position.set(bw.x, 0.68, bw.z - 0.68); head.rotation.set(-0.7, 0.4, 0.2); scene.add(head);
  bed.userData.blanket.position.y = 0.58; const bump = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 6, 12), mat('cloth', 0x6a7078, { bump: 2 })); bump.rotation.x = Math.PI / 2; bump.scale.set(1.15, 1, 0.6); bump.position.set(bw.x, 0.62, bw.z + 0.15); scene.add(bump);
  const guard = mk(scene, { ...GUARD, pose: 'walk', mocap: 'walk', mocapSpeed: 0.55 }, V(-3, 0, 1.1), Math.PI / 2); const fl2 = A.flashlight(); scene.add(fl2); fl2.userData.cone.visible = false; fl2.userData.spot.intensity = 45;
  const you = mk(scene, { ...YOU, mocap: 'sneak', expr: 'worried' }, V(0.45, 0, -A.CD + 0.55), Math.PI); const cam = persp(46, 0.05, 40);
  return { scene, cam, hero: null, post: { focus: 1.5 }, env: false, upd(lt, d) { const x = -1.0 + lt * 0.75; guard.group.position.set(x, 0, 1.1); guard.set({ armsOverride: [[0.2, 0], [1.2, -0.2]] }); fl2.position.set(x + 0.3, 1.15, 1.0);
    const aim = head.position.clone().add(V(Math.sin(lt * 1.7) * 0.15, 0, 0)); fl2.lookAt(aim); you.visible = false; you.group.visible = lt < 0.9; you.group.position.y = lt < 0.9 ? 0 : -9;
    camMove(cam, lt / d, V(0.5, 1.8, -0.2), V(0.4, 1.65, -0.35), V(bw.x, 0.6, bw.z - 0.5), V(bw.x, 0.62, bw.z - 0.62), 52, 48); } };
});

// ============ 15. climb the vents to the roof... ============
shot('climb the vents', (S) => {
  const scene = nightRoom({ hemi: 0.22, fd: 0.05, expo: 1.2, warm: -0.05 }); const sh = A.shaft({ h: 9 }); scene.add(sh); const hat = sh.userData.hatch;
  const moonL = new THREE.SpotLight(0x9ab8ff, 30, 16, 0.5, 0.5, 1.2); moonL.position.set(0.5, 13, 0.6); moonL.target.position.set(0, 0, 0); scene.add(moonL); scene.add(moonL.target); const warm = new THREE.PointLight(0xffb070, 2.5, 8, 1.6); warm.position.set(0, 1.0, 0.2); scene.add(warm);
  const cl = [YOU, JOHN, CLAR].map((o, i) => { const c = mk3(scene, { ...o, mocap: 'climb', mocapSpeed: 0.9, mocapStart: i * 0.4, expr: i ? 'worried' : 'serious', height: 1.7, headPitch: -0.5 }, V(0, 0, -0.12), Math.PI); c.ground = false; return c; });
  const cam = persp(60, 0.05, 40);
  return { scene, cam, hero: cl[0], env: false, upd(lt, d) { cl.forEach((c, i) => { const Y = 5.2 + lt * 0.9 - i * 1.7; c.group.position.y = Y; [0, 1].forEach(j => { const ry = Math.floor((Y + 1.0 + j * 0.21 - 0.4) / 0.42) * 0.42 + 0.4 + 0.42; c.reach(j, V((j ? 1 : -1) * 0.16, ry, -0.31)); }); });
    const ko = AB(clamp01((lt - 0.9) / 0.6)); hat.rotation.z = ko * 1.9;
    camMove(cam, lt / d, V(0.1, 8.85, 0.36), V(0.08, 8.9, 0.34), V(0, 5.8, -0.15), V(0, 6.8, -0.15), 58, 56); } };
});

// ============ 16. ...and paddle into the dark. ============
shot('and paddle', (S) => {
  const { scene, sun } = bayScene('bayNight', { sunDir: V(0.5, 0.3, -0.6), expo: 1.2, fd: 0.004, amb: 0.4 });
  const sea = seaGroup(scene, 0x06101c, 0.12, 9000, { env: 0.3, hz: 0x0a1424 }); const isl = A.island({ s: 1 }); isl.position.set(20, 0, -150); isl.rotation.y = 0.2; scene.add(isl); E.stars(scene, 1800); const sf = A.skyline({ s: 1.4, n: 120 }); sf.position.set(-300, -2, -2300); scene.add(sf);
  const raft = A.raft(); scene.add(raft); const men = [YOU, JOHN, CLAR].map((o, i) => { const c = mk3(scene, { ...o, pose: 'sit', sitFloor: true, mocap: false, expr: i ? 'scared' : 'serious', extras: ['inmateNo', 'shiver'], height: 1.7 }, V(0, 0, 0), i === 2 ? Math.PI * 0.9 : 0); c.ground = false; return c; });
  const pads = [0, 1].map(() => { const p = A.paddle(); scene.add(p); return p; }); const moonL = new THREE.DirectionalLight(0x9ab4ff, 1.2); moonL.position.set(30, 40, -20); scene.add(moonL);
  const fog = new FX(scene, 160, 'steam'); const splash = new FX(scene, 120, 'steam'); const cam = persp(48, 0.1, 30000); const towers = []; isl.traverse(o => { if (o.userData.search) towers.push(o); });
  return { scene, cam, hero: men[0], env: true, envI: 0.3, upd(lt, d) { sea.update(lt + 20); const z = -lt * 0.8; const bob = Math.sin(lt * 1.6) * 0.05; raft.position.set(0, bob + 0.1, z); raft.rotation.set(Math.sin(lt * 1.3) * 0.05, 0.15, Math.sin(lt * 1.1) * 0.06);
    men.forEach((m, i) => { const off = [V(0.42, 0, 0.1), V(-0.4, 0, 0.2), V(0.0, 0, -0.3)][i]; m.group.position.set(off.x, raft.position.y + 0.05, z + off.z); if (i === 2) m.set({ armsOverride: [[0.6, -1.4], [0.6, -1.4]], armPlane: 0.9 }); });
    pads.forEach((p, i) => { const m = men[i]; const sd = i ? -1 : 1; const st = Math.sin(lt * 4.2 + i * 1.5); const mp = m.group.position; const top = mp.clone().add(V(sd * 0.12, 0.85, 0.22 + st * 0.18)); const blade = mp.clone().add(V(sd * 0.75, -0.25, 0.1 - st * 0.45)); const dir = blade.clone().sub(top).normalize(); p.position.copy(top).addScaledVector(dir, 0.55); p.lookAt(blade); m.reach(i ? 1 : 0, top.clone().addScaledVector(dir, 0.05)).reach(i ? 0 : 1, top.clone().addScaledVector(dir, 0.42)); });
    for (let i = 0; i < splash.n; i++) { const R_ = splash.R[i]; const ph = (lt * 1.4 + R_[0]) % 1; splash.set(i, (R_[1] < 0.5 ? 1.0 : -1.0) + (R_[2] - 0.5) * 0.4, 0.05 + ph * 0.3, z + (R_[3] - 0.5) * 0.6, 0.25 * (1 - ph), 0.15 + ph * 0.3); } splash.commit();
    towers.forEach((t, i) => { t.userData.search.rotation.y = Math.sin(lt * 0.7 + i) * 1.4; t.userData.search.rotation.x = 0.25; }); isl.userData.beam.rotation.y = lt * 1.1;
    E.driftFX(fog, V(0, 1, z - 10), lt, { w: 40, d: 30, size: 6, alpha: 0.08, wind: V(1, 0.1, 0.4) }); sun.follow(V(0, 0, z));
    camMove(cam, lt / d, V(1.5, 0.9, z + 3.3), V(2.0, 1.5, z + 4.2), V(0, 0.55, z - 0.3), V(-0.3, 0.75, z - 1.2), 50, 50); handheld(cam, 0.012, lt); } };
});

// ============ 17. Next morning, the guards find only the heads. ============
shot('next morning', (S) => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2a3240); scene.fog = new THREE.FogExp2(0x3a4250, 0.03); scene.userData.expo = 1.02; scene.userData.sat = 1.05; scene.userData.warm = 0.02;
  scene.add(new THREE.HemisphereLight(0xe8eef8, 0x3a3a40, 0.85)); const c = A.cell({ bulb: 2.4, front: false }); scene.add(c); const sun_ = new THREE.SpotLight(0xffe8c8, 20, 10, 0.6, 0.6, 1.3); sun_.position.set(-1.5, 3.2, 2.4); sun_.target.position.set(-0.3, 0.4, -1.4); sun_.castShadow = true; scene.add(sun_); scene.add(sun_.target);
  const alarm = new THREE.PointLight(0xff2a1a, 0, 8, 1.4); alarm.position.set(0.5, 2.0, 0.6); scene.add(alarm);
  const bed = c.userData.bed; const bw = bed.getWorldPosition(new THREE.Vector3()); const head = A.dummyHead(); scene.add(head); bed.userData.blanket.visible = false; const hinge = new THREE.Group(); hinge.position.set(bw.x, 0.64, bw.z + 0.95); scene.add(hinge); const bl = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.04, 1.35, 6, 1, 10), mat('cloth', 0x6a7484, { bump: 2 })); bl.position.z = -0.675; bl.castShadow = bl.receiveShadow = true; hinge.add(bl); const bump = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 6, 12), mat('cloth', 0x6a7078, { bump: 2 })); bump.rotation.x = Math.PI / 2; bump.scale.set(1.2, 1, 0.7); scene.add(bump);
  const guard = mk3(scene, { ...GUARD, mocap: 'idle', expr: 'serious' }, V(bw.x + 0.6, 0, bw.z - 0.05), -Math.PI / 2); const g2 = mk3(scene, { ...GUARD, hatColor: '#30384a', seed: 12, pose: 'run', expr: 'shock' }, V(1.6, 0, 1.4), -Math.PI / 2);
  const cam = persp(46, 0.05, 40); const tH = Math.max(1.4, wt('heads', S.t) - S.t - 0.4);
  return { scene, cam, hero: guard, env: false, upd(lt, d) { const kl = AB(clamp01((lt - 0.5) / 0.6)); const hp = V(bw.x, 0.68, bw.z - 0.68);
    const kr = clamp01((lt - tH) / 0.5); if (kr <= 0) { head.position.copy(hp); head.rotation.set(-0.7, 0.4, 0.2); } else { const t = kr; head.position.set(hp.x + t * 0.55, Math.max(0.1, hp.y + 0.15 * Math.sin(t * Math.PI) - t * t * 0.62), hp.z + t * 0.2); head.rotation.set(-0.7 + t * 4, 0.4, 0.2 + t * 3); }
    hinge.rotation.x = kl * 2.3; bump.position.set(bw.x, 0.6, bw.z + 0.2); bump.scale.set(1.15, 1, 0.6);
    hinge.updateMatrixWorld(true); const grabK = clamp01((lt - 0.2) / 0.3); const c1 = hinge.localToWorld(V(0.34, 0.03, -1.28)), c2 = hinge.localToWorld(V(0.34, 0.03, -0.95)); guard.reach(0, grabK > 0 ? c1 : null).reach(1, grabK > 0 ? c2 : null); guard.set({ lean: 0.35 * (1 - kl * 0.6), expr: lt > tH ? 'shock' : (kl > 0.6 ? 'worried' : 'serious'), headPitch: 0.35 }); if (lt > tH) guard.reach(0, null).reach(1, null);
    g2.group.position.set(1.6 - Math.max(0, lt - tH) * 2.4, 0, 1.4); g2.set({ pose: lt > tH ? 'run' : 'stand' });
    alarm.intensity = lt > tH + 0.2 ? 6 * (0.5 + 0.5 * Math.sin(lt * 9)) : 0; scene.userData.warm = lt > tH + 0.2 ? 0.25 : 0.02;
    camMove(cam, lt / d, V(1.0, 1.4, 1.5), V(0.75, 1.15, 1.2), V(bw.x + 0.1, 0.8, bw.z - 0.3), V(bw.x + 0.2, 0.55, bw.z - 0.4), 50, 46); if (lt > tH && lt < tH + 0.3) shake(cam, 0.008, lt); } };
});

// ============ 18. No bodies were ever found. — dawn fog, a paddle drifting near Angel Island ============
shot('no bodies', (S) => {
  const { scene, sun } = bayScene('bayDawn', { sunDir: V(0.7, 0.12, -0.6), expo: 0.95, fd: 0.006, amb: 0.4, warm: 0.15 }); const sea = seaGroup(scene, 0x16242e, 0.03, 9000, { env: 0.3, hz: 0x6a7480, hza: 0.1, ns: 0.25 });
  for (let i = 0; i < 26; i++) { const b = E.boulder(1.2 + Math.random() * 3.5, i); b.position.set(-60 + i * 4.5 + Math.random() * 3, -0.6, -45 - Math.random() * 6); b.scale.y = 1.4; scene.add(b); } const hill = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), W.std(0x5a6050)); hill.scale.set(2.2, 0.35, 0.6); hill.position.set(0, -2, -80); hill.userData.noOutline = true; scene.add(hill);
  const pad = A.paddle(); pad.position.set(0.4, 0.04, 0); pad.rotation.set(0, 0.7, 0); scene.add(pad); const coat = A.raincoat(0x8a8240); coat.rotation.set(-Math.PI / 2, 0, 2); coat.position.set(-1.4, 0.05, -1.2); scene.add(coat);
  const vest = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 10, 20), W.std(0x8a8240)); vest.rotation.x = Math.PI / 2; vest.position.set(1.8, 0.06, -2.5); scene.add(vest);
  const fog = new FX(scene, 200, 'steam'); const gulls = new R.Birds(scene, 6, V(-4, 12, -24), 14); const cam = persp(44, 0.1, 30000);
  return { scene, cam, hero: pad, env: true, envI: 0.5, post: { focus: 4.5 }, upd(lt, d) { sea.update(lt + 30); const y = sea.amp * 0.2 * Math.sin(lt * 1.2); pad.position.y = 0.04 + y; pad.rotation.y = 0.7 + lt * 0.08; coat.position.y = 0.05 + y; vest.position.y = 0.06 + y;
    gulls.update && gulls.update(lt); E.driftFX(fog, V(0, 0.5, -10), lt, { w: 50, d: 30, size: 7, alpha: 0.14, wind: V(1, 0.05, 0.2) }); sun.follow(V(0, 0, 0));
    camMove(cam, lt / d, V(1.6, 2.2, 3.6), V(1.2, 1.8, 3.0), V(0, 0, -1.0), V(-0.2, 0.0, -1.3), 46, 44); handheld(cam, 0.006, lt); } };
});

// ============ 19. Nobody knows if they made it. — the FBI file, UNSOLVED ============
shot('nobody knows if', (S) => {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0e0c0a); scene.fog = new THREE.FogExp2(0x1a1410, 0.05); scene.userData.expo = 1.05; scene.userData.sat = 1.0; scene.userData.warm = 0.3;
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3, 0.08, 1.8), mat('wood', 0x8a6040)); desk.position.y = 0.76; desk.receiveShadow = true; scene.add(desk); scene.add(new THREE.HemisphereLight(0xffe8c8, 0x1a1410, 0.25));
  const file = A.fbiFile(); file.position.set(0, 0.81, 0.05); file.rotation.y = 0.08; scene.add(file); const lamp = A.deskLamp(); lamp.position.set(-0.95, 0.8, -0.45); lamp.rotation.y = -0.3; scene.add(lamp);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 16), W.std(0xf2f2ea, { roughness: 0.3 })); cup.position.set(0.75, 0.85, -0.35); scene.add(cup); const ash = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.03, 16), W.std(0x3a3a3a, { metalness: 0.5 })); ash.position.set(-0.7, 0.81, 0.45); scene.add(ash);
  const smoke = new FX(scene, 60, 'smoke'); const cam = persp(40, 0.05, 30);
  return { scene, cam, hero: null, post: { focus: 0.95 }, env: false, upd(lt, d) { for (let i = 0; i < smoke.n; i++) { const R_ = smoke.R[i]; const ph = (lt * 0.25 + R_[0]) % 1; smoke.set(i, -0.7 + Math.sin(ph * 6 + R_[1] * 6) * 0.05 * ph * 3, 0.84 + ph * 0.9, 0.45 + (R_[2] - 0.5) * 0.06 * ph * 3, 0.25 * Math.sin(ph * Math.PI), 0.04 + ph * 0.25); } smoke.commit();
    camMove(cam, lt / d, V(0.12, 2.15, 0.95), V(0.08, 1.95, 0.8), V(0.0, 0.81, 0.05), V(0.0, 0.81, 0.02), 44, 42); } };
});
stamp('made', 'UNSOLVED', 1.6, '#ff3a2f', 520);

// ============ 20. So... would you have tried? — you, behind the bars, looking at us ============
shot('so would you', (S) => {
  const scene = nightRoom({ hemi: 0.3, fd: 0.03, expo: 1.12, warm: 0.12 }); const c = A.cell({ bulb: 2.2 }); scene.add(c);
  for (const sd of [-1, 1]) { const n = A.cell({ bulb: 1.2, bulbShadow: false }); n.position.x = sd * (A.CW + 0.24); scene.add(n); }
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), A.M.floor()); fl.rotation.x = -Math.PI / 2; fl.position.set(0, -0.01, 1.8); fl.userData.ground = true; scene.add(fl);
  const key = new THREE.SpotLight(0xc8d8ff, 10, 8, 0.5, 0.6, 1.4); key.position.set(0.6, 2.2, 2.6); key.target.position.set(0, 1.3, -0.4); key.castShadow = true; scene.add(key); scene.add(key.target);
  const you = mk(scene, { ...YOU, mocap: 'idle', expr: 'serious', armsOverride: [[2.3, -1.4], [2.3, -1.4]] }, V(0, 0, -0.3), 0);
  const dust = new FX(scene, 70, 'dust', true); const cam = persp(44, 0.05, 40);
  return { scene, cam, hero: you, env: false, upd(lt, d) { motes(dust, [-1, 0.2, 1, 2.2, -2, 1.5], lt, 0.008); you.set({ expr: lt > 1.4 ? 'smug' : 'serious', armsOverride: [[2.35, -1.45], [2.35, -1.45]] });
    camMove(cam, clamp01(lt / 4.0), V(0.0, 1.35, 2.3), V(0.0, 1.38, 1.05), V(0, 1.3, -0.3), V(0, 1.38, -0.3), 46, 44); } };
});

// ---------- timeline ----------
let DUR = 0;
window.setup = async (words, dur) => {
  WORDS = words; DUR = dur; cursor = 0; await document.fonts.load('900 64px Nunito'); await document.fonts.load('800 64px Nunito');
  for (const s of SHOTS) { if (!s.anchor) { s.t = 0; continue; } const i = find(s.anchor); s.t = i >= 0 ? Math.max(0, WORDS[i].s - s.lead) : null; }
  for (let i = 1; i < SHOTS.length; i++) if (SHOTS[i].t == null || SHOTS[i].t <= SHOTS[i - 1].t) SHOTS[i].t = SHOTS[i - 1].t + 1.0;
  SHOTS.forEach((s, i) => s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : dur);
  const res = (arr) => arr.forEach(c => { cursor = 0; if (!c.anchor) { c.t = 0; return; } const i = find(c.anchor); c.t = i >= 0 ? WORDS[i].s - (c.lead || 0) : -99; }); res(CLOCKS); res(STAMPS);
  CAPS = []; for (let i = 0; i < WORDS.length; i++) { const a = WORDS[i], b = WORDS[i + 1]; const ta = a.w.trim(); if (b && ta.length <= 3 && b.w.trim().length <= 6 && !/[.,!?]$/.test(ta) && !/\d/.test(ta + b.w) && b.s - a.e < 0.15) { CAPS.push({ t: ta + ' ' + b.w.trim(), s: a.s, e: b.e }); i++; } else CAPS.push({ t: ta, s: a.s, e: a.e }); }
  for (let i = 0; i < CAPS.length - 1; i++) CAPS[i].e = Math.min(CAPS[i + 1].s, Math.max(CAPS[i].e, CAPS[i].s + 0.12));
  return SHOTS.map(s => [s.anchor, +s.t.toFixed(2), +(s.end - s.t).toFixed(2)]);
};
let CAPS = []; let cur = -1, inst = null;
function activate(i) {
  if (inst) { for (const c of chars) { c.tex.dispose(); c.mesh.material.dispose(); } inst.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.isLight && o.shadow && o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; } }); gl.renderLists.dispose(); }
  chars.length = 0; AUTO.length = 0; _rs = 1 + i * 7919; W.seed(1 + i * 31); A.seed(7 + i * 131); inst = SHOTS[i].build(SHOTS[i]); cur = i; window.INST = inst;
  inst.scene.traverse(o => { if (o.isMesh && (o.material && (o.material.isShaderMaterial || o.material.side === THREE.BackSide || o.material.transparent || o.material.isMeshBasicMaterial))) o.userData.noOutline = true; if (o.isPoints) o.userData.noOutline = true; });
  if (window._env) { window._env.dispose(); window._env = null; }
  if (inst.scene.userData.sky && inst.env !== false) { const es = new THREE.Scene(); es.add(inst.scene.userData.sky.clone()); window._env = PMREM.fromScene(es, 0.04, 1, 20000); inst.scene.environment = window._env.texture; inst.scene.environmentIntensity = inst.envI ?? 0.45; }
  W.outline(inst.scene, 0.0016); inst.grounds = []; inst.scene.traverse(o => { if (o.userData.ground) inst.grounds.push(o); });
}
const RC = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0);
function snapToGround(c) { if (!c.ground || !inst.grounds.length) return; const p = new THREE.Vector3(); c.group.getWorldPosition(p); RC.set(new THREE.Vector3(p.x, p.y + 30, p.z), DOWN); RC.far = 80; const hit = RC.intersectObjects(inst.grounds, false)[0]; if (hit) { const w = new THREE.Vector3(p.x, hit.point.y + 0.02, p.z); c.group.parent.worldToLocal(w); c.group.position.y = w.y; } }
function drawText(ctx, txt, x, y, size, fill = '#fff', stroke = '#1a1a1a', sw = 0.16, scale = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.font = `900 ${size}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = size * 0.18; ctx.shadowOffsetY = size * 0.06; ctx.lineWidth = size * sw; ctx.strokeStyle = stroke; ctx.strokeText(txt, 0, 0); ctx.shadowColor = 'transparent'; ctx.fillStyle = fill; ctx.fillText(txt, 0, 0); ctx.restore(); }
window.PROF = { upd: 0, render: 0 };
window.SUB = 1; window.SHUTTER = 0.5 / 30;
const JIT = [[0, 0], [0.5, 0.5], [-0.5, 0.25], [0.25, -0.5], [-0.25, -0.25], [0.5, -0.25], [-0.5, 0.5], [0.0, 0.5]];
function renderSub(t, i, jx, jy) {
  const s = SHOTS[i], lt = t - s.t, d = s.end - s.t; const lt2 = Math.min(d - 1e-3, Math.max(0, lt));
  const a0 = performance.now(); inst.upd(lt2, d, s.t + lt2); inst.cam.updateMatrixWorld(); for (const f of AUTO) f(lt2); inst.scene.updateMatrixWorld(); for (const c of chars) snapToGround(c); inst.scene.updateMatrixWorld();
  for (const c of chars) { c.resolve(inst.cam, GLH); c.draw(s.t + lt2, c.noBill ? null : inst.cam); } const a1 = performance.now();
  const pp = inst.post || {}; let focus = pp.focus; if (focus == null && inst.hero) { const p = inst.hero.group.getWorldPosition(new THREE.Vector3()); p.y += inst.hero.o.height * 0.6; focus = Math.max(0.3, -p.applyMatrix4(inst.cam.matrixWorldInverse).z); }
  if (focus == null) focus = pp.far ?? 80;
  if (jx || jy) inst.cam.setViewOffset(GLW, GLH, jx, jy, GLW, GLH); else inst.cam.clearViewOffset();
  POST.render(inst.scene, inst.cam, { lift: inst.scene.userData.lift ?? 0.035, vig: inst.scene.userData.vig ?? 0.22, expo: inst.scene.userData.expo * (inst.scene.userData.bright ?? 1.5), sat: inst.scene.userData.sat, warm: inst.scene.userData.warm, ...pp, focus, time: t }); gl.getContext().finish(); const a2 = performance.now(); PROF.upd += a1 - a0; PROF.render += a2 - a1; inst.cam.clearViewOffset();
}
window.renderFrame = (t) => {
  let i = SHOTS.findIndex((s, k) => t >= s.t && t < s.end); if (i < 0) i = SHOTS.length - 1; if (i !== cur) activate(i);
  const s = SHOTS[i], lt = t - s.t, d = s.end - s.t; const n = window.SUB;
  for (let k = 0; k < n; k++) { const ts = n > 1 ? t + (k / n - 0.5) * window.SHUTTER : t; const j = JIT[k % JIT.length]; renderSub(ts, i, n > 1 ? j[0] * SS : 0, n > 1 ? j[1] * SS : 0); octx.globalAlpha = 1 / (k + 1); octx.drawImage(gl.domElement, 0, 0, WIDTH, HEIGHT); }
  octx.globalAlpha = 1;
  if (lt < 0.12 && i > 0) { octx.fillStyle = `rgba(255,255,255,${(0.12 - lt) / 0.12 * 0.18})`; octx.fillRect(0, 0, WIDTH, HEIGHT); }
  const vg = octx.createRadialGradient(540, 960, 560, 540, 960, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,8,20,.14)'); octx.fillStyle = vg; octx.fillRect(0, 0, WIDTH, HEIGHT);
  if (window.NOTEXT) return true;
  for (const c of CLOCKS) { const k = t - c.t; if (k >= 0 && k < 2.4) { const pop = k < 0.15 ? 0.6 + k / 0.15 * 0.5 : (k < 0.25 ? 1.1 - (k - 0.15) : 1); const a = k > 2.1 ? (2.4 - k) / 0.3 : 1; octx.save(); octx.globalAlpha = a; octx.translate(540, 300); octx.scale(pop, pop); octx.font = '900 84px Nunito'; const w = octx.measureText(c.text).width + 90; octx.fillStyle = 'rgba(10,22,44,.9)'; octx.strokeStyle = '#ffd23f'; octx.lineWidth = 8; octx.beginPath(); octx.roundRect(-w / 2, -66, w, 132, 66); octx.fill(); octx.stroke(); drawText(octx, c.text, 0, 4, 84, '#ffd23f', '#111', 0.0); octx.restore(); } }
  for (const st of STAMPS) { const k = t - st.t; if (k >= 0 && k < st.dur) { const pop = k < 0.12 ? 0.5 + k / 0.12 * 0.7 : (k < 0.22 ? 1.2 - (k - 0.12) * 2 : 1); const a = k > st.dur - 0.2 ? (st.dur - k) / 0.2 : 1; octx.save(); octx.globalAlpha = a; octx.font = '900 150px Nunito'; const fw = Math.min(1, 940 / octx.measureText(st.text).width); drawText(octx, st.text, 540, st.y, 150, st.color, '#111', 0.14, pop * fw); octx.restore(); } }
  const cp = CAPS.find(c => t >= c.s && t < c.e + 0.05); if (cp) { const k = t - cp.s; const sc = k < 0.08 ? 0.85 + k / 0.08 * 0.15 : 1; drawText(octx, cp.t, 540, 1340, 92, '#ffffff', '#141414', 0.13, sc); }
  return true;
};
window.THREE = THREE; window.grab = () => out.toDataURL('image/png');
window.ready = true;
