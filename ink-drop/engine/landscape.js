import { fbm } from './math.js';
import { INK } from './canvas.js';
import { inkStroke } from './brush.js';

// 远山：fbm 生成山脊，山顶浓、山脚渐淡入雾。l = { base, amp, sc, seed, line }
export function ridge(ctx, env, l, offset, a) {
  const { W, H } = env, pts = [];
  for (let x = -20; x <= W + 20; x += 8) {
    const n = fbm((x + offset) * l.sc, l.seed * 7.3, 5) * 1.1 + .45;
    pts.push([x, H * l.base - H * l.amp * Math.max(0, n) ** 1.4]);
  }
  let top = H;
  for (const p of pts) top = Math.min(top, p[1]);
  const g = ctx.createLinearGradient(0, top, 0, H * l.base + H * .1);
  g.addColorStop(0, `rgba(${INK},${a})`);
  g.addColorStop(.6, `rgba(${INK},${a * .3})`);
  g.addColorStop(1, `rgba(${INK},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-20, H);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.lineTo(W + 20, H);
  ctx.closePath();
  ctx.fill();
  inkStroke(ctx, pts, { w: l.line ?? 2, alpha: a * .9, head: 0, tail: 0 });
}

// 横向飘移的雾带（宣纸色柔光点）
export function mistBand(ctx, env, y, t, a, seed) {
  const rw = env.W * .22, rh = env.H * .045;
  ctx.globalAlpha = a;
  for (let i = 0; i < 7; i++) {
    const x = ((i / 7 + t * .006 * (1 + (i % 3)) + seed * .13) % 1.2 - .1) * env.W;
    ctx.drawImage(env.mist, x - rw, y - rh + Math.sin(i * 2.3 + seed) * rh, rw * 2, rh * 2);
  }
  ctx.globalAlpha = 1;
}
