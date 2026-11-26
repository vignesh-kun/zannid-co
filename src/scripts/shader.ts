/**
 * Zero-dependency WebGL shader field.
 *
 * One quad, one fragment shader, drawn only while it is on screen and the
 * tab is visible. DPR is capped, the loop runs at ~30fps and reduced-motion
 * visitors get a single still frame. If WebGL is unavailable the canvas
 * removes itself and the CSS gradient behind it stays.
 */
const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';

const FRAG = `precision highp float;
uniform vec2 uRes;
uniform float uTime;

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(7.1, 3.7);
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 p = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  vec2 uv = gl_FragCoord.xy / uRes;
  float t = uTime * 0.035;

  float n = fbm(p * 1.05 + vec2(t * 0.7, -t * 0.45));
  float n2 = fbm(p * 1.9 - vec2(t * 0.5, t * 0.32) + n * 0.9);
  float ribbon = sin((p.x * 0.9 + p.y * 1.2) * 2.1 + n2 * 3.2 + uTime * 0.12);

  vec3 violet = vec3(0.56, 0.44, 1.0);
  vec3 cyan = vec3(0.42, 0.88, 1.0);
  vec3 pink = vec3(1.0, 0.62, 0.82);
  vec3 amber = vec3(1.0, 0.84, 0.68);

  vec3 col = mix(violet, cyan, smoothstep(-1.0, 1.0, ribbon));
  col = mix(col, pink, smoothstep(0.18, 1.35, n2));
  col = mix(col, amber, smoothstep(0.62, 1.25, n) * 0.7);
  col = mix(vec3(1.0), col, 0.72);

  float vign = smoothstep(1.45, 0.15, length(p * vec2(0.72, 0.95)));
  float alpha = vign * (0.2 + 0.46 * n2);

  gl_FragColor = vec4(col, alpha);
}`;

type State = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  time: WebGLUniformLocation | null;
  res: WebGLUniformLocation | null;
  visible: boolean;
  raf: number;
  last: number;
  elapsed: number;
};

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function create(canvas: HTMLCanvasElement): State | null {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
    preserveDrawingBuffer: false,
  }) as WebGLRenderingContext | null;
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  return {
    canvas,
    gl,
    program,
    time: gl.getUniformLocation(program, 'uTime'),
    res: gl.getUniformLocation(program, 'uRes'),
    visible: true,
    raf: 0,
    last: 0,
    elapsed: 0,
  };
}

function size(state: State) {
  const { canvas, gl } = state;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = Math.max(1, Math.round(Math.min(rect.width, 1600) * dpr));
  const height = Math.max(1, Math.round(Math.min(rect.height, 1100) * dpr));
  if (canvas.width === width && canvas.height === height) return;
  canvas.width = width;
  canvas.height = height;
  gl.viewport(0, 0, width, height);
  gl.uniform2f(state.res, width, height);
}

function draw(state: State) {
  state.gl.uniform1f(state.time, state.elapsed);
  state.gl.drawArrays(state.gl.TRIANGLE_STRIP, 0, 4);
}

export function mountShaderField(canvas: HTMLCanvasElement) {
  const state = create(canvas);
  if (!state) {
    canvas.remove();
    return;
  }

  const { gl } = state;
  size(state);

  const render = (now: number) => {
    state.raf = requestAnimationFrame(render);
    if (!state.visible) return;
    if (now - state.last < 33) return;
    state.last = now;
    state.elapsed = now / 1000;
    gl.uniform1f(state.time, state.elapsed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  if (reduce) {
    draw(state);
    const ro = new ResizeObserver(() => {
      size(state);
      draw(state);
    });
    ro.observe(canvas);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        state.visible = entry.isIntersecting;
      });
    },
    { threshold: 0 },
  );
  io.observe(canvas);

  const ro = new ResizeObserver(() => size(state));
  ro.observe(canvas);

  state.raf = requestAnimationFrame(render);
}

const canvases = [...document.querySelectorAll<HTMLCanvasElement>('[data-shader]')];
canvases.forEach(mountShaderField);
