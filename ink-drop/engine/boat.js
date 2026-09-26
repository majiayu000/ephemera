import { INK, PAPER, RED, ell } from './canvas.js';
import { inkStroke } from './brush.js';

function hull(ctx) {
  ctx.beginPath();
  ctx.moveTo(-.5, -.06);
  ctx.quadraticCurveTo(0, .14, .52, -.1);
  ctx.quadraticCurveTo(0, .03, -.5, -.06);
  ctx.fill();
}

// 乌篷船 + 船夫 + 船头红灯笼；返回灯笼的世界坐标
export function drawBoat(ctx, x, y, S, t, a) {
  const lw = 1 / S, row = Math.sin(t * 1.6), swing = Math.sin(t * 1.7) * .12;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 1.1) * .03);
  ctx.scale(S, S);
  ctx.save();
  ctx.translate(0, .1);
  ctx.scale(1, -.6);
  ctx.fillStyle = `rgba(${INK},${.12 * a})`;
  hull(ctx);
  ctx.restore();
  ctx.fillStyle = `rgba(${INK},${.9 * a})`;
  hull(ctx);
  ctx.fillStyle = `rgba(${INK},${.72 * a})`;
  ctx.beginPath();
  ctx.moveTo(-.2, -.02);
  ctx.bezierCurveTo(-.2, -.22, .18, -.22, .18, -.02);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${PAPER},${.3 * a})`;
  ctx.lineWidth = lw;
  for (const k of [-.12, -.04, .04, .12]) {
    ctx.beginPath();
    ctx.moveTo(k, -.03);
    ctx.lineTo(k, -.03 - .14 * Math.sqrt(1 - (k / .2) ** 2));
    ctx.stroke();
  }
  const st = (pts, w, al) => inkStroke(ctx, pts, { w, alpha: al * a, head: .1, tail: .2 });
  st([[-.38, -.04], [-.37, -.16], [-.36, -.25]], .035, .9);
  st([[-.36, -.18], [-.5 + row * .04, -.04], [-.64 + row * .06, .07]], .012, .85);
  ctx.fillStyle = `rgba(${INK},${a})`;
  ell(ctx, -.36, -.275, .018, .018);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-.43, -.27); ctx.lineTo(-.36, -.335); ctx.lineTo(-.29, -.27);
  ctx.closePath();
  ctx.fill();
  st([[.4, -.07], [.43, -.19], [.46, -.3]], .008, .8);
  const lx = .46 + Math.sin(swing) * .06, ly = -.3 + Math.cos(swing) * .06;
  ctx.strokeStyle = `rgba(${INK},${.6 * a})`;
  ctx.beginPath(); ctx.moveTo(.46, -.3); ctx.lineTo(lx, ly - .02); ctx.stroke();
  ctx.fillStyle = `rgba(${RED},${a})`;
  ell(ctx, lx, ly, .022, .03);
  ctx.fill();
  ctx.fillStyle = `rgba(${INK},${.8 * a})`;
  ctx.fillRect(lx - .012, ly - .034, .024, .008);
  ctx.fillRect(lx - .012, ly + .026, .024, .008);
  ctx.restore();
  return [x + lx * S, y + ly * S];
}
