import { rng, lerp } from './math.js';
import { INK, PAPER, RED, ell } from './canvas.js';
import { inkStroke, sample } from './brush.js';

// 侧视丹顶鹤，局部坐标：身体中心为原点、头朝右、单位 = 身长 S
// side: 1 近翼 / -1 远翼；phi: 扇翅角度
function wing(side, phi) {
  const up = Math.sin(phi), dep = Math.cos(phi) * side, lead = [], trail = [];
  for (let i = 0; i <= 8; i++) {
    const k = i / 8, x = .06 + k * .1 - k * k * .2, y = -.04 + k * .95 * (-up + dep * .3);
    lead.push([x, y]);
    trail.push([x - .32 * (1 - k) ** .8 - .04, y + .03]);
  }
  return { lead, trail };
}

function drawWing(ctx, w, a, lw) {
  const poly = [...w.lead, ...w.trail.slice().reverse()];
  ctx.fillStyle = `rgba(${PAPER},${a})`;
  ctx.beginPath();
  poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${INK},${.6 * a})`;
  ctx.lineWidth = 1.3 * lw;
  ctx.stroke();
  // 翼尖张开的初级飞羽
  const tip = w.lead[8], base = Math.atan2(tip[1] - w.lead[6][1], tip[0] - w.lead[6][0]);
  for (let f = 0; f < 4; f++) {
    const s = [lerp(w.lead[7][0], w.trail[7][0], f / 4), lerp(w.lead[7][1], w.trail[7][1], f / 4)];
    const ang = base + .12 + f * .14, len = .13 - f * .015;
    inkStroke(ctx, [s, [s[0] + Math.cos(ang) * len * .5, s[1] + Math.sin(ang) * len * .5], [s[0] + Math.cos(ang) * len, s[1] + Math.sin(ang) * len]], { w: .025, alpha: .8 * a, head: .1, tail: .7 });
  }
  // 次级飞羽为黑色，沿后缘排列
  for (let i = 1; i <= 6; i++) {
    const L = w.lead[i], T = w.trail[i], m = [lerp(L[0], T[0], .5), lerp(L[1], T[1], .5)];
    inkStroke(ctx, [m, T, [T[0] - .05, T[1] + .015]], { w: .06 * (1 - i / 10), alpha: .9 * a, head: .1, tail: .5 });
  }
}

// c = { x, y, S, phi }
export function drawCrane(ctx, c, a) {
  const far = wing(-1, c.phi), near = wing(1, c.phi), lw = 1 / c.S;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(c.S, c.S);
  drawWing(ctx, far, a * .85, lw);
  for (const dy of [0, .025]) inkStroke(ctx, [[-.2, .03 + dy], [-.45, .05 + dy], [-.66, .07 + dy]], { w: .016, alpha: .75 * a, head: 0, tail: .2 });
  ctx.fillStyle = `rgba(${PAPER},${a})`;
  ell(ctx, 0, 0, .3, .095);
  ctx.fill();
  ctx.strokeStyle = `rgba(${INK},${.55 * a})`;
  ctx.lineWidth = 1.2 * lw;
  ctx.stroke();
  inkStroke(ctx, [[-.12, -.02], [-.28, .02], [-.38, .07]], { w: .07, alpha: .9 * a, head: .2, tail: .6 });
  inkStroke(ctx, sample(s => [lerp(.24, .63, s), -.02 - Math.sin(s * Math.PI) * .06 - s * .06], 10), { w: .05, alpha: .92 * a, head: .05, tail: .1 });
  ctx.fillStyle = `rgba(${INK},${a})`;
  ell(ctx, .65, -.085, .04, .03);
  ctx.fill();
  ctx.fillStyle = `rgba(${RED},${a})`;
  ell(ctx, .655, -.11, .022, .013);
  ctx.fill();
  inkStroke(ctx, [[.68, -.08], [.76, -.075], [.84, -.068]], { w: .022, alpha: .8 * a, color: [110, 100, 70], head: 0, tail: .9 });
  drawWing(ctx, near, a, lw);
  ctx.restore();
}

// 鹤形点云（按 x 从头到尾排序，便于与鱼形点云一一对应变形）
export function craneSample(n, seed = 5) {
  const r = rng(seed), W = [wing(-1, .15), wing(1, .15)], out = [];
  for (let i = 0; i < n; i++) {
    const q = r();
    if (q < .12) { const s = r(); out.push([lerp(.84, .62, s), -.07 - s * .015]); }
    else if (q < .28) { const s = r(); out.push([lerp(.24, .63, s), -.02 - Math.sin(s * Math.PI) * .06 - s * .06]); }
    else if (q < .5) { const a = r() * Math.PI * 2, k = Math.sqrt(r()); out.push([Math.cos(a) * .3 * k, Math.sin(a) * .095 * k]); }
    else {
      const w = W[r() < .5 ? 0 : 1], j = Math.floor(r() * 9), m = r();
      out.push([lerp(w.lead[j][0], w.trail[j][0], m), lerp(w.lead[j][1], w.trail[j][1], m)]);
    }
  }
  return out.sort((a, b) => b[0] - a[0]);
}

export const craneWorld = (p, c) => [c.x + p[0] * c.S, c.y + p[1] * c.S];
