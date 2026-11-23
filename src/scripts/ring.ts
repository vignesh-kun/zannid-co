import * as THREE from 'three';

/**
 * Desktop-only, scroll-linked orbit. The ring turns clockwise as the page
 * scrolls and the nucleus follows the pointer. No scroll hijacking.
 */
const canvas = document.getElementById('ring-canvas') as HTMLCanvasElement | null;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && window.matchMedia('(min-width: 1024px)').matches) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    canvas.remove();
    throw new Error('WebGL unavailable');
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const cameraZ = 9;
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, cameraZ);

  /* Iridescent studio environment for the glass */
  const envScene = new THREE.Scene();
  envScene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(12, 48, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader:
          'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'varying vec3 v;void main(){float a=atan(v.z,v.x)/6.2831;vec3 c=.5+.5*cos(6.2831*(a*3.+v.y*1.2+vec3(0.,.33,.67)));c=pow(c,vec3(1.4));gl_FragColor=vec4(c*1.55,1.);}',
      }),
    ),
  );
  [
    [0, 6, 4],
    [-5, 1, 5],
    [5, -4, 3],
  ].forEach(([x, y, z]) => {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.3),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color().setScalar(2.4),
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    );
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    envScene.add(panel);
  });
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, 0.04).texture;

  const group = new THREE.Group();
  scene.add(group);

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.08,
    roughness: 0.16,
    transparent: true,
    opacity: 0.93,
    transmission: 0.2,
    thickness: 1.6,
    iridescence: 1,
    iridescenceIOR: 1.8,
    iridescenceThicknessRange: [220, 1000],
    clearcoat: 0.8,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.25,
  });
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 40), glass);
  blob.scale.set(1, 1.18, 1);
  group.add(blob);

  const coreUniform = { uTime: { value: 0 } };
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.9, 20),
    new THREE.ShaderMaterial({
      transparent: true,
      opacity: 0.85,
      uniforms: coreUniform,
      vertexShader:
        'varying vec3 vp;void main(){vp=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform float uTime;varying vec3 vp;
        void main(){
          float n=sin(vp.x*4.0+uTime*.35)*cos(vp.y*4.2-uTime*.25)*sin(vp.z*3.6+uTime*.2);
          vec3 a=vec3(1.0,.72,.55);
          vec3 b=vec3(.66,.64,1.0);
          vec3 c=vec3(.56,.94,.83);
          vec3 col=mix(a,b,smoothstep(-1.0,1.0,n));
          col=mix(col,c,smoothstep(.2,1.0,vp.y));
          col=mix(vec3(1.0),col,.62);
          gl_FragColor=vec4(col,0.55);
        }`,
    }),
  );
  blob.add(core);

  const RADIUS = 2.25;
  const orbit = new THREE.Group();
  group.add(orbit);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(RADIUS, 0.011, 8, 320),
    new THREE.MeshBasicMaterial({ color: 0x14141c, transparent: true, opacity: 0.78 }),
  );
  orbit.add(ring);

  const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x14141c });
  const dots: THREE.Mesh[] = [];
  const sections = [...document.querySelectorAll<HTMLElement>('[data-label]')];
  const count = Math.max(sections.length, 1);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.PI + (i / count) * Math.PI * 2;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), dotMaterial);
    dot.position.set(Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, 0);
    orbit.add(dot);
    dots.push(dot);
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener(
    'pointermove',
    (event) => {
      pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true },
  );

  let targetProgress = 0;
  let progress = 0;
  let activeSection = 0;
  const sectionLabel = document.querySelector<HTMLElement>('[data-ring-label]');
  const sectionIndex = document.querySelector<HTMLElement>('[data-ring-index]');

  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    targetProgress = Math.min(1, Math.max(0, window.scrollY / max));
    const line = window.scrollY + window.innerHeight * 0.45;
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top + window.scrollY <= line) activeSection = i;
    });
    if (sectionIndex) sectionIndex.textContent = String(activeSection + 1).padStart(2, '0');
    if (sectionLabel) sectionLabel.textContent = sections[activeSection]?.dataset.label || 'Start';
  };
  window.addEventListener('scroll', updateScroll, { passive: true });

  const layout = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const halfHeight = Math.tan(THREE.MathUtils.degToRad(19)) * cameraZ;
    const pixelsPerUnit = height / (2 * halfHeight);
    const radiusPx = Math.min(height * 0.285, width * 0.188);
    const scale = radiusPx / (RADIUS * pixelsPerUnit);
    const centerX = width - radiusPx - Math.max(34, width * 0.03);
    const worldX = (centerX - width / 2) / pixelsPerUnit;

    group.position.set(worldX, height < 760 ? -0.08 : 0.02, 0);
    group.scale.setScalar(scale);
    renderer.setSize(width, height, false);
  };
  window.addEventListener('resize', () => {
    layout();
    if (reduceMotion) renderer.render(scene, camera);
  });
  layout();
  updateScroll();

  if (reduceMotion) {
    orbit.rotation.z = -Math.PI * 0.08;
    renderer.render(scene, camera);
  } else {
    const clock = new THREE.Clock();
    let visible = true;
    document.addEventListener('visibilitychange', () => {
      visible = !document.hidden;
    });

    renderer.setAnimationLoop(() => {
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const ease = 1 - Math.exp(-dt * 7);
      progress += (targetProgress - progress) * ease;
      pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 3));
      pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 3));

      orbit.rotation.z = -progress * Math.PI * 1.15;
      dots.forEach((dot, i) => {
        const active = i === activeSection;
        const target = active ? 1.75 : 1;
        dot.scale.setScalar(dot.scale.x + (target - dot.scale.x) * ease);
      });

      blob.rotation.y = progress * 0.9 + pointer.x * 0.18;
      blob.rotation.x = pointer.y * 0.12;
      blob.position.x = pointer.x * 0.06;
      blob.position.y = -pointer.y * 0.05;
      coreUniform.uTime.value = clock.elapsedTime;

      renderer.render(scene, camera);
    });
  }
}
