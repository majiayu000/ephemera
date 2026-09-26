import { rng, lerp } from './math.js';
import { INK, ell } from './canvas.js';
import { inkStroke } from './brush.js';

// 俯视锦鲤。u: 0 鱼头 → 1 尾尖；v: -1..1 为身体左右边缘
export function fishHalf(u) {
  if (u < 0) return .02;
  if (u < .84) return .15 * Math.sin(Math.PI * Math.min(1, u + .08)) ** .6 * (1 - u * .6);
  return .03 + (u - .84) / .16 * .2;
}

export function fishPoints(n, seed = 3) {
  const r = rng(seed);
  return Array.from({ length: n }, () => ({ u: r(), v: r() * 2 - 1, z: r() })).sort((a, b) => a.u - b.u);
}

// f = { x, y, ang, L, ph }：位置、朝向、体长、摆尾相位
export function fishMap(u, v, f) {
  const h = fishHalf(u) * f.L, lx = (.5 - u) * f.L;
  const ly = v * h + Math.sin(u * 5 - f.ph) * .07 * f.L * Math.max(0, u);
  const c = Math.cos(f.ang), s = Math.sin(f.ang);
  return [f.x + lx * c - ly * s, f.y + lx * s + ly * c];
}

export function drawFish(ctx, f, a) {
  const at = (u, v) => fishMap(u, v, f), L = f.L;
  const run = (u0, u1, v, n = 12) => Array.from({ length: n + 1 }, (_, i) => at(lerp(u0, u1, i / n), v));
  const st = (pts, w, al, o = {}) => inkStroke(ctx, pts, { ...o, w: w * L, alpha: al * a });
  st(run(.02, .84, -1), .03, .85, { head: .1, tail: .3, dry: .2, seed: 5, bw: .7 });
  st(run(.02, .84, 1), .03, .85, { head: .1, tail: .3, dry: .2, seed: 6, bw: .7 });
  st(run(.12, .8, 0), .012, .3);
  st(run(.84, 1, -1, 5), .022, .8, { head: 0, tail: .4 });
  st(run(.84, 1, 1, 5), .022, .8, { head: 0, tail: .4 });
  st(Array.from({ length: 9 }, (_, i) => at(1 - .06 * Math.sin(Math.PI * i / 8), -1 + i / 4)), .012, .5);
  for (const k of [-1, 1]) {
    st([at(.24, .9 * k), at(.3, 1.8 * k), at(.4, 2.4 * k)], .03, .6, { head: .1, tail: .5 });
    st([at(.02, .3 * k), at(-.04, .5 * k), at(-.08, .9 * k)], .008, .5);
    const e = at(.07, .55 * k);
    ctx.fillStyle = `rgba(${INK},${a})`;
    ell(ctx, e[0], e[1], .016 * L, .016 * L);
    ctx.fill();
  }
}
