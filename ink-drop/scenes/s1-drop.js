import { seg, lerp, easeIn, easeOut, easeInOut, smooth } from '../engine/math.js';
import { INK, ell } from '../engine/canvas.js';
import { chapterTitle } from '../engine/text.js';
import { penta } from '../engine/audio.js';

// 毛笔：笔尖在原点，沿 -y 方向为笔杆；wet 为笔毛吸墨程度
function drawBrush(ctx, x, y, ang, s, wet) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  ctx.fillStyle = '#b8995f';
  ctx.fillRect(-6, -440, 12, 370);
  ctx.fillStyle = 'rgba(80,60,30,.35)';
  for (const ny of [-170, -290, -400]) ctx.fillRect(-6.5, ny, 13, 3);
  ctx.fillStyle = 'rgba(255,245,220,.35)';
  ctx.fillRect(-3, -440, 2, 370);
  ctx.fillStyle = '#4a3222';
  ctx.fillRect(-8, -78, 16, 12);
  const g = ctx.createLinearGradient(0, 0, 0, -66);
  g.addColorStop(0, 'rgb(12,12,14)');
  g.addColorStop(Math.min(.95, Math.max(.05, wet)), 'rgb(28,27,30)');
  g.addColorStop(1, 'rgb(150,135,110)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(11, -24, 9, -66);
  ctx.lineTo(-9, -66);
  ctx.quadraticCurveTo(-11, -24, 0, 0);
  ctx.fill();
  ctx.restore();
}

// 砚台：石身 + 墨池 + 高光 + 蘸墨涟漪
function drawStone(ctx, x, y, rx, rip) {
  const ry = rx * .38, px = x + rx * .1;
  ctx.fillStyle = 'rgba(40,38,40,.92)';
  ell(ctx, x, y + ry * .25, rx, ry); ctx.fill();
  ctx.fillStyle = 'rgb(70,68,70)';
  ell(ctx, x, y, rx, ry); ctx.fill();
  ctx.fillStyle = 'rgb(18,17,20)';
  ell(ctx, px, y, rx * .62, ry * .58); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ell(ctx, x - rx * .1, y - ry * .25, rx * .25, ry * .1); ctx.fill();
  ctx.strokeStyle = 'rgba(30,28,30,.8)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x - rx * .72, y, ry * .35, Math.PI * .6, Math.PI * 1.9); ctx.stroke();
  for (const d of [0, .35]) {
    const p = rip - d;
    if (p <= 0 || p >= 1) continue;
    ctx.strokeStyle = `rgba(200,200,210,${(1 - p) * .45})`;
    ctx.lineWidth = 1.2;
    ell(ctx, px, y, rx * (.05 + p * .5), ry * (.05 + p * .45)); ctx.stroke();
  }
}

function hangingDrop(ctx, tip, r, stretch) {
  const c = [tip[0], tip[1] + r * (1.1 + stretch * .9)], nw = r * .35 * (1 - stretch * .7);
  ctx.fillStyle = `rgba(${INK},.95)`;
  ctx.beginPath();
  ctx.moveTo(tip[0] - nw, tip[1]);
  ctx.lineTo(c[0] - r * .7, c[1] - r * .5);
  ctx.lineTo(c[0] + r * .7, c[1] - r * .5);
  ctx.lineTo(tip[0] + nw, tip[1]);
  ctx.fill();
  ell(ctx, c[0], c[1], r, r); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ell(ctx, c[0] - r * .35, c[1] - r * .35, r * .22, r * .14); ctx.fill();
}

function fallingDrop(ctx, x, y, r, elong) {
  ctx.fillStyle = `rgba(${INK},.95)`;
  ell(ctx, x, y, r, r * elong); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ell(ctx, x - r * .35, y - r * .4, r * .22, r * .14); ctx.fill();
}

export default {
  name: '落墨',
  dur: 25,
  reset(env, t) { this.prev = t; },
  draw(ctx, t, env) {
    const { W, H, sound } = env, s = H / 900, hit = k => this.prev < k && t >= k;
    const rx = Math.min(W * .14, H * .2), st = [W * .3, H * .8], pool = [st[0] + rx * .1, st[1]], hang = [W * .5, H * .3];
    let tip, ang, wet = .12;
    if (t < 7) {
      const e = easeInOut(seg(t, 1.5, 7));
      tip = [lerp(W * .85, pool[0], e), lerp(-H * .15, pool[1], e)];
      ang = lerp(.6, .15, e);
    } else if (t < 10) {
      const d = seg(t, 7, 10);
      tip = [pool[0] + Math.sin(d * 18) * 5 * s, pool[1] + Math.sin(d * Math.PI) * 8 * s];
      ang = .15 + Math.sin(d * 18) * .03;
      wet = lerp(.12, .85, smooth(seg(t, 7.3, 9.5)));
    } else {
      const e = easeInOut(seg(t, 10, 14));
      tip = [lerp(pool[0], hang[0], e), lerp(pool[1], hang[1], e) - Math.sin(e * Math.PI) * H * .12];
      tip[1] -= H * .9 * easeIn(seg(t, 20, 23));
      ang = lerp(.15, 0, e);
      wet = .85;
    }
    ctx.save();
    ctx.globalAlpha = 1 - smooth(seg(t, 20, 23));
    drawStone(ctx, st[0], st[1], rx, seg(t, 7.4, 9.4) * 1.35);
    ctx.globalAlpha = 1;
    drawBrush(ctx, tip[0], tip[1], ang, s, wet);
    const r = 9 * s * easeOut(seg(t, 13.5, 18.5));
    if (t < 19) {
      if (r > .3) hangingDrop(ctx, tip, r, seg(t, 17.2, 19));
    } else {
      const f = seg(t, 19, 20.5), z = 1 + 5 * easeIn(seg(t, 20.5, 25));
      fallingDrop(ctx, W / 2, lerp(hang[1] + r * 1.2, H * .55, easeIn(f)), r * z, f < 1 ? 1.25 : 1.05);
    }
    chapterTitle(ctx, env, t, '壹', '落墨');
    ctx.restore();

    if (hit(1)) sound.tone(penta(0, 73.42), 6, .07);
    if (hit(7.4)) sound.pluck(penta(7), .35, -.3);
    if (hit(8.8)) sound.pluck(penta(9), .3, -.3);
    if (hit(12)) sound.pluck(penta(12), .3);
    if (hit(15.5)) sound.pluck(penta(14), .25);
    if (hit(19)) sound.drop();
    if (hit(21)) sound.tone(penta(10), 5, .08, .01);
    this.prev = t;
  },
};
