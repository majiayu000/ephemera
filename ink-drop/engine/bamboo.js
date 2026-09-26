import { rng } from './math.js';
import { INK } from './canvas.js';
import { inkStroke } from './brush.js';

// 竹林：左右两丛，depth 越大越近、越浓
export function makeGrove(W, H, seed = 9) {
  const r = rng(seed), out = [];
  for (let i = 0; i < 11; i++) {
    const x = i < 6 ? W * (.02 + r() * .26) : W * (.72 + r() * .26);
    const leaves = Array.from({ length: 14 }, () => ({ at: .45 + r() * .55, side: r() < .5 ? -1 : 1, ang: .5 + r() * .9, len: 26 + r() * 26, ph: r() * 6 }));
    out.push({ x, depth: r(), hgt: H * (.55 + r() * .4), segs: 6 + Math.floor(r() * 3), leaves, lean: (r() - .5) * .12, ph: r() * 6 });
  }
  return out.sort((a, b) => a.depth - b.depth);
}

const leafProfile = s => (s < .3 ? .35 + s / .3 * .65 : (1 - s) / .7);

export function drawGrove(ctx, grove, H, t, wind, alpha) {
  for (const b of grove) {
    const a = alpha * (.3 + b.depth * .65), w = 5 + b.depth * 7, sc = .7 + b.depth * .5;
    const sway = wind * (1 + Math.sin(t * 1.3 + b.ph) * .25);
    const spine = [[b.x, H + 5]], segLen = b.hgt / b.segs;
    let ang = -Math.PI / 2 + b.lean, x = b.x, y = H + 5;
    for (let s = 0; s < b.segs; s++) {
      ang += sway * .08;
      x += Math.cos(ang) * segLen;
      y += Math.sin(ang) * segLen;
      spine.push([x, y]);
    }
    ctx.strokeStyle = `rgba(${INK},${a})`;
    ctx.lineWidth = 2;
    for (let s = 0; s < b.segs; s++) {
      const [p, q] = [spine[s], spine[s + 1]], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy), g = 3 / len;
      const tw = w * (1 - s / b.segs * .45);
      inkStroke(ctx, [[p[0] + dx * g, p[1] + dy * g], [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], [q[0] - dx * g, q[1] - dy * g]], { w: tw, alpha: a, head: 0, tail: 0 });
      ctx.beginPath();
      ctx.moveTo(q[0] + dy / len * tw * .7, q[1] - dx / len * tw * .7);
      ctx.lineTo(q[0] - dy / len * tw * .7, q[1] + dx / len * tw * .7);
      ctx.stroke();
    }
    for (const lf of b.leaves) {
      const f = lf.at * b.segs, i = Math.min(b.segs - 1, Math.floor(f)), k = f - i;
      const P = [spine[i][0] + (spine[i + 1][0] - spine[i][0]) * k, spine[i][1] + (spine[i + 1][1] - spine[i][1]) * k];
      const dir = (lf.side > 0 ? lf.ang * .6 : Math.PI - lf.ang * .6) + sway * .5 + Math.sin(t * 3 + lf.ph) * .08;
      const L = lf.len * sc, dx = Math.cos(dir), dy = Math.sin(dir);
      const pts = [0, .25, .5, .75, 1].map(s => [P[0] + dx * L * s - dy * Math.sin(s * Math.PI) * L * .08, P[1] + dy * L * s + dx * Math.sin(s * Math.PI) * L * .08]);
      inkStroke(ctx, pts, { w: L * .22, alpha: a, profile: leafProfile });
    }
  }
}
