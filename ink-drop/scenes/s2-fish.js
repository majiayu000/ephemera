import { seg, lerp, rng, smooth, easeIn, easeOut, noise, angDiff } from '../engine/math.js';
import { INK, makeCanvas, blot, ell } from '../engine/canvas.js';
import { inkStroke } from '../engine/brush.js';
import { fishPoints, fishMap, drawFish } from '../engine/fish.js';
import { chapterTitle } from '../engine/text.js';
import { penta, amb } from '../engine/audio.js';

const NP = 520;
const NOTES = [[2, 7], [4.5, 9], [7, 8], [9.5, 11], [12, 10], [14, 7], [16.5, 12], [19, 9], [21.5, 8], [23, 5]];

// 荷叶层：静态预渲染
function makeLeaves(env) {
  const { W, H } = env, { c, x } = makeCanvas(W, H, env.dpr), r = rng(21), R = Math.min(W, H);
  for (const [lx, ly, lr] of [[.13, .28, .16], [.86, .74, .19], [.8, .18, .11], [.2, .86, .1]]) {
    const cx = W * lx, cy = H * ly, rad = R * lr;
    for (let i = 0; i < 40; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad * .7;
      blot(x, env.ink, cx + Math.cos(a) * d, cy + Math.sin(a) * d, rad * (.3 + r() * .25), .045);
    }
    for (let i = 0; i < 13; i++) {
      const a = i / 13 * Math.PI * 2 + r() * .2;
      inkStroke(x, [[cx, cy], [cx + Math.cos(a) * rad * .5, cy + Math.sin(a) * rad * .5], [cx + Math.cos(a) * rad * .95, cy + Math.sin(a) * rad * .95]], { w: 1.6, alpha: .25, head: .05, tail: .8 });
    }
    const edge = Array.from({ length: 41 }, (_, i) => { const a = i / 40 * Math.PI * 2, k = 1 + (r() - .5) * .05; return [cx + Math.cos(a) * rad * k, cy + Math.sin(a) * rad * k]; });
    inkStroke(x, edge, { w: 2.5, alpha: .35, head: .02, tail: .02, dry: .3, seed: 8 });
  }
  for (let i = 0; i < 60; i++) blot(x, env.ink, r() * W, r() * H, 2 + r() * 3, .25);
  return c;
}

function ring(ctx, x, y, rad, a) {
  if (a <= 0 || rad <= 0) return;
  ctx.strokeStyle = `rgba(${INK},${a})`;
  ctx.lineWidth = 1.2;
  ell(ctx, x, y, rad, rad * .85); ctx.stroke();
}

export default {
  name: '游鱼',
  dur: 30,
  reset(env, t) {
    const r = rng(12);
    this.prev = t;
    this.pts = fishPoints(NP);
    this.fish = null;
    this.rips = [];
    this.lastRip = 0;
    this.lastNote = 0;
    this.leaves = makeLeaves(env);
    this.lines = Array.from({ length: 26 }, () => ({ x: r(), y: r(), l: .05 + r() * .12, p: r() * 6 }));
  },

  swim(t, env, C, L) {
    const { W, H, dt, mouse } = env;
    if (!this.fish) this.fish = { x: C[0], y: C[1], ang: -Math.PI / 2, ph: 0 };
    const f = this.fish, P = [W / 2, H * .62];
    f.L = L;
    f.ph += dt * (t > 26 ? 12 : 6);
    if (t >= 26) {
      f.x = P[0]; f.y = P[1] - H * 1.1 * easeIn(seg(t, 26, 28.8)); f.ang = -Math.PI / 2;
    } else if (t > 24.5) {
      const k = Math.min(1, dt * 3);
      f.x = lerp(f.x, P[0], k); f.y = lerp(f.y, P[1], k); f.ang += angDiff(-Math.PI / 2, f.ang) * k;
    } else if (t > 6) {
      const tt = t - 6, follow = mouse.active && t > 8;
      const tx = follow ? mouse.x : C[0] + W * .26 * Math.sin(tt * .23), ty = follow ? mouse.y : C[1] + H * .13 * Math.sin(tt * .37);
      const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy);
      if (d > 1) {
        f.ang += angDiff(Math.atan2(dy, dx), f.ang) * Math.min(1, dt * 2.2);
        const sp = Math.min(d, L * .9) * 1.2;
        f.x += Math.cos(f.ang) * sp * dt; f.y += Math.sin(f.ang) * sp * dt;
      }
    }
    return f;
  },

  draw(ctx, t, env) {
    const { W, H, sound, mouse } = env, L = Math.min(W, H) * .24, C = [W / 2, H * .55], hit = k => this.prev < k && t >= k;
    ctx.save();
    for (const ln of this.lines) {
      const y = ln.y * H + Math.sin(t * .5 + ln.p) * 3, x = ((ln.x + t * .004) % 1.1 - .05) * W;
      inkStroke(ctx, [[x, y], [x + ln.l * W * .5, y + 1.5], [x + ln.l * W, y]], { w: 1.5, alpha: .12, head: .3, tail: .5 });
    }
    ctx.globalAlpha = smooth(seg(t, 1.5, 6));
    ctx.drawImage(this.leaves, 0, 0, W, H);
    ctx.globalAlpha = 1;
    for (let k = 0; k < 3; k++) { const rt = t - k * .35; if (rt > 0 && rt < 4) ring(ctx, C[0], C[1], rt * L * .9, (1 - rt / 4) * .5); }
    for (let k = 0; k < 3; k++) { const rt = t - 26 - k * .3; if (rt > 0 && rt < 3) ring(ctx, W / 2, H * .62, rt * L * .8, (1 - rt / 3) * .5); }
    if (mouse.active && t > 2 && t < 26 && env.now - this.lastRip > .18) {
      this.rips.push({ x: mouse.x, y: mouse.y, t0: t });
      this.lastRip = env.now;
      if (env.now - this.lastNote > .7) { sound.pluck(penta(12 + Math.floor(Math.random() * 6)), .15, mouse.x / W * 2 - 1); this.lastNote = env.now; }
    }
    this.rips = this.rips.filter(p => t - p.t0 < 2.5 && t >= p.t0);
    for (const p of this.rips) { const age = t - p.t0; ring(ctx, p.x, p.y, age * L * .5, (1 - age / 2.5) * .3); ring(ctx, p.x, p.y, age * L * .3, (1 - age / 2.5) * .2); }

    const f = this.swim(t, env, C, L), e = smooth(seg(t, 5.5, 11)), spread = easeOut(seg(t, 0, 6));
    this.pts.forEach((p, i) => {
      const ga = i * 2.39996 + t * .6 + noise(i * .05, t * .15) * 2, rad = Math.sqrt((i + .5) / NP) * L * .9 * spread;
      const tg = fishMap(p.u, p.v, f);
      const x = lerp(C[0] + Math.cos(ga) * rad, tg[0], e), y = lerp(C[1] + Math.sin(ga) * rad * .8, tg[1], e);
      blot(ctx, env.ink, x, y, lerp(8 + rad * .12, 5 + (1 - Math.abs(p.v)) * 6, e), lerp(.07, .16, e) * (.6 + p.z * .4));
    });
    const la = smooth(seg(t, 9.5, 12.5));
    if (la > 0) drawFish(ctx, f, la);
    for (let k = 0; k < 14; k++) {
      const age = t - 26;
      if (age <= 0 || age > 1.6) break;
      const a = k / 14 * Math.PI * 2;
      blot(ctx, env.ink, W / 2 + Math.cos(a) * age * L * 1.1, H * .62 + Math.sin(a) * age * L * .9, 3, (1 - age / 1.6) * .6);
    }
    chapterTitle(ctx, env, t, '贰', '游鱼');
    ctx.restore();

    for (const [k, d] of NOTES) if (hit(k)) sound.pluck(penta(d), .35, Math.random() - .5);
    if (hit(26)) { sound.drop(); sound.pluck(penta(14), .4); }
    amb(env, 'water', .35);
    this.prev = t;
  },
};
