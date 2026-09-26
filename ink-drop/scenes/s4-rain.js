import { seg, rng, smooth, easeOut, fbm } from '../engine/math.js';
import { INK, PAPER, blot } from '../engine/canvas.js';
import { inkStroke } from '../engine/brush.js';
import { makeGrove, drawGrove } from '../engine/bamboo.js';
import { chapterTitle } from '../engine/text.js';
import { penta, amb } from '../engine/audio.js';

const STRIKES = [15.5, 23];

function makeBolt(W, H, seed) {
  const r = rng(seed), main = [];
  let x = W * (.35 + r() * .3), y = H * .22;
  while (y < H * .72) { main.push([x, y]); y += H * (.03 + r() * .04); x += (r() - .5) * W * .06; }
  const branches = [2, 4].map(i => {
    const p = main[Math.min(i, main.length - 1)], dir = r() < .5 ? -1 : 1;
    return [p, [p[0] + dir * W * .04, p[1] + H * .05], [p[0] + dir * W * .07, p[1] + H * .08]];
  });
  return { main, branches };
}

function polyline(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();
}

export default {
  name: '云雨',
  dur: 35,
  reset(env, t) {
    const r = rng(4);
    this.prev = t;
    this.clouds = Array.from({ length: 110 }, () => ({ x: r(), y: r(), r: .5 + r(), s: r() }));
    this.drops = Array.from({ length: 520 }, () => ({ x: r(), y: r(), l: .5 + r(), v: .8 + r() * .6 }));
    this.grove = makeGrove(env.W, env.H);
    this.bolts = STRIKES.map((_, i) => makeBolt(env.W, env.H, 7 + i * 6));
  },

  draw(ctx, t, env) {
    const { W, H, sound, mouse } = env, hit = k => this.prev < k && t >= k;
    const dark = .35 + .5 * smooth(seg(t, 2, 10)) * (1 - .6 * smooth(seg(t, 27, 33)));
    const rain = smooth(seg(t, 8, 12)) * (1 - smooth(seg(t, 26, 31))) * (.6 + .4 * smooth(seg(t, 13, 16)) * (1 - seg(t, 22, 25)));
    let wind = .4 + rain * .8 + Math.sin(t * .4) * .2;
    if (mouse.active) wind += (mouse.x / W - .5) * 2;
    ctx.save();

    const gather = easeOut(seg(t, 0, 5));
    for (const c of this.clouds) {
      const cx = W * (.5 + (c.x - .5) * 1.4 * gather) + t * W * .004 * (1 + c.s) + fbm(c.s * 9, t * .05) * W * .08;
      const cy = H * (.18 + (c.y * .35 - .1) * gather);
      blot(ctx, env.ink, cx, cy, H * (.05 + .1 * c.r) * (.5 + .5 * gather), .07 * dark * (.5 + c.s));
    }

    STRIKES.forEach((tb, i) => {
      const d = t - tb;
      if (d < 0 || d > .9) return;
      const k = (1 - d / .9) ** 2 * (d > .15 && d < .25 ? .4 : 1);
      ctx.fillStyle = `rgba(252,249,240,${k * .55})`;
      ctx.fillRect(0, 0, W, H);
      const b = this.bolts[i];
      for (const [w, a] of [[9, .25], [3, .95]]) {
        ctx.strokeStyle = `rgba(${PAPER},${a * k})`;
        ctx.lineWidth = w;
        polyline(ctx, b.main);
        ctx.lineWidth = w * .5;
        b.branches.forEach(p => polyline(ctx, p));
      }
    });

    const n = Math.floor(this.drops.length * rain), slant = wind * .25;
    ctx.strokeStyle = `rgba(${INK},.28)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const d = this.drops[i], y = ((d.y + t * d.v * 1.1) % 1.2 - .1) * H, x = (d.x * 1.3 - .15) * W + y * slant, len = H * .03 * d.l;
      ctx.moveTo(x, y);
      ctx.lineTo(x + len * slant, y + len);
    }
    ctx.stroke();

    drawGrove(ctx, this.grove, H, t, wind * .6, smooth(seg(t, 2, 6)));

    const wr = smooth(seg(t, 26, 34));
    if (wr > 0) {
      const top = H * (1 - .3 * wr), g = ctx.createLinearGradient(0, top, 0, H);
      g.addColorStop(0, `rgba(${INK},0)`);
      g.addColorStop(1, `rgba(${INK},${.25 * wr})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, top, W, H - top);
      for (let i = 0; i < 12; i++) {
        const y = top + (H - top) * (i + .5) / 12, x = ((i * .37 + t * .02) % 1) * W;
        inkStroke(ctx, [[x - W * .08, y], [x, y + 1], [x + W * .08, y]], { w: 1.5, alpha: .3 * wr });
      }
    }
    chapterTitle(ctx, env, t, '肆', '云雨');
    ctx.restore();

    STRIKES.forEach(tb => { if (hit(tb + .7)) sound.thunder(.8); });
    for (const [k, d] of [[3, 2], [7, 0], [20, 4], [30, 2]]) if (hit(k)) sound.pluck(penta(d, 73.42), .5);
    amb(env, 'rain', rain);
    amb(env, 'wind', .3 + .4 * rain);
    this.prev = t;
  },
};
