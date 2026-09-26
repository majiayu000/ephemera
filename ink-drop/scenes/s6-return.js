import { seg, lerp, rng, smooth, easeIn, easeOut, easeInOut } from '../engine/math.js';
import { INK, RED, makeCanvas, blot } from '../engine/canvas.js';
import { inkStroke, sample } from '../engine/brush.js';
import { FONT, chapterTitle } from '../engine/text.js';
import { penta } from '../engine/audio.js';

const POEM = ['墨落池中鱼', '鱼跃化云鹤', '鹤散作春雨', '雨归一砚墨'];
const DEGS = [9, 7, 5, 7, 4, 10, 9, 7, 9, 12, 12, 10, 9, 7, 5, 4, 5, 7, 4, 0];
const SEAL_T = 16.4;
const charTime = k => 3.6 + k * .55 + Math.floor(k / 5) * .5;

function glyph(ch, fs, dpr) {
  const sz = fs * 1.3, { c, x } = makeCanvas(sz, sz, dpr);
  x.font = `${fs}px ${FONT}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.shadowColor = `rgba(${INK},.45)`;
  x.shadowBlur = fs * .06;
  x.fillStyle = `rgba(${INK},.92)`;
  x.fillText(ch, sz / 2, sz / 2);
  return { c, sz };
}

// 白文印：朱红底，字与边缘斑驳处镂空露出纸色
function seal(sz, dpr) {
  const { c, x } = makeCanvas(sz, sz, dpr), r = rng(17);
  x.fillStyle = `rgb(${RED})`;
  x.fillRect(0, 0, sz, sz);
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 90; i++) {
    const edge = r() < .8, side = Math.floor(r() * 4), p = r() * sz, q = r() * sz * .06;
    const px = edge ? [p, sz - q, p, q][side] : r() * sz, py = edge ? [q, p, sz - q, p][side] : r() * sz;
    x.beginPath(); x.arc(px, py, .5 + r() * (edge ? 2 : 1), 0, Math.PI * 2); x.fill();
  }
  x.font = `bold ${sz * .72}px ${FONT}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('墨', sz / 2, sz / 2 + sz * .03);
  return c;
}

export default {
  name: '归砚',
  dur: 25,
  reset(env, t) {
    const { W, H, dpr } = env, fs = Math.min(H * .075, W * .055);
    this.prev = t;
    this.fs = fs;
    this.colGap = fs * 1.6;
    this.rowGap = fs * 1.2;
    this.x0 = W / 2 + this.colGap * 1.5;
    this.y0 = H / 2 - this.rowGap * 2 - fs * .2;
    this.glyphs = POEM.join('').split('').map(ch => glyph(ch, fs, dpr));
    this.sealSz = fs * 1.1;
    this.seal = seal(this.sealSz, dpr);
  },

  draw(ctx, t, env) {
    const { W, H, sound } = env, { fs, colGap, rowGap, x0, y0 } = this, hit = k => this.prev < k && t >= k;
    const fadeAll = 1 - smooth(seg(t, 20.5, 24));
    ctx.save();
    if (t < 3.6) {
      const e = easeInOut(seg(t, 0, 3.2)), tg = [x0, y0 - fs * .5];
      const A = [lerp(W * .08, tg[0], e), lerp(H * .5, tg[1], e)], B = [lerp(W * .92, tg[0], e), lerp(H * .5, tg[1], e)];
      const a = .85 * (1 - seg(t, 3, 3.6));
      inkStroke(ctx, sample(s => [lerp(A[0], B[0], s), lerp(A[1], B[1], s) + Math.sin(s * Math.PI) * 6 * (1 - e)], 30), { w: lerp(4, 7, e), alpha: a, head: .05, tail: .1, dry: .15, seed: 3 });
      if (e > .9) blot(ctx, env.ink, tg[0], tg[1], fs * .25, a);
    }

    this.glyphs.forEach((g, k) => {
      const tc = charTime(k), p = seg(t, tc, tc + .45);
      if (p <= 0) return;
      const col = Math.floor(k / 5), row = k % 5, cx = x0 - col * colGap, cy = y0 + row * rowGap, h = g.sz * easeOut(p);
      ctx.globalAlpha = fadeAll;
      ctx.drawImage(g.c, 0, 0, g.c.width, g.c.height * (h / g.sz), cx - g.sz / 2, cy - g.sz / 2, g.sz, h);
      ctx.globalAlpha = 1;
      if (p < 1) blot(ctx, env.ink, cx, cy - g.sz / 2 + h, fs * .12, .5 * fadeAll);
      if (hit(tc)) sound.pluck(penta(DEGS[k] + 5), .4, (cx / W) * 2 - 1);
    });

    const sp = seg(t, SEAL_T, SEAL_T + .35);
    if (sp > 0) {
      const sc = lerp(1.5, 1, easeIn(sp)), sz = this.sealSz * sc;
      const sx = x0 - 3 * colGap - colGap * .95, sy = y0 + rowGap * 3.5;
      ctx.globalAlpha = sp * fadeAll;
      ctx.drawImage(this.seal, sx - sz / 2, sy - sz / 2, sz, sz);
      const ta = smooth(seg(t, 18, 19.5)) * fadeAll;
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(${INK},${ta * .7})`;
      ctx.font = `${fs * .42}px ${FONT}`;
      ctx.textAlign = 'center';
      '一滴墨'.split('').forEach((ch, i) => ctx.fillText(ch, sx, y0 + rowGap * 1.2 + i * fs * .55));
    }
    chapterTitle(ctx, env, t, '陆', '归砚');
    ctx.restore();

    if (hit(SEAL_T + .35)) { sound.thud(60, .6); sound.pluck(penta(0, 73.42), .5); }
    if (hit(17)) [0, 4, 7, 10].forEach(d => sound.tone(penta(d), 6, .05));
    this.prev = t;
  },
};
