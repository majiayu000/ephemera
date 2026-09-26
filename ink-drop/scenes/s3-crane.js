import { seg, lerp, smooth, easeIn, easeOut, noise } from '../engine/math.js';
import { RED, blot, ell } from '../engine/canvas.js';
import { fishPoints, fishMap } from '../engine/fish.js';
import { craneSample, craneWorld, drawCrane } from '../engine/crane.js';
import { ridge, mistBand } from '../engine/landscape.js';
import { chapterTitle } from '../engine/text.js';
import { penta, amb } from '../engine/audio.js';

const NP = 520;
const LAYERS = [
  { base: .62, amp: .26, sc: .0018, sp: .15, a: .2, seed: 1 },
  { base: .72, amp: .24, sc: .0026, sp: .3, a: .36, seed: 2 },
  { base: .83, amp: .22, sc: .0034, sp: .55, a: .58, seed: 3, line: 2.5 },
  { base: .98, amp: .18, sc: .0045, sp: 1, a: .85, seed: 4, line: 3 },
];
const CHORDS = [[1, [0, 4, 7]], [9, [2, 5, 9]], [17, [0, 3, 7]], [25, [4, 7, 12]]];

// 扇翅：振幅缓慢起伏，形成“扇几下、滑翔一阵”的节奏
const flap = t => Math.sin(t * 4.2) * .75 * (.5 + .5 * Math.sin(t * .9)) + .1;

export default {
  name: '化鹤',
  dur: 35,
  reset(env, t) {
    this.prev = t;
    this.fishPts = fishPoints(NP);
    this.cranePts = craneSample(NP);
  },

  draw(ctx, t, env) {
    const { W, H, sound } = env, cam = t * W * .05, hit = k => this.prev < k && t >= k;
    ctx.save();
    const sunA = smooth(seg(t, 1, 5));
    blot(ctx, env.red, W * .72, H * .3, H * .16, .18 * sunA);
    ctx.fillStyle = `rgba(${RED},${.22 * sunA})`;
    ell(ctx, W * .72, H * .3, H * .06, H * .06); ctx.fill();
    LAYERS.forEach((l, k) => {
      const a = l.a * smooth(seg(t, .5 + k * 1.3, 4 + k * 1.3));
      if (a <= 0) return;
      ridge(ctx, env, l, cam * l.sp, a);
      mistBand(ctx, env, H * (l.base - l.amp * .15), t, .55 * a / l.a, k);
    });

    const S = Math.min(W, H) * .32;
    const cr = { x: W * .42 + Math.sin(t * .15) * W * .06, y: H * .4 + Math.sin(t * .5) * H * .025, S, phi: flap(t) };
    if (t > 28) { cr.x += (t - 28) * W * .02; cr.y -= H * .35 * easeIn(seg(t, 28, 34)); }
    const fish = { x: W / 2, y: H * .95 - H * .55 * easeOut(seg(t, 0, 2.5)), ang: -Math.PI / 2, L: Math.min(W, H) * .24, ph: t * 6 };
    const eM = smooth(seg(t, .8, 4.5)), eD = smooth(seg(t, 28, 33));
    const spA = t < 6 ? 1 - smooth(seg(t, 4, 6)) : smooth(seg(t, 27.5, 29)) * (1 - seg(t, 32, 35));
    if (spA > 0) {
      for (let i = 0; i < NP; i++) {
        const fp = this.fishPts[i], a = fishMap(fp.u, fp.v, fish), b = craneWorld(this.cranePts[i], cr);
        let x = lerp(a[0], b[0], eM), y = lerp(a[1], b[1], eM), r = 6;
        if (t > 27) {
          const ga = i * 2.39996, gr = Math.sqrt((i + .5) / NP);
          const cx = W * .5 + Math.cos(ga) * gr * W * .34 + noise(i * .3, t * .2) * W * .05;
          const cy = H * .18 + Math.sin(ga) * gr * H * .11 + noise(i * .2 + 9, t * .2) * H * .04;
          x = lerp(b[0], cx, eD); y = lerp(b[1], cy, eD); r = lerp(6, 26, eD);
        }
        blot(ctx, env.ink, x, y, r, spA * lerp(.15, .05, eD));
      }
    }
    const ca = smooth(seg(t, 3.5, 5.5)) * (1 - smooth(seg(t, 28, 30.5)));
    if (ca > 0) drawCrane(ctx, cr, ca);
    chapterTitle(ctx, env, t, '叁', '化鹤');
    ctx.restore();

    for (const [k, ch] of CHORDS) if (hit(k)) ch.forEach(d => sound.tone(penta(d, 73.42), 7, .05));
    for (const k of [7, 15, 23]) if (hit(k)) sound.chirp(.2);
    if (hit(29)) sound.pluck(penta(15), .35);
    amb(env, 'wind', .55);
    this.prev = t;
  },
};
