export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeIn = t => clamp(t) ** 3;
export const easeOut = t => 1 - (1 - clamp(t)) ** 3;
export const easeInOut = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2; };
export const angDiff = (a, b) => ((a - b + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

// 确定性随机数：同一 seed 每帧结果一致，避免闪烁
export function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const P = new Uint8Array(512);
{
  const p = [...Array(256).keys()], r = rng(7);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
}
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
const grad = (h, x, y) => [x + y, -x + y, x - y, -x - y][h & 3];

export function noise(x, y) {
  const fx = Math.floor(x), fy = Math.floor(y), X = fx & 255, Y = fy & 255;
  x -= fx; y -= fy;
  const u = fade(x), v = fade(y), a = P[X] + Y, b = P[X + 1] + Y;
  return lerp(lerp(grad(P[a], x, y), grad(P[b], x - 1, y), u),
    lerp(grad(P[a + 1], x, y - 1), grad(P[b + 1], x - 1, y - 1), u), v);
}

export function fbm(x, y, oct = 4) {
  let s = 0, a = .5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * noise(x * f, y * f); a *= .5; f *= 2; }
  return s;
}
