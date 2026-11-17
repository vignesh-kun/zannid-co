import * as THREE from 'three';

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
 vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
 vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
 vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
 float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
 vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
 vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
 vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
 vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
 vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;

const canvas = document.getElementById('gl') as HTMLCanvasElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer: THREE.WebGLRenderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch { canvas.remove(); throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene(); scene.background = new THREE.Color(0xfafafa);
const CZ = 7.6, camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100); camera.position.set(0, 0, CZ);

// Saturated studio environment → iridescent reflections
const env = new THREE.Scene();
env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 64, 32), new THREE.ShaderMaterial({ side: THREE.BackSide,
  vertexShader: 'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: 'varying vec3 v;void main(){float a=atan(v.z,v.x)/6.2831;vec3 c=.5+.5*cos(6.2831*(a*3.+v.y*1.2+vec3(0.,.33,.67)));c=pow(c,vec3(1.4));gl_FragColor=vec4(c*1.6,1.);}' })));
[[0, 6, 3], [-5, 1, 4]].forEach((p) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.2), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(2), toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(p[0], p[1], p[2]); m.lookAt(0, 0, 0); env.add(m);
});
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, 0.03).texture;

const group = new THREE.Group(); scene.add(group);
const U = { uTime: { value: 0 }, uAmp: { value: 1 }, uPull: { value: 0.1 }, uMouse: { value: new THREE.Vector3(0, 0, 1) } };
const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.14, transmission: 1, thickness: 2.2, ior: 1.5, iridescence: 1,
  iridescenceIOR: 1.8, iridescenceThicknessRange: [250, 1100], clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 1.1, dispersion: 6 });
glass.onBeforeCompile = (s) => {
  Object.assign(s.uniforms, U);
  s.vertexShader = s.vertexShader.replace('#include <common>', `#include <common>
uniform float uTime,uAmp,uPull;uniform vec3 uMouse;${NOISE}
float disp(vec3 p){vec3 n=normalize(p);float d=snoise(n*1.1+uTime*.32)*.26*uAmp+snoise(n*2.4-uTime*.55)*.07*uAmp;return d+pow(max(dot(n,uMouse),0.),3.)*uPull;}
vec3 dsp(vec3 p){return p+normalize(p)*disp(p);}`)
    .replace('#include <beginnormal_vertex>', `vec3 n0=normalize(normal);vec3 t1=normalize(abs(n0.y)>.99?cross(n0,vec3(1.,0.,0.)):cross(n0,vec3(0.,1.,0.)));vec3 t2=cross(n0,t1);
 vec3 pA=dsp(position);vec3 pB=dsp(position+t1*.01);vec3 pC=dsp(position+t2*.01);vec3 objectNormal=normalize(cross(pB-pA,pC-pA));`)
    .replace('#include <begin_vertex>', 'vec3 transformed=pA;');
};
const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1, innerWidth < 960 ? 40 : 64), glass); blob.scale.set(1, 1.28, 1); group.add(blob);
blob.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.82, 24), new THREE.ShaderMaterial({ uniforms: { uTime: U.uTime },
  vertexShader: 'varying vec3 vp;void main(){vp=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform float uTime;varying vec3 vp;${NOISE}
 void main(){float n=snoise(vp*2.4+uTime*.3)+.5*snoise(vp*5.+uTime*.5);vec3 c=.5+.5*cos(6.2831*(n*.55+vp.y*.6+uTime*.06+vec3(0.,.33,.67)));c=mix(vec3(dot(c,vec3(.33))),c,1.6);gl_FragColor=vec4(clamp(c,0.,1.)*1.15,1.);}` })));

const pivot = new THREE.Group(); group.add(pivot);
const R = 2.55, ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 8, 320), new THREE.MeshBasicMaterial({ color: 0x0a0a0a })); pivot.add(ring);
const hashA = new THREE.Object3D(); hashA.position.set(R * Math.cos(1.05), R * Math.sin(1.05), 0); ring.add(hashA);

// Sections become checkpoints on the ring
const secs = [...document.querySelectorAll<HTMLElement>('[data-label]')], STEP = 0.46;
const anchors: THREE.Object3D[] = [], dots: THREE.Mesh[] = [], labels: HTMLAnchorElement[] = [];
const dotGeo = new THREE.SphereGeometry(0.05, 14, 14), dotMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
secs.forEach((s, i) => {
  const ang = Math.PI + i * STEP, a = new THREE.Object3D(); a.position.set(R * Math.cos(ang), R * Math.sin(ang), 0); ring.add(a); anchors.push(a);
  const d = new THREE.Mesh(dotGeo, dotMat); d.position.copy(a.position); d.scale.setScalar(0); ring.add(d); dots.push(d);
  const l = document.createElement('a'); l.className = 'dl'; l.href = '#' + s.id; l.tabIndex = -1; l.setAttribute('aria-hidden', 'true');
  l.innerHTML = `<span class="num">${String(i).padStart(2, '0')}</span>${s.dataset.label}`; document.body.append(l); labels.push(l);
});

const HERO = [1.28, 0.18, -0.42], DIAL = [0.12, -0.22, 0];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t, clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const m = { x: 0, y: 0, sx: 0, sy: 0, vel: 0, kick: 0, px: -1e4, py: -1e4 };
addEventListener('pointermove', (e) => { const nx = (e.clientX / innerWidth) * 2 - 1, ny = -((e.clientY / innerHeight) * 2 - 1); m.vel += Math.hypot(nx - m.x, ny - m.y); m.x = nx; m.y = ny; m.px = e.clientX; m.py = e.clientY; }, { passive: true });
addEventListener('pointerdown', () => (m.kick = 0.6), { passive: true });
const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
addEventListener('resize', resize); resize();

const hash = document.getElementById('hash')!, tq = new THREE.Quaternion(), tv = new THREE.Vector3(), wp = new THREE.Vector3();
const P = (v: THREE.Vector3) => { v.project(camera); return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight]; };
let pS = 0, tS = 0, hov = 0, visible = true; const clock = new THREE.Clock();
document.addEventListener('visibilitychange', () => (visible = !document.hidden));

renderer.setAnimationLoop(() => {
  if (!visible) return;
  const dt = Math.min(clock.getDelta(), 0.05), t = reduce ? 0 : clock.elapsedTime, k = 1 - Math.exp(-dt * 6); U.uTime.value = t;
  const line = scrollY + innerHeight * 0.45; let p = 0;
  for (let i = 0; i < secs.length; i++) {
    const top = secs[i].offsetTop, nx = i < secs.length - 1 ? secs[i + 1].offsetTop : document.documentElement.scrollHeight;
    if (line >= top) p = i + clamp((line - top) / (nx - top));
  }
  pS = lerp(pS, Math.min(p, secs.length - 1), k); tS = lerp(tS, ease(clamp(scrollY / (innerHeight * 0.8))), k); const T = tS;
  const halfH = Math.tan(THREE.MathUtils.degToRad(17.5)) * CZ, halfW = halfH * camera.aspect, mob = innerWidth < 960;
  // Dial: ring ≈ screen height, leftmost point at ~76% width so content keeps the page
  const sD = mob ? 0.55 : (halfH * 1.12) / R, cxD = mob ? halfW * 0.95 : halfW * 0.52 + R * sD;
  // Hero: nucleus sits behind the wordmark, lifted clear of the headline
  const heroY = mob ? halfH * 0.42 : halfH * 0.16, hs = mob ? 0.62 : 0.9;
  group.position.set(lerp(0, cxD, T), lerp(heroY, mob ? -halfH * 0.7 : 0, T), 0); group.scale.setScalar(lerp(hs, sD, T));
  pivot.rotation.set(lerp(HERO[0], DIAL[0], T), lerp(HERO[1], DIAL[1], T), lerp(HERO[2], DIAL[2], T));
  ring.rotation.z = -pS * STEP; // clockwise while scrolling down
  m.sx = lerp(m.sx, m.x, 1 - Math.exp(-dt * 3)); m.sy = lerp(m.sy, m.y, 1 - Math.exp(-dt * 3));
  blob.position.lerp(tv.set(m.sx * 0.6 * (1 - T) + m.sx * 0.12 * T, m.sy * 0.45 * (1 - T) + m.sy * 0.25 * T, 0), k);
  blob.rotation.y = t * 0.15 + pS * 0.6;
  const [bx, by] = P(blob.getWorldPosition(wp)), br = innerHeight * 0.17 * group.scale.x;
  hov = lerp(hov, Math.hypot(m.px - bx, m.py - by) < br ? 1 : 0, k);
  m.vel *= Math.exp(-dt * 5); m.kick *= Math.exp(-dt * 3);
  const calm = reduce ? 0 : 1;
  U.uAmp.value = lerp(U.uAmp.value, 1 + calm * (Math.min(m.vel * 3, 1.6) + hov * 0.7), k);
  U.uPull.value = lerp(U.uPull.value, 0.1 + calm * (Math.min(m.vel * 2.5, 0.55) + m.kick + hov * 0.25), k);
  blob.getWorldQuaternion(tq).invert();
  U.uMouse.value.set(((m.px - bx) / innerWidth) * 4, (-(m.py - by) / innerHeight) * 4, 0.7).normalize().applyQuaternion(tq);
  const [hx, hy] = P(hashA.getWorldPosition(wp)); hash.style.transform = `translate(${hx}px,${hy}px)`; hash.style.opacity = String(1 - clamp(T * 2.5));
  const vis = clamp(T * 2 - 1);
  dots.forEach((d, i) => d.scale.setScalar(vis * (Math.round(pS) === i ? 1.6 : 1)));
  labels.forEach((l, i) => {
    const [x, y] = P(anchors[i].getWorldPosition(wp)), dist = Math.abs(i - pS), on = Math.round(pS) === i;
    l.classList.toggle('on', on);
    const inView = x > 0 && x < innerWidth - 40 && y > 70 && y < innerHeight - 30, o = inView ? vis * clamp(1.15 - dist * 0.45) : 0;
    l.style.opacity = String(o); l.style.pointerEvents = o > 0.3 ? 'auto' : 'none';
    l.style.transform = `translate(${x + 16}px,${y}px) translateY(-50%)`;
  });
  renderer.render(scene, camera);
});
