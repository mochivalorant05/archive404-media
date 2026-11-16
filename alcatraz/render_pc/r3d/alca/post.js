// Cinematic post: depth of field (scatter-as-gather bokeh), bloom, ACES, colour grade, vignette, grain.
import * as THREE from 'three';

const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
const HEAD = `precision highp float; varying vec2 vUv;
uniform sampler2D tDepth; uniform float cn, cf, focus, aper, maxC;
float linD(vec2 uv){ float z=texture2D(tDepth,uv).x*2.-1.; return 2.*cn*cf/(cf+cn-z*(cf-cn)); }
float coc(vec2 uv){ float d=linD(uv); if(texture2D(tDepth,uv).x>=0.99999) d=1e7; float c = d>focus ? aper*(1.-focus/d) : aper*(focus/d-1.)*0.8; return clamp(c,0.,maxC); }
`;

export class Post {
  constructor(gl, W, H) {
    this.gl = gl; this.W = W; this.H = H;
    const ht = THREE.HalfFloatType;
    this.rt = new THREE.WebGLRenderTarget(W, H, { type: ht, samples: 4, depthTexture: new THREE.DepthTexture(W, H, THREE.UnsignedIntType) });
    const mk = (w, h) => new THREE.WebGLRenderTarget(w, h, { type: ht, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.half = mk(W / 2, H / 2); this.dof = mk(W / 2, H / 2);
    this.q1 = mk(W / 4, H / 4); this.q2 = mk(W / 4, H / 4); this.e1 = mk(W / 8, H / 8); this.e2 = mk(W / 8, H / 8);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); this.scene = new THREE.Scene();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.scene.add(this.quad);
    const U = () => ({ tDepth: { value: this.rt.depthTexture }, cn: { value: 0.03 }, cf: { value: 60000 }, focus: { value: 5 }, aper: { value: 20 }, maxC: { value: 28 } });
    this.U = U();
    const M = (fs, u) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: Object.assign(this.U, u), depthTest: false, depthWrite: false });
    // 1) downsample colour + CoC (alpha = CoC in full-res px)
    this.mPre = M(HEAD + `uniform sampler2D tCol; uniform vec2 px;
      void main(){ vec3 c=vec3(0.); float cc=0.; for(int i=0;i<4;i++){ vec2 o=vec2(float(i-(i/2)*2)-.5, float(i/2)-.5)*px; c+=texture2D(tCol,vUv+o).rgb; cc=max(cc,coc(vUv+o)); } gl_FragColor=vec4(min(c/4.,vec3(40.)),cc); }`, { tCol: { value: null }, px: { value: new THREE.Vector2(1 / W, 1 / H) } });
    // 2) bokeh gather at half res, golden-angle spiral
    this.mDof = new THREE.ShaderMaterial({ vertexShader: VS, depthTest: false, depthWrite: false, uniforms: { tHalf: { value: this.half.texture }, hpx: { value: new THREE.Vector2(2 / W, 2 / H) }, maxC: this.U.maxC },
      fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D tHalf; uniform vec2 hpx; uniform float maxC;
      void main(){ vec4 c0=texture2D(tHalf,vUv); float R=maxC*0.5; vec3 acc=c0.rgb; float wsum=1.;
        for(int i=1;i<64;i++){ float fi=float(i); float r=sqrt(fi/63.)*R; float a=fi*2.39996; vec2 o=vec2(cos(a),sin(a))*r;
          vec4 s=texture2D(tHalf,vUv+o*hpx); float sc=s.a*0.5; float w=smoothstep(r-1.,r+.5,sc);
          float lum=dot(s.rgb,vec3(.3,.59,.11)); w*=1.+smoothstep(1.2,4.,lum)*1.5; acc+=s.rgb*w; wsum+=w; }
        gl_FragColor=vec4(acc/wsum,c0.a); }` });
    // 3) bloom bright pass + blur
    this.mBright = new THREE.ShaderMaterial({ vertexShader: VS, depthTest: false, depthWrite: false, uniforms: { t: { value: null }, thr: { value: 1.0 } },
      fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D t; uniform float thr; void main(){ vec3 c=texture2D(t,vUv).rgb; float l=max(c.r,max(c.g,c.b)); gl_FragColor=vec4(c*smoothstep(thr,thr*2.2,l),1.); }` });
    this.mBlur = new THREE.ShaderMaterial({ vertexShader: VS, depthTest: false, depthWrite: false, uniforms: { t: { value: null }, dir: { value: new THREE.Vector2() } },
      fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D t; uniform vec2 dir; void main(){ vec3 c=texture2D(t,vUv).rgb*0.1596; float w[6]; w[0]=.1484; w[1]=.1192; w[2]=.0826; w[3]=.0490; w[4]=.0250; w[5]=.0110; for(int i=0;i<6;i++){ vec2 o=dir*float(i+1)*1.5; c+=(texture2D(t,vUv+o).rgb+texture2D(t,vUv-o).rgb)*w[i]; } gl_FragColor=vec4(c,1.); }` });
    // 4) composite
    this.mComp = M(HEAD + `uniform sampler2D tCol, tDof, tB1, tB2; uniform float expo, bloom, sat, con, vig, grain, time, ca, warm; uniform vec3 lift, gain; uniform vec2 px;
      vec3 aces(vec3 c){ return clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.); }
      vec3 toS(vec3 c){ return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-.055, step(.0031308,c)); }
      float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec2 d=vUv-.5; vec2 cab=d*ca*px*8.;
        vec3 sharp=vec3(texture2D(tCol,vUv+cab).r, texture2D(tCol,vUv).g, texture2D(tCol,vUv-cab).b);
        float c=coc(vUv); vec4 bl=texture2D(tDof,vUv); float k=smoothstep(1.,3.5,max(c,bl.a*0.7)); vec3 col=mix(sharp,bl.rgb,k);
        col += (texture2D(tB1,vUv).rgb*0.6 + texture2D(tB2,vUv).rgb*0.8)*bloom;
        col *= expo; col = aces(col*1.7);
        float l=dot(col,vec3(.2126,.7152,.0722)); col=mix(vec3(l),col,sat);
        col = (col-.5)*con+.5;
        col = col*gain + lift*(1.-col);
        col = mix(col, col*vec3(1.05,1.0,0.95), warm*smoothstep(.4,1.,l)*(1.-smoothstep(.6,.9,col.b-col.r+.6))); col = mix(col, col*vec3(0.9,0.98,1.08), warm*smoothstep(.45,0.,l));
        float v=smoothstep(.95,.2,length(d*vec2(0.9,1.1))); col*=mix(1.-vig,1.,v);
        col=clamp(col,0.,1.); col=toS(col); col += (h(vUv*1000.+time)-.5)*grain;
        gl_FragColor=vec4(col,1.); }`,
      { tCol: { value: this.rt.texture }, tDof: { value: this.dof.texture }, tB1: { value: this.q1.texture }, tB2: { value: this.e1.texture }, px: { value: new THREE.Vector2(1 / W, 1 / H) },
        expo: { value: 1.0 }, bloom: { value: 0.2 }, sat: { value: 1.18 }, con: { value: 1.08 }, vig: { value: 0.32 }, grain: { value: 0.018 }, time: { value: 0 }, ca: { value: 0.6 }, warm: { value: 0.6 },
        lift: { value: new THREE.Vector3(0.0, 0.01, 0.03) }, gain: { value: new THREE.Vector3(1.02, 1.0, 0.97) } });
  }
  pass(mat, target) { this.quad.material = mat; this.gl.setRenderTarget(target); this.gl.render(this.scene, this.cam); }
  render(scene, cam, o = {}) {
    const gl = this.gl, U = this.U, C = this.mComp.uniforms;
    U.cn.value = cam.near; U.cf.value = cam.far; U.focus.value = o.focus ?? 5; U.aper.value = o.aper ?? 22 * Math.min(1.2, Math.max(0.22, 2.6 / (o.focus ?? 5))); U.maxC.value = o.maxC ?? 28;
    C.expo.value = o.expo ?? 1.0; if (o.lift != null && C.lift) C.lift.value.set(o.lift, o.lift + 0.008, o.lift + 0.025); C.bloom.value = o.bloom ?? 0.12; C.sat.value = o.sat ?? 1.18; C.con.value = o.con ?? 1.14; C.vig.value = o.vig ?? 0.32; C.warm.value = o.warm ?? 0.4; C.time.value = (o.time ?? 0) % 100;
    gl.setRenderTarget(this.rt); gl.render(scene, cam);
    this.mPre.uniforms.tCol.value = this.rt.texture; this.pass(this.mPre, this.half);
    this.pass(this.mDof, this.dof);
    this.mBright.uniforms.t.value = this.half.texture; this.mBright.uniforms.thr.value = o.thr ?? 1.5; this.pass(this.mBright, this.q1);
    const B = this.mBlur.uniforms; const bl = (src, dst, w, h, x, y) => { B.t.value = src.texture; B.dir.value.set(x / w, y / h); this.pass(this.mBlur, dst); };
    bl(this.q1, this.q2, this.W / 4, this.H / 4, 1, 0); bl(this.q2, this.q1, this.W / 4, this.H / 4, 0, 1);
    B.t.value = this.q1.texture; B.dir.value.set(0, 0); this.pass(this.mBlur, this.e1);
    bl(this.e1, this.e2, this.W / 8, this.H / 8, 1, 0); bl(this.e2, this.e1, this.W / 8, this.H / 8, 0, 1);
    this.pass(this.mComp, null);
  }
}
