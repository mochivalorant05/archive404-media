// Pompeii kit: Mediterranean sky, Vesuvius, basalt streets, Roman houses, forum, temple, shops, props, trees, birds.
import * as THREE from 'three';
import { T, mat, uvBox, uvPlane } from './tex.js';
import { box, std, rnd, seed, bake } from './world.js';
import { dressHouse, clutter, pot, amph } from './dress.js';
export { clutter };
export { T, mat };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const shadowAll = (g) => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
const cl = v => Math.max(0, Math.min(1, v));
function uvCyl(geo, r, h, s = 2) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * Math.PI * r / s, uv.getY(i) * h / s); uv.needsUpdate = true; return geo; }
function canvasTex(w, h, f) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// ---------------- sky + light ----------------
export const SKY = {
  morning: { c: [0x3f7fc4, 0x9cc4e4, 0xf4e2c4], fog: 0xd8dccc, fd: 0.0035, hemi: [0xfff4e0, 0x6a5a40, 1.4], sun: [0xfff0d0, 3.2], cloud: 0.45 },
  noon: { c: [0x3a78c8, 0x8ec0ea, 0xe8ecdc], fog: 0xd4dcd8, fd: 0.003, hemi: [0xffffff, 0x6a6048, 1.5], sun: [0xfffaf0, 3.4], cloud: 0.35 },
  sepia: { c: [0x7a6448, 0xc8a878, 0xead2a4], fog: 0xc8a878, fd: 0.006, hemi: [0xffe8c0, 0x5a4026, 1.5], sun: [0xffd8a0, 2.6], cloud: 0.4 },
  erupt: { c: [0x4a6a8c, 0x9aa8a8, 0xd8c8a8], fog: 0xb8b0a0, fd: 0.004, hemi: [0xf0e8d8, 0x5a5040, 1.4], sun: [0xffe8c8, 2.6], cloud: 0.3 },
  ashfall: { c: [0x2a2622, 0x4a423a, 0x6a5e50], fog: 0x5a5248, fd: 0.02, hemi: [0xc8b8a0, 0x2a241e, 0.9], sun: [0xc8a080, 0.7], cloud: 0.0 },
  night: { c: [0x0c0a0a, 0x1e1814, 0x3a2a1e], fog: 0x241c16, fd: 0.025, hemi: [0x8a6a50, 0x100c0a, 0.55], sun: [0x8a6a50, 0.25], cloud: 0.0 },
  dawnash: { c: [0x3a3634, 0x6a5a4a, 0xa8784a], fog: 0x7a6650, fd: 0.008, hemi: [0xd8c0a0, 0x3a3028, 1.0], sun: [0xffb070, 1.4], cloud: 0.0 },
  buried: { c: [0x6a7e94, 0xa8b0b0, 0xd0ccc0], fog: 0xc0bcb2, fd: 0.004, hemi: [0xe8e8e0, 0x5a5650, 1.4], sun: [0xfff0e0, 2.4], cloud: 0.5 },
  modern: { c: [0x3c7cc8, 0x94c4ea, 0xece4cc], fog: 0xd8dcd0, fd: 0.0028, hemi: [0xfff8e8, 0x6a6048, 1.5], sun: [0xfff6e0, 3.3], cloud: 0.5 },
};
export function sky(scene, mode = 'morning') {
  const P = SKY[mode]; const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(P.c[0]) }, mid: { value: new THREE.Color(P.c[1]) }, hor: { value: new THREE.Color(P.c[2]) }, cl: { value: P.cloud }, sunDir: { value: V(-0.5, 0.45, 0.3).normalize() } },
    vertexShader: 'varying vec3 vp; void main(){ vp=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top,mid,hor,sunDir; uniform float cl; varying vec3 vp;
      float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*vn(p); p*=2.03; a*=.5; } return s; }
      void main(){ float h=clamp(vp.y,0.,1.); vec3 c=mix(hor,mid,smoothstep(0.,.2,h)); c=mix(c,top,smoothstep(.2,.75,h));
        vec2 q = vp.xz/(vp.y+0.18)*1.6; float n = fbm(q*1.3+vec2(3.,1.)); float k = smoothstep(.5,.78,n)*smoothstep(0.015,.25,h)*cl*2.;
        float lit = clamp(fbm(q*1.3+vec2(3.,1.)+sunDir.xz*0.25)-n+0.5,0.,1.);
        vec3 cc = mix(mix(hor,vec3(.72,.72,.74),.4), vec3(1.,.98,.94), lit); c = mix(c, cc, clamp(k,0.,1.));
        float s = max(0.,dot(vp,sunDir)); c += vec3(1.,.85,.6)*pow(s,200.)*1.5*cl + vec3(1.,.8,.5)*pow(s,8.)*.12*cl;
        gl_FragColor=vec4(c,1.); }` });
  const s = new THREE.Mesh(new THREE.SphereGeometry(7000, 48, 24), m); s.renderOrder = -10; s.userData.noOutline = true; s.frustumCulled = false; scene.add(s); scene.userData.sky = s;
  scene.fog = new THREE.FogExp2(P.fog, P.fd * (P.fd < 0.01 ? 0.6 : 1)); return s;
}
export function lights(scene, mode = 'morning', ext = 30) {
  const P = SKY[mode]; const hemi = new THREE.HemisphereLight(P.hemi[0], P.hemi[1], P.hemi[2] * 0.85); scene.add(hemi);
  const d = new THREE.DirectionalLight(P.sun[0], P.sun[1] * 1.25); d.position.set(-30, 42, 24); d.castShadow = true; d.shadow.mapSize.set(3072, 3072);
  Object.assign(d.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 200 }); d.shadow.bias = -0.0003; d.shadow.normalBias = 0.03;
  scene.add(d); scene.add(d.target); d.userData.hemi = hemi; return d;
}
// add distance haze to a material that ignores scene fog (far mountains, sea)
export function hazeMat(m, color, amt = 0.35) {
  m.fog = false; m.userData.haze = { value: amt }; m.userData.hazeC = { value: new THREE.Color(color) };
  m.onBeforeCompile = (sh) => { sh.uniforms.hz = m.userData.haze; sh.uniforms.hzC = m.userData.hazeC; sh.fragmentShader = 'uniform float hz; uniform vec3 hzC;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor.rgb = mix(gl_FragColor.rgb, hzC, hz);'); };
  return m;
}

// ---------------- Vesuvius ----------------
// state: 'green' (pre-eruption), 'grey' (after the surges), 'modern' (bare dark cone)
export function vesuvius({ H = 380, R = 1500, seg = 220, state = 'green', haze = 0x9cb4c8, hazeAmt = 0.32 } = {}) {
  const geo = new THREE.PlaneGeometry(R * 2.6, R * 2.6, seg, seg); geo.rotateX(-Math.PI / 2); const p = geo.attributes.position; const col = new Float32Array(p.count * 3);
  const hsh = (x, y) => { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); const a = hsh(ix, iy), b = hsh(ix + 1, iy), c = hsh(ix, iy + 1), d = hsh(ix + 1, iy + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
  const fbm = (x, y) => { let s = 0, a = 0.5; for (let i = 0; i < 5; i++) { s += a * vn(x, y); x *= 2.02; y *= 2.02; a *= 0.5; } return s; };
  const rc = R * 0.09;
  const hAt = (x, z) => { const r = Math.hypot(x, z), th = Math.atan2(z, x); const k = cl(r / R);
    let h = H * Math.pow(1 - k, 1.7) * (1 - 0.05 * Math.cos(th * 2 + 0.7));
    const gully = Math.pow(Math.abs(Math.sin(th * 26 + fbm(x * 0.004, z * 0.004) * 6)), 3) * (1 - k) * k * 4; h -= gully * H * 0.035;
    h += (fbm(x * 0.006, z * 0.006) - 0.5) * H * 0.12 * (1 - k * 0.6);
    if (r < rc) h -= H * 0.14 * Math.pow(1 - r / rc, 1.5);
    if (r > R) h = (fbm(x * 0.01, z * 0.01) - 0.5) * 6 - 2; return Math.max(h, -2); };
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); const h = hAt(x, z); p.setY(i, h);
    const hn = h / H; const n = fbm(x * 0.02, z * 0.02), rows = 0.5 + 0.5 * Math.sin(r * 0.35 + n * 4);
    let c;
    if (state === 'green') {
      const vine = [0.36 + rows * 0.1, 0.5 + rows * 0.1, 0.2], forest = [0.16, 0.32, 0.14], rock = [0.42, 0.36, 0.3], fields = [0.62, 0.58, 0.32];
      c = hn < 0.18 ? (n > 0.5 ? vine : fields.map((v, j) => v * 0.8 + vine[j] * 0.2)) : hn < 0.72 ? (hn < 0.32 ? vine.map((v, j) => v + (forest[j] - v) * ((hn - 0.18) / 0.14)) : forest) : forest.map((v, j) => v + (rock[j] - v) * cl((hn - 0.72) * 5));
      c = c.map(v => v * (0.82 + n * 0.3));
    } else if (state === 'grey') { const g = 0.25 + n * 0.1 - hn * 0.04; c = [g, g * 0.97, g * 0.93]; }
    else { const g = 0.3 + n * 0.12; c = hn < 0.4 ? [0.3 + n * 0.1, 0.42 + n * 0.1, 0.22] : [g, g * 0.92, g * 0.86]; }
    if (r > R) c = state === 'green' || state === 'modern' ? [0.4 + n * 0.1, 0.48 + n * 0.12, 0.26] : [0.55, 0.53, 0.5];
    col.set(c, i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  geo.attributes.uv.array.forEach((v, i, a) => a[i] = v * 160);
  const m = hazeMat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, bumpMap: T.earth.bump, bumpScale: 4 }), haze, hazeAmt * 0.6);
  const mesh = new THREE.Mesh(geo, m); mesh.receiveShadow = false; mesh.castShadow = false; mesh.userData.noOutline = true;
  const g = new THREE.Group(); g.add(mesh); g.userData.crater = V(0, H * 0.9, 0); g.userData.mat = m;
  // scattered villas + umbrella pines on the lower slopes (instanced, distant)
  if (state === 'green') {
    seed(91); const n = 5200; const tg = new THREE.IcosahedronGeometry(1, 1); tg.scale(1, 0.5, 1); tg.translate(0, 0.6, 0); const tm = new THREE.InstancedMesh(tg, hazeMat(std(0xffffff, { roughness: 1 }), haze, hazeAmt * 0.8), n);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V(1, 1, 1), C = new THREE.Color(); let k = 0;
    for (let i = 0; i < n * 4 && k < n; i++) { const cl0 = Math.floor(i / 6); seed(1000 + cl0 * 7); const a0 = rnd() * 6.283, r0 = R * (0.12 + rnd() * 0.9); seed(5000 + i * 13); const a = a0 + (rnd() - 0.5) * 30 / r0, r = r0 + (rnd() - 0.5) * 40; const x = Math.cos(a) * r, z = Math.sin(a) * r; const kk = r / R; if (kk > 0.98 || kk < 0.1) continue; const fr = fbm(x * 0.003 + 9, z * 0.003); if (fr < 0.42 && kk > 0.45) continue;
      const y = hAt(x, z) - 1; const s = (kk < 0.4 ? 4 : 5.5) + rnd() * 4; M.compose(V(x, y, z), Q, S.set(s, s * (0.8 + rnd() * 0.5), s)); tm.setMatrixAt(k, M); const gsh = 0.75 + rnd() * 0.4; C.setRGB(0.13 * gsh, (0.25 + rnd() * 0.06) * gsh, 0.1 * gsh); tm.setColorAt(k, C); k++; }
    tm.count = k; tm.userData.noOutline = true; g.add(tm);
    const vb = new THREE.BoxGeometry(1, 1, 1); const vm = new THREE.InstancedMesh(vb, hazeMat(std(0xffffff), haze, hazeAmt), 160); const rb = new THREE.ConeGeometry(0.75, 0.45, 4, 1); rb.rotateY(Math.PI / 4); const rm = new THREE.InstancedMesh(rb, hazeMat(std(0xb8583a, { roughness: 0.8 }), haze, hazeAmt), 160); k = 0;
    for (let i = 0; i < 800 && k < 160; i++) { seed(9000 + i * 17); const a = rnd() * 6.283, r = R * (0.5 + rnd() * 0.48); const x = Math.cos(a) * r, z = Math.sin(a) * r; const y = hAt(x, z) + 1.5; const ry = rnd() * 3, sx = 12 + rnd() * 16, sz = 8 + rnd() * 10;
      M.compose(V(x, y, z), Q.setFromAxisAngle(V(0, 1, 0), ry), S.set(sx, 6, sz)); vm.setMatrixAt(k, M); C.setRGB(0.92, 0.86, 0.74); vm.setColorAt(k, C); M.compose(V(x, y + 3 + 2.2, z), Q, S.set(sx * 1.45, 10, sz * 1.45)); rm.setMatrixAt(k, M); k++; }
    rm.count = k; rm.userData.noOutline = true; g.add(rm);
    vm.count = k; vm.userData.noOutline = true; g.add(vm);
  }
  return g;
}
// Bay of Naples
export class Sea {
  constructor(scene, size = 9000, seg = 160, color = 0x2a6a8c) { this.geo = new THREE.PlaneGeometry(size, size, seg, seg); this.geo.rotateX(-Math.PI / 2); this.base = this.geo.attributes.position.array.slice();
    if (!Sea.N) { const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d'); const im = c.createImageData(N, N); const H = new Float32Array(N * N);
      const w = [[3, 1, 0.5], [1, 4, 0.35], [7, -3, 0.2], [-5, 9, 0.12], [13, 6, 0.08], [-17, 11, 0.06], [23, -19, 0.04]];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let h = 0; for (const [a, b, k] of w) h += Math.sin((x * a + y * b) / N * 6.2832 + a * 1.3) * k; H[y * N + x] = h; }
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = H[y * N + (x + 1) % N] - H[y * N + (x - 1 + N) % N], dy = H[((y + 1) % N) * N + x] - H[((y - 1 + N) % N) * N + x]; const nx = -dx * 18, ny = -dy * 18, l = Math.hypot(nx, ny, 1); const k = (y * N + x) * 4; im.data[k] = (nx / l * 0.5 + 0.5) * 255; im.data[k + 1] = (ny / l * 0.5 + 0.5) * 255; im.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; im.data[k + 3] = 255; }
      c.putImageData(im, 0, 0); Sea.N = new THREE.CanvasTexture(cv); Sea.N.wrapS = Sea.N.wrapT = THREE.RepeatWrapping; Sea.N.userData.keep = true; }
    const nm = Sea.N.clone(); nm.needsUpdate = true; nm.repeat.set(size / 40, size / 40); this.nm = nm;
    this.mesh = new THREE.Mesh(this.geo, hazeMat(new THREE.MeshStandardMaterial({ color, roughness: 0.22, metalness: 0.1, normalMap: nm, normalScale: new THREE.Vector2(0.6, 0.6), envMapIntensity: 2.2 }), 0xb8c8d0, 0.2)); this.mesh.userData.noOutline = true; scene.add(this.mesh); this.amp = 0.6; }
  update(t) { const p = this.geo.attributes.position.array, b = this.base; for (let i = 0; i < p.length; i += 3) { const x = b[i], z = b[i + 2]; p[i + 1] = this.amp * (Math.sin(x * 0.02 + t * 0.9) * 0.6 + Math.sin(z * 0.03 - t * 0.7) * 0.5 + Math.sin((x - z) * 0.08 + t * 1.6) * 0.15); } this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals();  this.nm.offset.set(t * 0.004, t * 0.002); }
}

// ---------------- street: basalt road, raised sidewalks, stepping stones, ruts ----------------
export function street({ w = 4.2, len = 60, walk = 1.7, stones = [0], seg = 240, ruts = true } = {}) {
  const g = new THREE.Group(); const t = T.basalt;
  const geo = new THREE.PlaneGeometry(w, len, 70, seg); geo.rotateX(-Math.PI / 2); uvPlane(geo, w, len, 3.2);
  const p = geo.attributes.position; if (ruts) for (let i = 0; i < p.count; i++) { const x = p.getX(i); const d = Math.min(Math.abs(x - 0.72), Math.abs(x + 0.72)); p.setY(i, -0.06 * Math.max(0, 1 - d / 0.09) - 0.03 * (x * x) / (w * w / 4) ); }
  geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ map: t.map, bumpMap: t.bump, bumpScale: 4, roughnessMap: t.rough, roughness: 1, displacementMap: t.bump, displacementScale: 0.09, displacementBias: -0.05 });
  m.color.setScalar(1.7); const road = new THREE.Mesh(geo, m); road.receiveShadow = true; road.userData.ground = true; road.userData.noOutline = true; g.add(road);
  for (const sd of [-1, 1]) {
    const sw = box(walk, 0.38, len, mat('coccio', 0xffffff, { bump: 2 }), 1.4); sw.position.set(sd * (w / 2 + walk / 2), 0.19, 0); sw.userData.ground = true; sw.receiveShadow = true; g.add(sw);
    const curb = box(0.22, 0.42, len, mat('basalt', 0xd0d0d0, { bump: 3 }), 1.0); curb.position.set(sd * (w / 2 + 0.11), 0.21, 0); g.add(curb);
  }
  const st = []; for (const z of stones) for (const x of [-1.25, 0, 1.25]) { const sgeo = new THREE.CylinderGeometry(0.42, 0.48, 0.42, 20, 2); sgeo.scale(1, 1, 0.62); const s = new THREE.Mesh(sgeo, mat('basalt', 0xd8d8d8, { bump: 3 })); s.position.set(x, 0.19, z); s.userData.ground = true; s.castShadow = s.receiveShadow = true; g.add(s); st.push(s); }
  g.userData.walkY = 0.38; g.userData.w = w; g.userData.walk = walk; return g;
}

// painted electoral notices + scratched graffiti on a canvas texture
export function graffitiTex(kind = 'mixed', w = 1024, h = 512) {
  return canvasTex(w, h, (c) => {
    c.clearRect(0, 0, w, h);
    const red = (txt, x, y, s, rot = 0) => { c.save(); c.translate(x, y); c.rotate(rot); c.font = `900 ${s}px Georgia`; c.fillStyle = 'rgba(160,30,24,.92)'; c.textAlign = 'center'; c.fillText(txt, 0, 0); c.restore(); };
    const scratch = (f) => { c.save(); c.strokeStyle = 'rgba(40,30,24,.75)'; c.lineWidth = 3; c.lineCap = 'round'; f(); c.restore(); };
    if (kind === 'election' || kind === 'mixed') { red('CN · HELVIVM · SABINVM', w * 0.5, h * 0.2, 64); red('AED · O · V · F', w * 0.5, h * 0.36, 58); }
    if (kind === 'gladiator' || kind === 'mixed') scratch(() => {
      const fig = (x, y, s, dir) => { c.beginPath(); c.arc(x, y - 60 * s, 12 * s, 0, 7); c.moveTo(x, y - 48 * s); c.lineTo(x, y); c.moveTo(x, y); c.lineTo(x - 16 * s, y + 40 * s); c.moveTo(x, y); c.lineTo(x + 16 * s, y + 40 * s); c.moveTo(x, y - 36 * s); c.lineTo(x + dir * 34 * s, y - 50 * s); c.moveTo(x + dir * 34 * s, y - 50 * s); c.lineTo(x + dir * 70 * s, y - 70 * s); c.moveTo(x, y - 36 * s); c.lineTo(x - dir * 22 * s, y - 16 * s); c.stroke(); c.beginPath(); c.ellipse(x - dir * 26 * s, y - 20 * s, 14 * s, 24 * s, 0, 0, 7); c.stroke(); };
      fig(w * 0.2, h * 0.78, 1.3, 1); fig(w * 0.36, h * 0.78, 1.3, -1); c.font = 'italic 32px Georgia'; c.fillStyle = 'rgba(40,30,24,.8)'; c.fillText('CELADVS', w * 0.18, h * 0.95); c.fillText('SVSPIRIVM PVELLARVM', w * 0.62, h * 0.62);
      c.font = 'italic 30px Georgia'; c.fillText('VIII', w * 0.29, h * 0.52); });
    if (kind === 'insult' || kind === 'mixed') scratch(() => { c.font = 'italic 36px Georgia'; c.fillStyle = 'rgba(40,30,24,.85)'; c.fillText('SAMIVS · CORNELIO · SVSPENDERE', w * 0.62, h * 0.86); c.beginPath(); c.arc(w * 0.85, h * 0.7, 30, 0, 7); c.moveTo(w * 0.83, h * 0.69); c.lineTo(w * 0.84, h * 0.69); c.moveTo(w * 0.87, h * 0.69); c.lineTo(w * 0.88, h * 0.69); c.moveTo(w * 0.83, h * 0.74); c.lineTo(w * 0.87, h * 0.74); c.stroke(); });
  });
}
export function decal(tex, w, h) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false })); m.userData.noOutline = true; m.receiveShadow = true; return m; }

// ---------------- Roman street house ----------------
// local: front faces +Z at z=0, width along X. Options: floors (1/2), door, shop (wide opening), balcony, color tint
const TINT = [0xffffff, 0xfff0e0, 0xf4e8ff, 0xffe8d8, 0xffffff, 0xf0fff0];
export function rhouse(o = {}) {
  const w = o.w ?? 7, d = o.d ?? 8, floors = o.floors ?? (rnd() < 0.5 ? 1 : 2), H1 = 4.2, H2 = 3.2, g = new THREE.Group(); const H = H1 + (floors > 1 ? H2 : 0);
  const wm = mat('rwall', o.tint ?? TINT[Math.floor(rnd() * TINT.length)], { bump: 2.4 }); const wood = mat('wood', 0xffffff), planks = mat('planks', 0xb08868);
  const back = box(w, H, d, wm, 4.2); back.position.set(0, H / 2, -d / 2 - 0.25); g.add(back);
  // facade broken into piers around openings
  const ops = []; const door = o.door ?? true, shop = o.shop ?? (rnd() < 0.6);
  if (door) ops.push({ x: o.doorX ?? (-w / 2 + 1.5), ow: 1.6, oh: 3.0, kind: 'door' }); if (shop) ops.push({ x: o.shopX ?? (w / 2 - 2.3), ow: 2.8, oh: 3.2, kind: 'shop' });
  ops.sort((a, b) => a.x - b.x); let x0 = -w / 2; const fz = 0.0, th = 0.5;
  const pier = (a, b) => { if (b - a < 0.05) return; const p = box(b - a, H1, th, wm, 4.2); p.position.set((a + b) / 2, H1 / 2, fz - th / 2); g.add(p); };
  for (const op of ops) { pier(x0, op.x - op.ow / 2); const lt = box(op.ow, H1 - op.oh, th, wm, 4.2); lt.position.set(op.x, op.oh + (H1 - op.oh) / 2, fz - th / 2); g.add(lt);
    // lintel beam
    const ln = box(op.ow + 0.3, 0.22, 0.24, wood, 1); ln.position.set(op.x, op.oh + 0.1, fz + 0.02); g.add(ln);
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(op.ow, op.oh), std(0x1a120c)); dark.position.set(op.x, op.oh / 2, fz - th + 0.02); dark.userData.noOutline = true; g.add(dark);
    if (op.kind === 'door') { for (const sd of [-1, 1]) { const leaf = box(op.ow / 2 - 0.04, op.oh - 0.05, 0.09, planks, 1.2); const piv = new THREE.Group(); piv.position.set(op.x + sd * op.ow / 2, 0, fz - 0.28); leaf.position.set(-sd * (op.ow / 4 - 0.02), op.oh / 2, 0); piv.add(leaf); for (let k = 0; k < 12; k++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), std(0xb08a3a, { metalness: 0.8, roughness: 0.35 })); st.position.set(-sd * (0.12 + (k % 3) * 0.24), 0.5 + Math.floor(k / 3) * 0.7, 0.06); piv.add(st); } piv.rotation.y = sd * (o.doorOpen ?? 0); g.add(piv); (g.userData.doors = g.userData.doors || []).push(piv); }
      const thr = box(op.ow + 0.2, 0.08, 0.5, mat('basalt', 0xffffff), 1); thr.position.set(op.x, 0.04, fz - 0.25); g.add(thr); }
    if (op.kind === 'shop') { // groove for shutters + some shutters leaning
      const thr = box(op.ow, 0.1, 0.5, mat('travertine', 0xffffff), 1); thr.position.set(op.x, 0.05, fz - 0.25); g.add(thr);
      for (let k = 0; k < 3; k++) { const s = box(0.5, 2.6, 0.06, planks, 1); s.position.set(op.x + op.ow / 2 - 0.3 - k * 0.12, 1.3, fz - 0.45 - k * 0.07); s.rotation.x = 0.06; g.add(s); }
      g.userData.shop = V(op.x, 0, fz); }
    x0 = op.x + op.ow / 2; }
  pier(x0, w / 2);
  // upper floor: set back slightly, small windows, optional wooden balcony
  if (floors > 1) { const up = box(w, H2, th, wm, 4.2); up.position.set(0, H1 + H2 / 2, fz - th / 2); g.add(up);
    const nW = Math.max(1, Math.floor(w / 2.6)); for (let i = 0; i < nW; i++) { const x = -w / 2 + (i + 0.5) * w / nW; const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.75), std(0x1a120c)); win.position.set(x, H1 + 1.5, fz + 0.005); win.userData.noOutline = true; g.add(win); const sill = box(0.8, 0.08, 0.14, mat('travertine', 0xffffff), 1); sill.position.set(x, H1 + 1.08, fz + 0.05); g.add(sill); for (const sd of [-1, 1]) { const sh = box(0.3, 0.75, 0.04, planks, 1); sh.position.set(x + sd * 0.48, H1 + 1.5, fz + 0.04); sh.rotation.y = sd * 0.3; g.add(sh); } }
    if (o.balcony ?? rnd() < 0.35) { const bw = Math.min(w - 1, 4.5), bx = (rnd() - 0.5) * (w - bw) * 0.6; const fl = box(bw, 0.14, 1.2, planks, 1); fl.position.set(bx, H1 + 0.05, 0.6); g.add(fl); for (let k = 0; k <= 6; k++) { const pst = box(0.08, 1.0, 0.08, wood, 1); pst.position.set(bx - bw / 2 + k * bw / 6, H1 + 0.6, 1.15); g.add(pst); } const rail = box(bw, 0.08, 0.1, wood, 1); rail.position.set(bx, H1 + 1.1, 1.15); g.add(rail); for (const xx of [-bw / 2, bw / 2]) { const br = box(0.12, 0.12, 1.1, wood, 1); br.position.set(bx + xx, H1 - 0.15, 0.55); g.add(br); } } }
  // low hip roof of terracotta tiles with eave overhang
  const rh = 1.0, ov = 0.55; const rg = new THREE.ConeGeometry(1, 1, 4, 1); rg.rotateY(Math.PI / 4); rg.scale((w + ov * 2) / Math.SQRT2 * 1.0, rh, (d + 0.5 + ov * 2) / Math.SQRT2); const uv = rg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 1.6, uv.getY(i) * 3);
  const roof = new THREE.Mesh(rg, mat('tiles', 0xffd0b0, { bump: 3 })); roof.position.set(0, H + rh / 2 + 0.05, -d / 2 - 0.25); g.add(roof); g.userData.roof = roof;
  const eave = box(w + ov * 2, 0.16, 0.3, mat('tiles', 0xffd0b0), 1); eave.position.set(0, H + 0.05, fz + ov - 0.1); g.add(eave);
  // antefixes along the eave
  for (let k = 0; k < Math.floor(w / 0.6); k++) { const a = new THREE.Mesh(new THREE.CircleGeometry(0.13, 10, 0, Math.PI), std(0xb06a44, { side: THREE.DoubleSide })); a.position.set(-w / 2 - ov + 0.3 + k * 0.6, H + 0.13, fz + ov + 0.06); g.add(a); }
  // painted election notice / graffiti on some facades
  if (o.notice ?? rnd() < 0.5) { const dc = decal(graffitiTex(rnd() < 0.6 ? 'election' : 'mixed'), Math.min(3.2, w * 0.45), 1.6); dc.position.set((rnd() - 0.5) * w * 0.3, 2.6 + (floors > 1 ? 0 : 0), fz + 0.01); g.add(dc); }
  g.userData.top = H + rh; g.userData.H = H; g.userData.H1 = H1; g.userData.w = w; g.userData.d = d;
  shadowAll(g); if (o.dress !== false) { const n0 = g.children.length; dressHouse(g, { w, H, H1, floors, shopX: o.shopX ?? (w / 2 - 2.3), doorX: o.doorX ?? (-w / 2 + 1.5), shop, door }); for (let i = n0; i < g.children.length; i++) g.children[i].traverse(m => { if (m.isMesh) { const tr = m.material.transparent || m.material.alphaTest > 0 || m.isMesh && m.material.isMeshBasicMaterial; m.castShadow = !tr; m.receiveShadow = true; } }); }
  if (o.bake !== false) bake(g); return g;
}
// a street of Roman houses on both sides (along Z), facing the road
export function streetSet({ len = 60, w = 4.2, walk = 1.7, seedv = 7, stones = [0], fountain = null, gapZ = null } = {}) {
  seed(seedv); const g = new THREE.Group(); const st = street({ w, len, walk, stones }); g.add(st); g.userData.street = st; const Hs = [];
  for (const sd of [-1, 1]) { let z = len / 2 - 0.5; while (z > -len / 2 + 3) { const hw = 6 + rnd() * 4; if (gapZ && sd === gapZ[0] && z - hw < gapZ[2] && z > gapZ[1]) { z -= hw; continue; } const h = rhouse({ w: hw, floors: rnd() < 0.55 ? 2 : 1 }); h.position.set(sd * (w / 2 + walk), 0, z - hw / 2); h.rotation.y = -sd * Math.PI / 2; g.add(h); Hs.push(h); h.userData.side = sd; z -= hw + 0.02; } }
  if (fountain) { const f = streetFountain(); f.position.set(fountain[0], 0.38, fountain[1]); g.add(f); g.userData.fountain = f; }
  g.userData.houses = Hs; return g;
}
export function streetFountain() { const g = new THREE.Group(); const bm = mat('basalt', 0xe0e0e0, { bump: 3 });
  for (const [w, d, x, z] of [[1.9, 0.22, 0, 0.6], [1.9, 0.22, 0, -0.6], [0.22, 1.4, 0.85, 0], [0.22, 1.4, -0.85, 0]]) { const s = box(w, 0.75, d, bm, 1); s.position.set(x, 0.375, z); g.add(s); }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), new THREE.MeshStandardMaterial({ color: 0x3a6a7a, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.85 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.62; water.userData.noOutline = true; g.add(water); g.userData.water = water;
  const post = box(0.5, 1.3, 0.4, bm, 1); post.position.set(0, 0.65, -0.9); g.add(post); const face = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat('marble', 0xffffff)); face.scale.z = 0.5; face.position.set(0, 1.0, -0.68); g.add(face);
  g.userData.spout = V(0, 0.95, -0.6); return shadowAll(g); }

// instanced skyline of low Roman roofs (distant city)
const PLc = [0xe8d4a8, 0xf2e6cc, 0xd8a878, 0xeac898, 0xb86a4a, 0xf0e0c0];
export function town(scene, { n = 400, area = [-200, 200, -200, -20], exclude = [], seedv = 4, grey = 0, grid = [46, 92, 7], hmul = 1, oval = null } = {}) {
  seed(seedv); const wallGeo = new THREE.BoxGeometry(1, 1, 1); wallGeo.translate(0, 0.5, 0); const roofGeo = new THREE.ConeGeometry(0.72, 1, 4, 1); roofGeo.rotateY(Math.PI / 4); roofGeo.translate(0, 0.5, 0);
  const wallM = mat('rwall', 0xffffff, { bump: 1.2 }), roofM = mat('tiles', 0xffffff, { bump: 1.2 });
  const N = n * 3; const iw = new THREE.InstancedMesh(wallGeo, wallM, N), ir = new THREE.InstancedMesh(roofGeo, roofM, N); const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = V(1, 1, 1), P = V(0, 0, 0), C = new THREE.Color();
  const gardens = []; const trees = []; let k = 0; const [gx, gz, sw] = grid; const G = new THREE.Color(0x9a968e);
  const ok = (x, z) => !exclude.some(e => x > e[0] && x < e[1] && z > e[2] && z < e[3]) && (!oval || ((x - oval[0]) / oval[2]) ** 2 + ((z - oval[1]) / oval[3]) ** 2 < 1);
  for (let bx = Math.floor(area[0] / gx) * gx; bx < area[1] && k < N; bx += gx) for (let bz = Math.floor(area[2] / gz) * gz; bz < area[3] && k < N; bz += gz) {
    const x0 = bx + sw / 2, x1 = bx + gx - sw / 2, z0 = bz + sw / 2, z1 = bz + gz - sw / 2; if (!ok((x0 + x1) / 2, (z0 + z1) / 2)) continue;
    // lots along the two long (z) sides of the insula, each with a front range and rear range around an atrium court
    const half = (x1 - x0) / 2; for (const side of [0, 1]) { let z = z0; while (z < z1 - 3 && k < N - 2) { const lw = Math.min(z1 - z, 7 + rnd() * 9); const lx = side ? x1 - half / 2 : x0 + half / 2; const cz = z + lw / 2;
        if (!ok(lx, cz)) { z += lw; continue; } if (rnd() < 0.12) { gardens.push([lx, cz, half - 0.6, lw - 0.6]); for (let t = 0; t < 3; t++) trees.push([lx + (rnd() - 0.5) * half * 0.7, cz + (rnd() - 0.5) * lw * 0.7]); z += lw; continue; }
        const h = (3.8 + rnd() * 4 + (rnd() < 0.15 ? 3 : 0)) * hmul; const dep = half - 0.3;
        const parts = rnd() < 0.55 ? [[0.0, 0.42], [0.62, 0.38]] : [[0, 1]];
        for (const [o0, f] of parts) { const dd = dep * f; const px = side ? x1 - o0 * dep - dd / 2 : x0 + o0 * dep + dd / 2; const hh = h * (o0 > 0 ? 0.85 : 1);
          M.compose(P.set(px, 0, cz), Q.identity(), S.set(dd, hh, lw - 0.25)); iw.setMatrixAt(k, M); C.setHex(PLc[(rnd() * PLc.length) | 0]); if (grey) C.lerp(G, grey); iw.setColorAt(k, C);
          M.compose(P.set(px, hh, cz), Q.setFromAxisAngle(V(0, 1, 0), 0), S.set(dd * 1.4, 1.1 + rnd() * 0.8, (lw - 0.25) * 1.4)); ir.setMatrixAt(k, M); C.setHSL(0.03 + rnd() * 0.03, 0.55 + rnd() * 0.15, 0.36 + rnd() * 0.14); if (grey) C.lerp(new THREE.Color(0x8a8680), grey); ir.setColorAt(k, C); k++; }
        if (parts.length > 1) { const cx = side ? x1 - dep * 0.52 : x0 + dep * 0.52; gardens.push([cx, cz, dep * 0.18, lw * 0.5, 1]); }
        z += lw; } } }
  iw.count = ir.count = k; [iw, ir].forEach(m => { m.castShadow = m.receiveShadow = true; m.userData.noOutline = true; scene.add(m); });
  // street paving + courtyards/gardens + trees
  const pav = new THREE.Mesh(new THREE.PlaneGeometry(area[1] - area[0], area[3] - area[2]), mat('basalt', grey ? 0x8a8680 : 0x9a948a)); pav.rotation.x = -Math.PI / 2; pav.position.set((area[0] + area[1]) / 2, 0.04, (area[2] + area[3]) / 2); pav.geometry.attributes.uv.array.forEach((v, i, a) => a[i] = v * 120); pav.receiveShadow = true; pav.userData.noOutline = true;
  if (oval) { pav.geometry = new THREE.CircleGeometry(1, 96); pav.geometry.attributes.uv.array.forEach((v, i, a) => a[i] = v * 160); pav.scale.set(oval[2], oval[3], 1); pav.position.set(oval[0], 0.04, oval[1]); }
  if (oval) scene.add(pav);
  if (gardens.length) { const gm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.3, 1), std(0xffffff, { roughness: 1 }), gardens.length); gardens.forEach(([x, z, w, d, court], i) => { M.compose(P.set(x, 0.1, z), Q.identity(), S.set(w, 1, d)); gm.setMatrixAt(i, M); C.set(court ? 0xd8ccb0 : 0x5a7a3a); if (grey) C.lerp(G, grey); gm.setColorAt(i, C); }); gm.receiveShadow = true; gm.userData.noOutline = true; scene.add(gm); }
  if (trees.length && !grey) { const tg = new THREE.IcosahedronGeometry(1, 1); tg.scale(1, 0.7, 1); const tm = new THREE.InstancedMesh(tg, std(0xffffff, { roughness: 1 }), trees.length); trees.forEach(([x, z], i) => { const s = 2 + rnd() * 2; M.compose(P.set(x, 3 + s * 0.5, z), Q.identity(), S.set(s, s, s)); tm.setMatrixAt(i, M); C.setRGB(0.18 + rnd() * 0.05, 0.32 + rnd() * 0.08, 0.14); tm.setColorAt(i, C); }); tm.castShadow = true; tm.userData.noOutline = true; scene.add(tm); }
  return { iw, ir };
}

// ---------------- columns, temple, forum ----------------
export function column(h = 6, r = 0.38, o = {}) {
  const g = new THREE.Group(); const m = o.mat ?? mat('marble', o.color ?? 0xf4eee0, { bump: 1.5 });
  const geo = new THREE.CylinderGeometry(r * 0.88, r, h, 40, 6); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x); const f = 1 - 0.045 * Math.pow(Math.abs(Math.cos(a * 10)), 0.6); p.setX(i, x * f); p.setZ(i, z * f); } geo.computeVertexNormals(); uvCyl(geo, r, h, 1.5);
  const sh = new THREE.Mesh(geo, m); sh.position.y = h / 2 + 0.3; g.add(sh);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.2, r * 1.3, 0.3, 32), m); base.position.y = 0.15; g.add(base); const tor = new THREE.Mesh(new THREE.TorusGeometry(r * 1.08, 0.08, 8, 32), m); tor.rotation.x = Math.PI / 2; tor.position.y = 0.32; g.add(tor);
  const ech = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.25, r * 0.9, 0.3, 32), m); ech.position.y = h + 0.45; g.add(ech); const ab = box(r * 2.8, 0.22, r * 2.8, m, 1); ab.position.y = h + 0.71; g.add(ab);
  if (o.ionic) for (const sd of [-1, 1]) { const vol = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.06, 8, 16), m); vol.position.set(sd * r * 1.15, h + 0.48, r * 0.9); g.add(vol); }
  g.userData.top = h + 0.82; return shadowAll(g);
}
// Temple of Jupiter (Capitolium) at the north end of the forum: high podium, steps, 6 columns, pediment
export function temple({ w = 17, d = 30, podH = 3.0, colH = 10 } = {}) {
  const g = new THREE.Group(); const tm = mat('travertine', 0xf0e8d8, { bump: 2 }), mm = mat('marble', 0xffffff, { bump: 1.2 });
  const pod = box(w, podH, d, tm, 3); pod.position.set(0, podH / 2, -d / 2); g.add(pod); const cor = box(w + 0.4, 0.35, d + 0.4, mm, 2); cor.position.set(0, podH - 0.1, -d / 2); g.add(cor);
  const steps = 12; for (let i = 0; i < steps; i++) { const s = box(w * 0.62, podH / steps, (steps - i) * 0.42, tm, 2); s.position.set(0, (i + 0.5) * podH / steps, (steps - i) * 0.21 + 0.0); g.add(s); }
  const nC = 6, cw = w - 2.2; for (let i = 0; i < nC; i++) { const c = column(colH, 0.62, { mat: mm }); c.position.set(-cw / 2 + i * cw / (nC - 1), podH, -1.2); g.add(c); }
  for (let k = 1; k < 3; k++) for (const sd of [-1, 1]) { const c = column(colH, 0.62, { mat: mm }); c.position.set(sd * cw / 2, podH, -1.2 - k * 3.4); g.add(c); }
  const cella = box(w - 4.5, colH + 0.8, d - 9, mat('rwall', 0xfff6ea), 4); cella.position.set(0, podH + (colH + 0.8) / 2, -d / 2 - 3.5); g.add(cella);
  const ent = box(w, 1.4, 12, mm, 2); ent.position.set(0, podH + colH + 0.82 + 0.7, -5.4); g.add(ent);
  const roofH = 3.2; const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.4, 0); sh.lineTo(w / 2 + 0.4, 0); sh.lineTo(0, roofH); sh.closePath(); const pg = new THREE.ExtrudeGeometry(sh, { depth: d - 1, bevelEnabled: false }); uvPlane(pg, 0.2, 0.2, 1); const ped = new THREE.Mesh(pg, mm); ped.position.set(0, podH + colH + 1.52, 0.5 - d + 0.5); g.add(ped);
  for (const sd of [-1, 1]) { const L = Math.hypot(w / 2 + 0.8, roofH); const rf = box(L, 0.25, d + 0.4, mat('tiles', 0xffd8c0, { bump: 3 }), 1.6); rf.position.set(sd * (w / 4 + 0.2), podH + colH + 1.52 + roofH / 2 + 0.12, -d / 2 + 0.5); rf.rotation.z = -sd * Math.atan2(roofH, w / 2 + 0.8); g.add(rf); }
  const tymp = new THREE.Mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-w / 2 + 0.8, 0.25); s.lineTo(w / 2 - 0.8, 0.25); s.lineTo(0, roofH - 0.55); s.closePath(); return s; })()), std(0x9a3a2a)); tymp.position.set(0, podH + colH + 1.52, 0.56); tymp.userData.noOutline = true; g.add(tymp);
  for (const sd of [-1, 1]) { const arch = box(3.2, 7, 3.5, mat('brick', 0xffffff), 1.5); arch.position.set(sd * (w / 2 + 3.5), 3.5, -1); g.add(arch); }
  g.userData.top = podH + colH + 1.52 + roofH; return shadowAll(g);
}
// two-storey colonnade (portico) along X
export function portico(len = 40, { h = 5, sp = 3.0, upper = true } = {}) {
  const g = new THREE.Group(); const tm = mat('travertine', 0xf2ead8, { bump: 1.5 }); const n = Math.floor(len / sp);
  for (let i = 0; i <= n; i++) { const c = column(h, 0.32, { mat: tm }); c.position.set(-len / 2 + i * sp, 0, 0); g.add(c); }
  const ar = box(len + 0.8, 0.7, 0.9, tm, 2); ar.position.set(0, h + 1.15, 0); g.add(ar);
  if (upper) for (let i = 0; i <= n; i++) { const c = column(h * 0.62, 0.24, { mat: tm, ionic: true }); c.position.set(-len / 2 + i * sp, h + 1.5, 0); g.add(c); }
  const top = box(len + 0.8, 0.5, 0.8, tm, 2); top.position.set(0, upper ? h + 1.5 + h * 0.62 + 1.05 : h + 1.6, 0); g.add(top);
  const back = box(len + 0.8, upper ? h * 1.9 : h + 1.5, 0.6, mat('rwall', 0xfff4e0), 4); back.position.set(0, (upper ? h * 1.9 : h + 1.5) / 2, -4.5); g.add(back);
  const ceil = box(len + 0.8, 0.2, 4.6, mat('planks', 0xc8a080), 2); ceil.position.set(0, h + 1.5, -2.2); g.add(ceil);
  const rf = box(len + 1.4, 0.2, 5.6, mat('tiles', 0xffd0b0, { bump: 2 }), 1.6); rf.position.set(0, (upper ? h + 1.5 + h * 0.62 + 1.4 : h + 2) + 0.7, -2.2); rf.rotation.x = -0.22; g.add(rf);
  return shadowAll(g);
}
export function statueBase(withStatue = true) { const g = new THREE.Group(); const b = box(1.4, 2.0, 2.2, mat('marble', 0xf0eadc), 1.5); b.position.y = 1.0; g.add(b); const c = box(1.6, 0.2, 2.4, mat('marble', 0xffffff), 1); c.position.y = 2.1; g.add(c);
  if (withStatue) { const bm = std(0x4a6a5a, { metalness: 0.7, roughness: 0.45 }); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.3, 6, 12), bm); body.position.y = 3.15; g.add(body); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), bm); hd.position.y = 4.15; g.add(hd); const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.8, 4, 8), bm); arm.position.set(0.42, 3.75, 0.1); arm.rotation.z = -1.1; g.add(arm); const hrs = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.2, 6, 12), bm); hrs.visible = false; g.add(hrs); }
  return shadowAll(g); }

// ---------------- city wall + gate (Porta Marina) ----------------
export function cityGate() { const g = new THREE.Group(); const sm = mat('reticulatum', 0xffffff, { bump: 2.4 }), tm = mat('travertine', 0xe8e0cc, { bump: 2 });
  for (const sd of [-1, 1]) { const w = box(30, 9, 4, sm, 2); w.position.set(sd * 19, 4.5, 0); g.add(w); }
  const top = box(8, 3.4, 6, sm, 2); top.position.set(0, 7.3, 0); g.add(top);
  for (const [x, aw, ah] of [[-1.6, 2.6, 5.2], [2.0, 1.4, 3.4]]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(aw / 2, aw / 2, 6.04, 24, 1, false, 0, Math.PI), std(0x120c08, { side: THREE.DoubleSide })); a.rotation.z = Math.PI / 2; a.rotation.y = Math.PI / 2; a.position.set(x, ah - aw / 2, 0); a.userData.noOutline = true; g.add(a); const dk = box(aw, ah - aw / 2, 6.04, std(0x120c08), 1); dk.position.set(x, (ah - aw / 2) / 2, 0); dk.userData.noOutline = true; g.add(dk); const ring = new THREE.Mesh(new THREE.TorusGeometry(aw / 2 + 0.25, 0.25, 8, 24, Math.PI), tm); ring.position.set(x, ah - aw / 2, 3.02); g.add(ring); }
  for (const sd of [-1, 1]) for (const x of [-3.6, 3.6]) { const p = box(0.9, 7, 6.1, sm, 2); p.position.set(x * (sd > 0 ? 1 : 1), 3.5, 0); if (sd > 0) g.add(p); }
  for (let x = -33; x <= 33; x += 1.6) { if (Math.abs(x) < 4) continue; const c = box(0.8, 0.9, 4, sm, 1); c.position.set(x, 9.45, 0); g.add(c); }
  return shadowAll(g); }

// ---------------- thermopolium (street food counter) ----------------
export function amphora(s = 1, color = 0xc0703e) { const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; const r = t < 0.12 ? 0.02 + t * 0.4 : t < 0.7 ? 0.07 + Math.sin((t - 0.12) / 0.58 * Math.PI * 0.85) * 0.2 : t < 0.82 ? 0.22 - (t - 0.7) * 1.2 : t < 0.95 ? 0.07 : 0.085; pts.push(new THREE.Vector2(r, t * 1.0)); }
  const geo = new THREE.LatheGeometry(pts, 20); const m = mat('coccio', color, { bump: 1.2 }); const a = new THREE.Mesh(geo, m); const g = new THREE.Group(); g.add(a);
  for (const sd of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12, Math.PI), m); h.position.set(sd * 0.1, 0.84, 0); h.rotation.z = sd > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(h); }
  g.scale.setScalar(s); return shadowAll(g); }
export function dolium(s = 1) { const pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push(new THREE.Vector2(0.15 + Math.sin(t * Math.PI) * 0.45 + (t > 0.92 ? 0.06 : 0), t)); } const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mat('coccio', 0xd08860, { bump: 1.5 })); g.add(m); g.scale.setScalar(s); return shadowAll(g); }
export function thermopolium(o = {}) {
  const g = new THREE.Group(); const L = o.len ?? 3.4, D = 0.75, H = 1.0;
  // masonry counter faced with polychrome marble fragments
  const face = canvasTex(1024, 512, (c, w, h) => { seed(41);
    c.fillStyle = '#b8503a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(${rnd() < 0.5 ? '60,30,20' : '230,180,150'},${0.04 + rnd() * 0.06})`; c.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 6, 2 + rnd() * 6); }
    const P = [['#efe9df', '#cfc6b8'], ['#e8dcc0', '#c0ae88'], ['#7d8f78', '#56664f'], ['#d9b25a', '#a8822e'], ['#efe6e8', '#b88a9a'], ['#9aa2aa', '#6a727a'], ['#3a3432', '#1e1a18'], ['#c45a40', '#8a3626']];
    for (let i = 0; i < 1300; i++) { const x = rnd() * w, y = 70 + rnd() * (h - 150), r = 5 + rnd() * rnd() * 22; const [a, b] = P[(rnd() * P.length) | 0]; const n = 4 + ((rnd() * 3) | 0), a0 = rnd() * 6;
      c.beginPath(); for (let k = 0; k < n; k++) { const an = a0 + k / n * 6.283 + rnd() * 0.5, rr = r * (0.6 + rnd() * 0.5); k ? c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.8) : c.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.8); } c.closePath();
      const g = c.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(60,30,20,.55)'; c.lineWidth = 1.2; c.stroke();
      if (rnd() < 0.4) { c.strokeStyle = 'rgba(80,70,70,.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - r * 0.5, y - r * 0.2); c.quadraticCurveTo(x, y + r * 0.3, x + r * 0.5, y); c.stroke(); } }
    c.fillStyle = '#e8dcc4'; c.fillRect(0, 0, w, 26); c.fillStyle = '#8a2a1e'; c.fillRect(0, 26, w, 18); c.fillStyle = '#2a1e18'; c.fillRect(0, h - 64, w, 64); c.fillStyle = '#c8a050'; c.fillRect(0, h - 70, w, 6);
    const gd = c.createLinearGradient(0, h - 140, 0, h); gd.addColorStop(0, 'rgba(50,35,20,0)'); gd.addColorStop(1, 'rgba(50,35,20,.55)'); c.fillStyle = gd; c.fillRect(0, h - 140, w, 140);
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(40,25,15,${0.08 + rnd() * 0.1})`; c.beginPath(); c.ellipse(rnd() * w, 44 + rnd() * 30, 3 + rnd() * 6, 10 + rnd() * 40, 0, 0, 7); c.fill(); } });
  const fm = new THREE.MeshStandardMaterial({ map: face, bumpMap: face, bumpScale: 2.5, roughness: 0.45 });
  const ctr = new THREE.Mesh(new THREE.BoxGeometry(L, H, D), [fm, fm, mat('marble', 0xf0e8dc), fm, fm, fm]); ctr.position.set(0, H / 2, 0); g.add(ctr);
  const ctr2 = new THREE.Mesh(new THREE.BoxGeometry(D, H, 1.6), [fm, fm, mat('marble', 0xf0e8dc), fm, fm, fm]); ctr2.position.set(-L / 2 + D / 2, H / 2, -1.15); g.add(ctr2);
  // dolia rims sunk in the counter top
  const holes = []; for (let i = 0; i < 4; i++) { const x = -L / 2 + 0.9 + i * 0.72; const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 20), mat('coccio', 0xb06040)); rim.rotation.x = Math.PI / 2; rim.position.set(x, H + 0.01, 0); g.add(rim); const inner = new THREE.Mesh(new THREE.CircleGeometry(0.19, 20), std(0x2a1a10)); inner.rotation.x = -Math.PI / 2; inner.position.set(x, H + 0.005, 0); inner.userData.noOutline = true; g.add(inner); holes.push(V(x, H, 0)); }
  // stepped shelves at the end with jugs
  for (let k = 0; k < 3; k++) { const s = box(0.7, 0.18, 0.5 - k * 0.12, mat('marble', 0xe8e0d0), 1); s.position.set(L / 2 - 0.35, H + 0.09 + k * 0.18, -0.12 + k * 0.06); g.add(s); for (let j = 0; j < 2; j++) { const a = amphora(0.28, [0xc0703e, 0xa86040, 0xd09060][(k + j) % 3]); a.position.set(L / 2 - 0.55 + j * 0.35, H + 0.18 + k * 0.18, -0.12 + k * 0.06); g.add(a); } }
  // painted lararium/fresco panel on the back wall (snakes + Mercury-ish figure hint)
  g.userData.holes = holes; return shadowAll(g);
}
// fullonica: treading tubs + rinsing basins + drying racks
export function fullonica() {
  const g = new THREE.Group(); const wm = mat('rwall', 0xfff0e0, { bump: 2 }), cm = mat('coccio', 0xffffff, { bump: 2 });
  const back = box(14, 5, 0.5, mat('fresco', 0xffffff, { bump: 1.2 }), 4.2); back.position.set(0, 2.5, -4); g.add(back);
  const floor = box(14, 0.1, 9, mat('travertine', 0xe8dcc8), 2); floor.position.set(0, 0.05, 0.4); floor.userData.ground = true; g.add(floor);
  const tubs = []; for (let i = 0; i < 4; i++) { const x = -5 + i * 1.6; const t = new THREE.Group(); for (const [w, d, xx, zz] of [[1.3, 0.12, 0, 0.6], [1.3, 0.12, 0, -0.6], [0.12, 1.2, 0.6, 0], [0.12, 1.2, -0.6, 0]]) { const s = box(w, 0.95, d, cm, 1); s.position.set(xx, 0.48, zz); t.add(s); }
    const liq = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1, 12, 12), new THREE.MeshStandardMaterial({ color: 0xc8b04a, roughness: 0.2, transparent: true, opacity: 0.9 })); liq.rotation.x = -Math.PI / 2; liq.position.y = 0.55; liq.userData.noOutline = true; t.add(liq); t.userData.liq = liq;
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9, 10, 10), mat('cloth', [0xd84a3a, 0xf0e8d8, 0x3a6aa8, 0xe8b830][i])); cloth.rotation.x = -Math.PI / 2; cloth.position.y = 0.6; t.add(cloth); t.userData.cloth = cloth;
    t.position.set(x, 0, -2.6); g.add(t); tubs.push(t); }
  for (let i = 0; i < 3; i++) { const b = new THREE.Group(); const w = 3, d = 1.8; for (const [ww, dd, xx, zz] of [[w, 0.2, 0, d / 2], [w, 0.2, 0, -d / 2], [0.2, d, w / 2, 0], [0.2, d, -w / 2, 0]]) { const s = box(ww, 0.8 - i * 0.1, dd, cm, 1); s.position.set(xx, 0.4 - i * 0.05, zz); b.add(s); } const wt = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.3, d - 0.3), new THREE.MeshStandardMaterial({ color: 0x8aa8a0, roughness: 0.08, transparent: true, opacity: 0.85 })); wt.rotation.x = -Math.PI / 2; wt.position.y = 0.6 - i * 0.12; wt.userData.noOutline = true; b.add(wt); b.position.set(2.4 + i * 0.0, 0, -2.4 + i * 2.0); if (i < 2) g.add(b); }
  // drying racks with colourful cloth that sways
  const cloths = []; for (let r = 0; r < 2; r++) { const z = -3.5 + r * 0.25; for (const x of [-6.4, 6.4]) { const p = box(0.1, 3.6, 0.1, mat('wood', 0xffffff), 1); p.position.set(x * 0.75, 1.8, z); g.add(p); } const bar = box(9.8, 0.08, 0.08, mat('wood', 0xffffff), 1); bar.position.set(0, 3.58 - r * 0.25, z); g.add(bar);
    for (let k = 0; k < 6; k++) { const cg = new THREE.PlaneGeometry(1.3, 1.2, 8, 10); cg.translate(0, -0.6, 0); const c = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: [0xc83a2e, 0xf2ece0, 0x2e5a9a, 0xe8b830, 0x6a9a4a, 0x9a3a7a][(k + r * 2) % 6], map: T.cloth.map, bumpMap: T.cloth.bump, bumpScale: 2, roughness: 0.95, side: THREE.DoubleSide })); c.position.set(-4.0 + k * 1.6 + r * 0.8, 3.56 - r * 0.25, z); c.userData.base = cg.attributes.position.array.slice(); g.add(c); cloths.push(c); } }
  // urine collection jars by the door
  const jars = []; for (let i = 0; i < 3; i++) { const a = amphora(0.55, 0xb87048); a.position.set(-6.2 + i * 0.5, 0.1, 3.9); a.rotation.y = i; g.add(a); jars.push(a); }
  g.userData.tubs = tubs; g.userData.cloths = cloths; g.userData.jars = jars; return shadowAll(g);
}
export function waveCloth(c, t) { const p = c.geometry.attributes.position, b = c.userData.base; for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; p.setZ(i, Math.sin(x * 3 + t * 2.4 + c.position.x) * 0.06 * (-y) + Math.sin(t * 1.7 + c.position.x) * 0.08 * (-y)); } p.needsUpdate = true; c.geometry.computeVertexNormals(); }

// ---------------- interiors ----------------
// atrium of a rich domus: impluvium pool, compluvium opening, fresco walls, mosaic floor, columns
export function atrium(o = {}) {
  const g = new THREE.Group(); const W = o.w ?? 12, D = o.d ?? 14, H = 6.5; const fm = mat('fresco', 0xffffff, { bump: 1.2 });
  const floor = new THREE.Mesh(uvPlane(new THREE.PlaneGeometry(W, D), W, D, 6), mat('mosaic', 0xffffff, { bump: 1 })); floor.rotation.x = -Math.PI / 2; floor.userData.ground = true; floor.userData.noOutline = true; floor.receiveShadow = true; g.add(floor);
  for (const [w, x, z, ry] of [[W, 0, -D / 2, 0], [D, -W / 2, 0, Math.PI / 2], [D, W / 2, 0, -Math.PI / 2]]) { const m = box(w, H, 0.3, fm, H); m.position.set(x, H / 2, z); m.rotation.y = ry; g.add(m); }
  // ceiling with square opening (compluvium)
  const cw = 4.2; for (const [w, d, x, z] of [[W, (D - cw) / 2, 0, -D / 4 - cw / 4], [W, (D - cw) / 2, 0, D / 4 + cw / 4], [(W - cw) / 2, cw, -W / 4 - cw / 4, 0], [(W - cw) / 2, cw, W / 4 + cw / 4, 0]]) { const c = box(w, 0.35, d, mat('planks', 0x9a7050), 1.5); c.position.set(x, H, z); g.add(c); }
  for (const [x, z] of [[-cw / 2, -cw / 2], [cw / 2, -cw / 2], [-cw / 2, cw / 2], [cw / 2, cw / 2]]) { const c = column(H - 0.9, 0.22, { mat: mat('rwall', 0xfff4e8), ionic: true }); c.position.set(x, 0, z); g.add(c); }
  // impluvium
  const rimM = mat('marble', 0xffffff); for (const [w, d, x, z] of [[3.6, 0.25, 0, 1.55], [3.6, 0.25, 0, -1.55], [0.25, 3.1, 1.68, 0], [0.25, 3.1, -1.68, 0]]) { const s = box(w, 0.18, d, rimM, 1); s.position.set(x, 0.09, z); g.add(s); }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 2.9, 24, 24), new THREE.MeshStandardMaterial({ color: 0x3a6a80, roughness: 0.04, metalness: 0.5 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.06; water.userData.noOutline = true; g.add(water); g.userData.water = water; water.userData.base = water.geometry.attributes.position.array.slice();
  { const mm = mat('marble', 0xf4f0e8, { bump: 1 }); const top = box(1.9, 0.12, 0.85, mm, 1); top.position.set(0, 0.9, -3.2); g.add(top); const lip = box(1.95, 0.05, 0.9, mm, 1); lip.position.set(0, 0.82, -3.2); g.add(lip);
    for (const sd of [-1, 1]) { const pts = [[0.32, 0], [0.34, 0.08], [0.22, 0.14], [0.12, 0.3], [0.2, 0.5], [0.12, 0.64], [0.26, 0.76], [0.3, 0.8]].map(([x, y]) => new THREE.Vector2(x, y)); const leg = new THREE.Mesh(new THREE.LatheGeometry(pts, 16), mm); leg.scale.set(1, 1, 0.5); leg.position.set(sd * 0.7, 0, -3.2); g.add(leg); }
    for (const [x, z] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4], [-5.3, -5], [5.3, -5], [-5.3, 3], [5.3, 3], [-5.3, -1], [5.3, -1]]) { const p = pot(1.2 + Math.abs(x * z) % 0.5); p.position.set(x, 0, z); g.add(p); }
    for (const [x, z] of [[-5.4, 5.6], [-5.0, 5.8], [5.4, 5.4]]) { const a = amph(0.95); a.position.set(x, 0, z); a.rotation.z = 0.12; g.add(a); }
    const arca = box(1.3, 0.8, 0.7, mat('wood', 0x7a4a2a), 1); arca.position.set(4.6, 0.4, -6.2); g.add(arca); for (const xx of [-0.45, 0, 0.45]) { const band = box(0.06, 0.82, 0.72, std(0x8a6a3a, { metalness: 0.8, roughness: 0.35 }), 1); band.position.set(4.6 + xx, 0.41, -6.2); g.add(band); } for (let i = 0; i < 12; i++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), std(0xc8a040, { metalness: 0.9, roughness: 0.3 })); st.position.set(4.05 + (i % 6) * 0.22, 0.25 + Math.floor(i / 6) * 0.3, -5.84); g.add(st); }
    for (const sd of [-1, 1]) { const bn = box(2.2, 0.45, 0.6, mat('wood', 0x8a5a34), 1); bn.position.set(sd * 5.4, 0.22, 1); bn.rotation.y = Math.PI / 2; g.add(bn); const cu = box(2.0, 0.14, 0.5, std(sd > 0 ? 0x8a2a3a : 0x2a5a7a, { roughness: 0.95 }), 1); cu.position.set(sd * 5.4, 0.52, 1); cu.rotation.y = Math.PI / 2; g.add(cu); } }
  // tablinum opening + curtain at the back
  const dk = new THREE.Mesh(new THREE.PlaneGeometry(4, 4.4), std(0x2a1c12)); dk.position.set(0, 2.2, -D / 2 + 0.16); dk.userData.noOutline = true; g.add(dk);
  const cur = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 4.2, 10, 10), new THREE.MeshStandardMaterial({ color: 0x8a2a2a, map: T.cloth.map, bumpMap: T.cloth.bump, bumpScale: 2, roughness: 0.95, side: THREE.DoubleSide })); cur.position.set(-1.1, 2.2, -D / 2 + 0.25); g.add(cur);
  // bronze brazier + bust on a pillar + potted plants
  const herm = box(0.4, 1.4, 0.4, mat('marble', 0xffffff), 1); herm.position.set(-W / 2 + 1.2, 0.7, -D / 2 + 1.5); g.add(herm); const bust = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mat('marble', 0xffffff)); bust.position.set(-W / 2 + 1.2, 1.7, -D / 2 + 1.5); g.add(bust);
  for (const x of [-W / 2 + 1, W / 2 - 1]) { const pot = dolium(0.9); pot.position.set(x, 0, D / 2 - 2); g.add(pot); const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), std(0x3a6a2a, { flatShading: true })); plant.position.set(x, 1.4, D / 2 - 2); g.add(plant); }
  const lightShaft = new THREE.Mesh(new THREE.BoxGeometry(cw - 0.3, H, cw - 0.3), new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false })); lightShaft.position.y = H / 2; lightShaft.userData.noOutline = true; g.add(lightShaft);
  g.userData.H = H; g.userData.cw = cw; return shadowAll(g);
}
export function oilLamp() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 10), mat('coccio', 0xc07040)); b.scale.set(1, 0.45, 1.3); b.position.y = 0.04; g.add(b); const n = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.08, 10), mat('coccio', 0xc07040)); n.rotation.x = Math.PI / 2; n.position.set(0, 0.05, 0.13); g.add(n);
  const fl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc060 })); fl.scale.y = 2.2; fl.position.set(0, 0.11, 0.17); fl.userData.noOutline = true; g.add(fl); const l = new THREE.PointLight(0xffa050, 4, 6, 1.6); l.position.set(0, 0.25, 0.17); g.add(l); g.userData.light = l; g.userData.flame = fl; return g; }
export function bench(w = 2) { const g = new THREE.Group(); const t = box(w, 0.1, 0.45, mat('planks', 0xb08a60), 1); t.position.y = 0.46; g.add(t); for (const x of [-w / 2 + 0.15, w / 2 - 0.15]) { const l = box(0.1, 0.46, 0.4, mat('wood', 0xffffff), 1); l.position.set(x, 0.23, 0); g.add(l); } return shadowAll(g); }
export function room(w = 6, h = 3.4, d = 6, o = {}) { const g = new THREE.Group(); const fm = mat(o.wall ?? 'fresco', 0xffffff, { bump: 1.2 });
  const floor = box(w, 0.1, d, mat(o.floor ?? 'coccio', 0xffffff), 2); floor.position.y = -0.05; floor.userData.ground = true; floor.userData.noOutline = true; g.add(floor);
  for (const [W_, x, z, ry] of [[w, 0, -d / 2, 0], [d, -w / 2, 0, Math.PI / 2], [d, w / 2, 0, -Math.PI / 2]]) { const m = box(W_, h, 0.25, fm, h); m.position.set(x, h / 2, z); m.rotation.y = ry; g.add(m); }
  const ceil = box(w, 0.15, d, mat('planks', 0x8a6040), 1.5); ceil.position.y = h + 0.075; g.add(ceil); for (let x = -w / 2 + 0.5; x < w / 2; x += 0.9) { const b = box(0.18, 0.22, d, mat('wood', 0xffffff), 1); b.position.set(x, h - 0.1, 0); g.add(b); }
  return shadowAll(g); }

// ---------------- construction: scaffolding, treadwheel crane, ladder ----------------
export function scaffold(w = 6, h = 7) { const g = new THREE.Group(); const wm = mat('wood', 0xffffff); for (let x = -w / 2; x <= w / 2 + 0.01; x += w / 3) for (const z of [0, 1.2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, h, 6), wm); p.position.set(x, h / 2, z); g.add(p); }
  for (let y = 2; y < h; y += 2.2) { const pl = box(w, 0.08, 1.3, mat('planks', 0xc0a070), 1); pl.position.set(0, y, 0.6); g.add(pl); for (const z of [0, 1.2]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, w, 6), wm); r.rotation.z = Math.PI / 2; r.position.set(0, y + 0.9, z); g.add(r); } }
  for (const z of [0, 1.2]) { const L = Math.hypot(w, h); const br = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, L, 6), wm); br.position.set(0, h / 2, z); br.rotation.z = Math.atan2(w, h); g.add(br); } return shadowAll(g); }
export function crane() { const g = new THREE.Group(); const wm = mat('wood', 0xffffff);
  const wheel = new THREE.Group(); const r = 2.0; const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 8, 40), wm); wheel.add(rim); const rim2 = rim.clone(); rim2.position.z = 1.2; wheel.add(rim2); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; const sl = box(0.1, 0.1, 1.2, mat('planks', 0xb08860), 1); sl.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.6); wheel.add(sl); } for (let i = 0; i < 8; i++) { const sp = box(0.08, r * 2, 0.08, wm, 1); sp.rotation.z = i * Math.PI / 8; wheel.add(sp); const sp2 = sp.clone(); sp2.position.z = 1.2; wheel.add(sp2); }
  wheel.position.set(0, r + 0.2, -0.6); g.add(wheel); g.userData.wheel = wheel;
  for (const sd of [-1, 1]) { const L = 11; const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, L, 8), wm); b.position.set(0.6 * sd, L / 2 * Math.cos(0.32), 1.6 + L / 2 * Math.sin(0.32)); b.rotation.x = 0.32; g.add(b); }
  const tip = V(0, 11 * Math.cos(0.32), 1.6 + 11 * Math.sin(0.32)); const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 5), std(0xb8a070)); g.add(rope); g.userData.rope = rope; g.userData.tip = tip;
  const blk = box(0.9, 0.6, 0.6, mat('travertine', 0xffffff), 1); g.add(blk); g.userData.block = blk; return shadowAll(g); }
export function ladder(h = 4) { const g = new THREE.Group(); const wm = mat('wood', 0xffffff); for (const x of [-0.25, 0.25]) { const r = box(0.07, h, 0.07, wm, 1); r.position.set(x, h / 2, 0); g.add(r); } for (let y = 0.3; y < h; y += 0.35) { const s = box(0.5, 0.05, 0.05, wm, 1); s.position.y = y; g.add(s); } return shadowAll(g); }

// ---------------- vegetation ----------------
export function stonePine(s = 1) { const g = new THREE.Group(); const tm = mat('wood', 0x9a8a7a); const pts = [V(0, 0, 0), V(0.3, 2, 0), V(0.1, 4.5, 0.2), V(0.5, 7, 0)]; const tk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.28, 8), tm); g.add(tk);
  const cm = std(0x3a5a2a, { roughness: 1, flatShading: true }); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; const c = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 1), cm); c.scale.set(1.3, 0.42, 1.3); c.position.set(0.5 + Math.cos(a) * 2.2, 7.3 + Math.sin(i * 2.1) * 0.3, Math.sin(a) * 2.2); g.add(c); } const top = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), cm); top.scale.set(1.4, 0.45, 1.4); top.position.set(0.5, 7.8, 0); g.add(top); g.scale.setScalar(s); return shadowAll(g); }
export function cypress(s = 1) { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.ConeGeometry(0.9, 8, 10, 6), std(0x2a4626, { flatShading: true, roughness: 1 })); const p = c.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 + Math.sin(y * 3 + i) * 0.08 + 0.3 * Math.sin((y + 4) / 8 * Math.PI) ; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } c.geometry.computeVertexNormals(); c.position.y = 4.4; g.add(c); g.scale.setScalar(s); return shadowAll(g); }
export function vineRows(w = 40, d = 30, sp = 2.2) { const g = new THREE.Group(); let n = 0; for (let x = -w / 2; x < w / 2; x += sp) for (let z = -d / 2; z < d / 2; z += 1.6) n++; const geo = new THREE.SphereGeometry(0.55, 7, 5); geo.scale(1, 0.8, 1); const im = new THREE.InstancedMesh(geo, std(0x4a7a2a, { roughness: 1, flatShading: true }), n); const M = new THREE.Matrix4(); let k = 0; for (let x = -w / 2; x < w / 2; x += sp) for (let z = -d / 2; z < d / 2; z += 1.6) { M.makeTranslation(x + Math.sin(z) * 0.1, 1.1, z); im.setMatrixAt(k++, M); } im.count = k; im.castShadow = true; im.userData.noOutline = true; g.add(im); return g; }

// ---------------- living detail ----------------
export class Birds { constructor(scene, n = 14, center = V(0, 30, -40), spread = 30) { this.n = n; this.c = center; this.sp = spread; this.b = []; const m = std(0x2a2a2a, { side: THREE.DoubleSide });
    for (let i = 0; i < n; i++) { const g = new THREE.Group(); for (const sd of [-1, 1]) { const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.15, 0, 0, 0.15, sd * 0.7, 0, 0], 3)); wg.computeVertexNormals(); const w = new THREE.Mesh(wg, m); w.userData.noOutline = true; g.add(w); } const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), m); body.scale.z = 2.4; body.userData.noOutline = true; g.add(body); scene.add(g); this.b.push(g); } }
  update(t, flee = 0) { this.b.forEach((g, i) => { const a = t * 0.25 + i * 0.45; const r = this.sp * (0.5 + 0.5 * Math.sin(i * 2.3)); g.position.set(this.c.x + Math.cos(a) * r + flee * t * 12 * Math.sin(i), this.c.y + Math.sin(i * 1.7 + t) * 2 + flee * t * 6, this.c.z + Math.sin(a) * r * 0.5 - flee * t * 10); g.rotation.y = -a; const fl = Math.sin(t * (12 + flee * 6) + i) * 0.7; g.children[0].rotation.z = fl; g.children[1].rotation.z = -fl; g.scale.setScalar(1.2); }); } }
export function horse() { const g = new THREE.Group(); const m = mat('cloth', 0x7a4a2a, { bump: 1.5 }); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.2, 8, 16), m); body.rotation.x = Math.PI / 2; body.position.y = 1.35; g.add(body); const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.7, 6, 12), m); neck.position.set(0, 1.85, 0.85); neck.rotation.x = 0.7; g.add(neck); const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.5, 6, 12), m); head.position.set(0, 2.05, 1.25); head.rotation.x = 1.9; g.add(head); const mane = box(0.08, 0.2, 0.8, std(0x2a1a10), 1); mane.position.set(0, 2.1, 0.75); mane.rotation.x = 0.7; g.add(mane);
  const legs = []; for (const [x, z] of [[-0.22, 0.6], [0.22, 0.6], [-0.22, -0.6], [0.22, -0.6]]) { const p = new THREE.Group(); p.position.set(x, 1.15, z); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 1.1, 8), m); l.position.y = -0.55; p.add(l); const hf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 8), std(0x1a1008)); hf.position.y = -1.1; p.add(hf); g.add(p); legs.push(p); } const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.7, 8), std(0x2a1a10)); tail.position.set(0, 1.2, -1.1); tail.rotation.x = -2.6; g.add(tail); g.userData.legs = legs; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
export function gallop(h, t, speed = 9) { h.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(t * speed + (i % 2) * Math.PI + (i > 1 ? 0.6 : 0)) * 0.6); h.children[0].position.y = 1.35 + Math.abs(Math.sin(t * speed)) * 0.08; }
export function cart() { const g = new THREE.Group(); const bed = box(1.3, 0.12, 2.2, mat('planks', 0xb08860), 1); bed.position.y = 0.8; g.add(bed); for (const sd of [-1, 1]) { const side = box(0.08, 0.4, 2.2, mat('planks', 0xa07850), 1); side.position.set(sd * 0.62, 1.05, 0); g.add(side); const wh = new THREE.Group(); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 8, 28), mat('wood', 0xffffff)); wh.add(rim); for (let i = 0; i < 4; i++) { const sp = box(0.06, 1.2, 0.06, mat('wood', 0xffffff), 1); sp.rotation.z = i * Math.PI / 4; wh.add(sp); } wh.rotation.y = Math.PI / 2; wh.position.set(sd * 0.72, 0.6, 0); g.add(wh); (g.userData.wheels = g.userData.wheels || []).push(wh); } for (let i = 0; i < 3; i++) { const a = amphora(0.6); a.position.set(-0.3 + i * 0.3, 0.86, -0.4 + (i % 2) * 0.6); a.rotation.z = 0.15; g.add(a); } return shadowAll(g); }
export function ship() { const g = new THREE.Group(); const s = new THREE.Shape(); s.moveTo(0, -8); s.quadraticCurveTo(3.4, -4, 3.2, 2); s.lineTo(2.4, 8); s.lineTo(-2.4, 8); s.lineTo(-3.2, 2); s.quadraticCurveTo(-3.4, -4, 0, -8); const geo = new THREE.ExtrudeGeometry(s, { depth: 2.6, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.2, bevelSegments: 2 }); geo.rotateX(Math.PI / 2); uvPlane(geo, 0.5, 0.5, 1); const h = new THREE.Mesh(geo, mat('planks', 0x7a5434)); h.position.y = 2.2; g.add(h);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 13, 10), mat('wood', 0xffffff)); mast.position.y = 8.5; g.add(mast); const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 9, 8), mat('wood', 0xffffff)); yard.rotation.z = Math.PI / 2; yard.position.y = 14; g.add(yard);
  const sg = new THREE.PlaneGeometry(8.6, 6, 10, 8); const sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) sp.setZ(i, 0.9 * Math.cos(sp.getX(i) / 4.3 * Math.PI / 2) * (0.5 + 0.5 * Math.cos(sp.getY(i) / 3 * Math.PI / 2))); sg.computeVertexNormals(); const sail = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0xf0e4c8, map: T.cloth.map, roughness: 0.9, side: THREE.DoubleSide })); sail.position.set(0, 10.9, 0.3); g.add(sail);
  const stern = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.2, 6, 12, Math.PI), mat('wood', 0xffffff)); stern.position.set(0, 3.4, -8.2); stern.rotation.y = Math.PI / 2; g.add(stern); return shadowAll(g); }

// ---------------- plaster cast (Fiorelli method) ----------------
export function plasterCast(pose = 'curl') { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.95, bumpMap: T.pumice.bump, bumpScale: 1.5 });
  const cap = (r, l, x, y, z, rx, ry, rz) => { const geo = new THREE.CapsuleGeometry(r, l, 6, 12); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.08 * Math.sin(p.getY(i) * 13 + p.getX(i) * 7) + 0.05 * Math.sin(p.getZ(i) * 17); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } geo.computeVertexNormals(); const c = new THREE.Mesh(geo, m); c.position.set(x, y, z); c.rotation.set(rx, ry, rz); g.add(c); return c; };
  // body lying on its side, knees drawn up, arms covering face
  cap(0.2, 0.55, 0, 0.22, 0, 0, 0, Math.PI / 2 - 0.2); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), m); hd.position.set(-0.55, 0.26, 0.05); g.add(hd);
  cap(0.09, 0.42, 0.42, 0.18, 0.18, 0.2, 0, 2.2); cap(0.08, 0.38, 0.32, 0.12, 0.38, 0.1, 0, 0.8); cap(0.09, 0.42, 0.45, 0.25, -0.12, -0.2, 0, 2.0); cap(0.08, 0.38, 0.34, 0.2, -0.32, 0, 0, 0.7);
  cap(0.065, 0.3, -0.42, 0.34, 0.16, 0.3, 0, -0.6); cap(0.06, 0.26, -0.58, 0.34, 0.12, 0, 0.4, 1.3); cap(0.065, 0.3, -0.36, 0.2, -0.14, -0.3, 0, -0.9);
  g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); return g; }

// market stalls along the forum colonnades: trestle tables, striped canopies, produce baskets, amphorae
export function marketStalls(scene, sv = 3) { seed(sv * 13 + 1); const wood = mat('wood', 0x9a7050); const g = new THREE.Group();
  const cols = [0xc8402a, 0x2e5f8a, 0xd8a030, 0x5a7a3a, 0x8a3a6a]; const prod = [0xd83a2a, 0xe8a030, 0x6a9a30, 0x7a3a6a, 0xe8d860];
  for (const sd of [-1, 1]) for (let z = -44; z < 18; z += 7 + rnd() * 3) { const s = new THREE.Group(); const tb = box(2.2, 0.08, 1.0, wood, 1); tb.position.y = 0.85; s.add(tb); for (const [x, zz] of [[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]]) { const l = box(0.07, 0.85, 0.07, wood, 1); l.position.set(x, 0.42, zz); s.add(l); }
    const cm = new THREE.MeshStandardMaterial({ color: cols[(rnd() * cols.length) | 0], roughness: 0.9, side: THREE.DoubleSide }); const can = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6, 8, 1), cm); const cp = can.geometry.attributes.position; for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.sin((cp.getX(i) + 1.3) * 3.6) * 0.04); can.geometry.computeVertexNormals(); can.rotation.x = -Math.PI / 2 + 0.25; can.position.set(0, 2.2, 0); s.add(can);
    for (const x of [-1.2, 1.2]) for (const zz of [-0.7, 0.7]) { const p = box(0.06, 2.3, 0.06, wood, 1); p.position.set(x, 1.15, zz); s.add(p); }
    for (let i = 0; i < 4; i++) { const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.16, 12, 1, true), std(0xa8804a, { side: THREE.DoubleSide })); bk.position.set(-0.75 + i * 0.5, 0.97, (rnd() - 0.5) * 0.4); s.add(bk); const pc = prod[(rnd() * prod.length) | 0]; for (let k = 0; k < 6; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.055 + rnd() * 0.03, 8, 6), std(pc, { roughness: 0.5 })); f.position.set(bk.position.x + (rnd() - 0.5) * 0.22, 1.04 + rnd() * 0.05, bk.position.z + (rnd() - 0.5) * 0.22); s.add(f); } }
    for (let i = 0; i < 2; i++) { const a = new THREE.Mesh(new THREE.LatheGeometry([[0.02, 0], [0.12, 0.2], [0.17, 0.45], [0.1, 0.62], [0.05, 0.7], [0.06, 0.8]].map(([x, y]) => new THREE.Vector2(x, y)), 12), mat('coccio', 0xd08a5a)); a.position.set(1.3 + i * 0.3, 0, 0.6); a.rotation.z = -0.15; s.add(a); }
    s.position.set(sd * 10.5, 0, z); s.rotation.y = sd * Math.PI / 2; shadowAll(s); g.add(s); }
  bake(g); scene.add(g); return g; }
