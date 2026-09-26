import { rng } from './math.js';

export const PAPER = [239, 232, 216];
export const INK = [22, 21, 24];
export const RED = [182, 36, 32];

export function makeCanvas(w, h, dpr) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, x };
}

// 宣纸：底色 + 斑驳 + 纤维 + 暗角
export function makePaper(w, h, dpr) {
  const { c, x } = makeCanvas(w, h, dpr), r = rng(42);
  x.fillStyle = `rgb(${PAPER})`; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i++) {
    const px = r() * w, py = r() * h, rad = 40 + r() * 160, dark = r() < .5;
    const g = x.createRadialGradient(px, py, 0, px, py, rad);
    g.addColorStop(0, dark ? 'rgba(120,100,70,.014)' : 'rgba(255,255,250,.03)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  x.lineWidth = .6;
  for (let i = 0; i < w * h / 2500; i++) {
    const px = r() * w, py = r() * h, a = r() * Math.PI, l = 4 + r() * 14;
    x.strokeStyle = `rgba(90,75,50,${.04 + r() * .06})`;
    x.beginPath(); x.moveTo(px, py);
    x.quadraticCurveTo(px + Math.cos(a) * l * .5 + r() * 4 - 2, py + Math.sin(a) * l * .5 + r() * 4 - 2, px + Math.cos(a) * l, py + Math.sin(a) * l);
    x.stroke();
  }
  const v = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.max(w, h) * .75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(70,55,30,.12)');
  x.fillStyle = v; x.fillRect(0, 0, w, h);
  return c;
}

// 柔边圆点精灵，用于墨晕、云雾、灯光
export function makeSprite(rgb, size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d'), r = size / 2, g = x.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(.4, `rgba(${rgb},.5)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  return c;
}

export function blot(ctx, spr, x, y, r, a) {
  ctx.globalAlpha = a;
  ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

export function ell(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}
