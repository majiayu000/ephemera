import { rng } from './math.js';
import { INK } from './canvas.js';

export const sample = (fn, n) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));

// 变宽墨线：沿折线求法线生成两侧轮廓并填充；head/tail 控制起收笔，dry 为飞白比例
export function inkStroke(ctx, pts, o = {}) {
  const n = pts.length;
  if (n < 2) return;
  const w = o.w ?? 6, head = o.head ?? .15, tail = o.tail ?? .35, col = o.color ?? INK;
  const L = [], R = [], N = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const s = i / (n - 1);
    const k = o.profile ? o.profile(s) : Math.min(1, head ? s / head : 1, tail ? (1 - s) / tail : 1);
    const hw = w * Math.max(k, .08) / 2;
    N.push([-dy, dx, hw]);
    L.push([pts[i][0] - dy * hw, pts[i][1] + dx * hw]);
    R.push([pts[i][0] + dy * hw, pts[i][1] - dx * hw]);
  }
  ctx.fillStyle = `rgba(${col},${o.alpha ?? .9})`;
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath();
  ctx.fill();
  if (o.dry) dryBristles(ctx, pts, N, o, col);
}

function dryBristles(ctx, pts, N, o, col) {
  const r = rng(o.seed ?? 11), count = o.bristles ?? 7;
  ctx.lineWidth = o.bw ?? .8;
  for (let b = 0; b < count; b++) {
    const f = r() * 2 - 1;
    ctx.strokeStyle = `rgba(${col},${(o.alpha ?? .9) * (.3 + r() * .5)})`;
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i < pts.length; i++) {
      const [nx, ny, hw] = N[i];
      if (r() < o.dry) { pen = false; continue; }
      const x = pts[i][0] + nx * hw * f * 1.35, y = pts[i][1] + ny * hw * f * 1.35;
      if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      pen = true;
    }
    ctx.stroke();
  }
}
