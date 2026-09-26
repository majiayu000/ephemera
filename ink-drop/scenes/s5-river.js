import { seg, lerp, rng, smooth } from '../engine/math.js';
import { RED, blot } from '../engine/canvas.js';
import { inkStroke, sample } from '../engine/brush.js';
import { drawBoat } from '../engine/boat.js';
import { ridge } from '../engine/landscape.js';
import { chapterTitle } from '../engine/text.js';
import { penta, amb } from '../engine/audio.js';

const FAR = [
  { base: .45, amp: .12, sc: .002, seed: 5, line: 1.2 },
  { base: .47, amp: .07, sc: .004, seed: 6, line: 1.5 },
];
// 箫的旋律：[时间, 音级, 时值]
const XIAO = [[3, 7, 1.6], [4.6, 9, 1], [5.8, 10, 2.2], [8.5, 12, 1.2], [9.8, 10, 1], [11, 9, 2.6], [14.5, 7, 1.4], [16, 9, 1], [17.2, 5, 3], [21, 7, 4]];

export default {
  name: '江河',
  dur: 30,
  reset(env, t) {
    const r = rng(33);
    this.prev = t;
    this.rowK = null;
    this.ticks = Array.from({ length: 170 }, () => ({ x: r(), y: r(), l: .5 + r() }));
    this.reeds = Array.from({ length: 26 }, (_, i) => ({ x: i < 14 ? r() * .22 : .8 + r() * .2, h: .15 + r() * .2, ph: r() * 6 }));
  },

  draw(ctx, t, env) {
    const { W, H, sound } = env, fade = 1 - smooth(seg(t, 24, 28)), hz = H * .46, hit = k => this.prev < k && t >= k;
    ctx.save();
    FAR.forEach((l, k) => ridge(ctx, env, l, t * W * .004 * (k + 1), (k ? .3 : .16) * fade * smooth(seg(t, 0, 3))));

    for (const tk of this.ticks) {
      const d = tk.y, y = hz + (H - hz) * d ** 1.6 + H * .02, x = ((tk.x * W * 1.2 + t * (10 + d * 40)) % (W * 1.2)) - W * .1;
      const len = (8 + d * 40) * tk.l;
      inkStroke(ctx, [[x, y], [x + len * .5, y - 1 - d * 2], [x + len, y]], { w: 1 + d * 2.2, alpha: (.15 + d * .25) * fade, head: .3, tail: .4 });
    }

    const S = Math.min(W, H) * .32, bx = lerp(-W * .15, W * 1.1, seg(t, 2, 27)), by = H * .62 + Math.sin(t * 1.1) * H * .004;
    const lp = drawBoat(ctx, bx, by, S, t, fade);
    blot(ctx, env.red, lp[0], lp[1], S * .22, .35 * fade);
    for (let i = 0; i < 5; i++) {
      const y = by + S * (.08 + i * .05), x = lp[0] + Math.sin(t * 2 + i * 1.7) * S * .03;
      inkStroke(ctx, [[x - S * .04, y], [x, y + 1], [x + S * .04, y]], { w: 2.5, alpha: .3 * fade * (1 - i / 5), color: RED });
    }

    for (let i = 0; i < 3; i++) {
      const x = ((t * .03 + i * .12 + .1) % 1.2) * W, y = H * (.18 + i * .03), s = 8 + i * 2, w = Math.sin(t * 5 + i) * s * .4;
      inkStroke(ctx, [[x - s, y - w], [x, y]], { w: 1.8, alpha: .6 * fade, head: 0, tail: .3 });
      inkStroke(ctx, [[x, y], [x + s, y - w]], { w: 1.8, alpha: .6 * fade, head: 0, tail: .3 });
    }

    for (const rd of this.reeds) {
      const bx0 = rd.x * W, sw = Math.sin(t * .8 + rd.ph) * .1, h = rd.h * H;
      const pts = sample(s => [bx0 + Math.sin(s * 1.5) * sw * h, H + 5 - s * h], 6);
      inkStroke(ctx, pts, { w: 2.5, alpha: .7 * fade, head: 0, tail: .8 });
      const tp = pts[pts.length - 1];
      for (let k = 0; k < 6; k++) {
        const a = -Math.PI / 2 + sw * 3 + (k - 2.5) * .25;
        inkStroke(ctx, [tp, [tp[0] + Math.cos(a) * 14, tp[1] + Math.sin(a) * 14 + 6]], { w: 1.4, alpha: .45 * fade, head: 0, tail: .6 });
      }
    }

    const la = smooth(seg(t, 23.5, 27));
    if (la > 0) {
      const y = lerp(H * .7, H * .5, smooth(seg(t, 24, 28)));
      inkStroke(ctx, sample(s => [lerp(W * .08, W * .92, s), y + Math.sin(s * 9 + t) * 2 * (1 - la)], 40), { w: 4, alpha: .85 * la, head: .05, tail: .1, dry: .15, seed: 3 });
    }
    chapterTitle(ctx, env, t, '伍', '江河');
    ctx.restore();

    for (const [k, d, len] of XIAO) if (hit(k)) sound.tone(penta(d, 293.66), len + .6, .07, .012);
    const rk = Math.floor(t * 1.6 / (Math.PI * 2));
    if (this.rowK !== null && rk !== this.rowK && t < 26) sound.pluck(penta(0, 73.42), .3, bx / W * 2 - 1, 1);
    this.rowK = rk;
    amb(env, 'water', .45 * fade + .1);
    this.prev = t;
  },
};
