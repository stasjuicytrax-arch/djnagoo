import { useEffect, useRef } from 'react'
import { reducedMotion } from '@/lib/smooth'

const VERT = `#version 300 es
in vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

/**
 * Дымка (концепт 21st velvet-haze, перекрашен: серебро → ember, фиолет → crimson, база ink).
 * fbm-шум + гауссово сгущение под курсором + кольцевые волны от кликов + плёночное зерно.
 */
const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uPresence;
uniform vec3 uRip[4]; // x, y, startTime
out vec4 o;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 q = vec2(uv.x * asp, uv.y);
  vec2 m = vec2(uMouse.x * asp, uMouse.y);
  float t = uTime * 0.06;

  vec2 w = vec2(fbm(q * 1.4 + vec2(t, -t * 0.7)), fbm(q * 1.4 + vec2(-t * 0.8, t) + 5.2));
  float haze = fbm(q * 1.7 + w * 1.6 + t);

  // сгущение под курсором
  float d = distance(q, m);
  float near = exp(-d * d * 7.0) * uPresence;
  haze += near * 0.55;

  // волны от кликов
  float ring = 0.0;
  for (int i = 0; i < 4; i++){
    vec3 r = uRip[i];
    float age = uTime - r.z;
    if (r.z > 0.0 && age > 0.0 && age < 3.0){
      float dd = distance(q, vec2(r.x * asp, r.y));
      float front = age * 0.45;
      ring += sin((dd - front) * 28.0) * exp(-abs(dd - front) * 9.0) * (1.0 - age / 3.0);
    }
  }
  haze += ring * 0.28;

  vec3 ink = vec3(0.043, 0.035, 0.031);
  vec3 crimson = vec3(0.573, 0.008, 0.157);
  vec3 ember = vec3(0.965, 0.396, 0.149);
  vec3 hot = vec3(1.0, 0.54, 0.24);

  float k = smoothstep(0.28, 0.95, haze);
  vec3 col = mix(ink, crimson, k * 0.85);
  col = mix(col, ember, smoothstep(0.55, 1.1, haze + near * 0.35) * 0.9);
  col += hot * pow(max(haze - 0.78, 0.0), 2.0) * 1.6 * smoothstep(0.25, 0.7, uv.y);

  // виньетка и зерно
  float vig = smoothstep(1.25, 0.25, distance(uv, vec2(0.5)));
  col *= mix(0.35, 1.0, vig);
  // нижняя зона (контакты): темнее и без горячих бликов, чтобы текст держал контраст
  col *= mix(0.42, 1.0, smoothstep(0.05, 0.62, uv.y));
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.06;
  o = vec4(max(col, 0.0), 1.0);
}`

/** Фон Booking. Без WebGL2 или при reduced-motion остаётся статичный градиент (CSS). */
export default function HazeCanvas({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl) return
    const calm = reducedMotion()

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s))
      }
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      mouse: gl.getUniformLocation(prog, 'uMouse'),
      presence: gl.getUniformLocation(prog, 'uPresence'),
      rip: gl.getUniformLocation(prog, 'uRip'),
    }

    const mobile = window.matchMedia('(max-width: 767px)').matches
    // шейдеры в половинном разрешении на mobile (DESIGN §9), dpr не выше 1.25 на desktop
    const scale = mobile ? 0.5 : 0.6
    const resize = () => {
      const w = Math.max(2, Math.floor(canvas.clientWidth * scale))
      const h = Math.max(2, Math.floor(canvas.clientHeight * scale))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, w, h)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, pres: 0, tpres: 0 }
    const rips = new Float32Array(12)
    let ripI = 0
    const t0 = performance.now()
    const now = () => (performance.now() - t0) / 1000

    const toUV = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height }
    }
    const section = canvas.parentElement!
    const move = (e: PointerEvent) => {
      const p = toUV(e)
      mouse.tx = p.x
      mouse.ty = p.y
      mouse.tpres = 1
    }
    const leave = () => (mouse.tpres = 0)
    const down = (e: PointerEvent) => {
      const p = toUV(e)
      rips[ripI * 3] = p.x
      rips[ripI * 3 + 1] = p.y
      rips[ripI * 3 + 2] = now() + 0.0001
      ripI = (ripI + 1) % 4
    }
    const lost = (e: Event) => {
      e.preventDefault()
      canvas.style.opacity = '0' // остаётся CSS-градиент
    }
    canvas.addEventListener('webglcontextlost', lost)
    section.addEventListener('pointermove', move, { passive: true })
    section.addEventListener('pointerleave', leave)
    section.addEventListener('pointerdown', down, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)

    let raf = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      mouse.x += (mouse.tx - mouse.x) * 0.06
      mouse.y += (mouse.ty - mouse.y) * 0.06
      mouse.pres += (mouse.tpres - mouse.pres) * 0.05
      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform1f(u.time, calm ? 4 : now())
      gl.uniform2f(u.mouse, mouse.x, mouse.y)
      gl.uniform1f(u.presence, mouse.pres)
      gl.uniform3fv(u.rip, rips)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (canvas.style.opacity !== '1') canvas.style.opacity = '1'
    }
    if (calm) {
      frame()
      cancelAnimationFrame(raf)
    } else raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener('webglcontextlost', lost)
      section.removeEventListener('pointermove', move)
      section.removeEventListener('pointerleave', leave)
      section.removeEventListener('pointerdown', down)
      // loseContext не вызываем: StrictMode повторно берёт тот же контекст у того же canvas
      gl.deleteProgram(prog)
      gl.deleteBuffer(buf)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className={`absolute inset-0 size-full opacity-0 transition-opacity duration-[var(--dur-l)] ${className}`} />
}
