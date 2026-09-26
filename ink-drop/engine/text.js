import { seg } from './math.js';
import { INK, RED } from './canvas.js';

export const FONT = '"STKaiti","Kaiti SC","KaiTi","Songti SC",serif';

// 每幕开头右上角的竖排章节名，带一枚小朱印
export function chapterTitle(ctx, env, t, num, name) {
  const a = Math.min(seg(t, .6, 1.8), 1 - seg(t, 5, 6.5));
  if (a <= 0) return;
  const fs = Math.max(14, env.H * .026), x = env.W - fs * 2.4;
  let y = env.H * .12;
  ctx.save();
  ctx.fillStyle = `rgba(${INK},${a * .75})`;
  ctx.font = `${fs}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const ch of `${num}·${name}`) { ctx.fillText(ch, x, y); y += fs * 1.25; }
  ctx.fillStyle = `rgba(${RED},${a * .85})`;
  ctx.fillRect(x - fs * .35, y + fs * .3, fs * .7, fs * .7);
  ctx.restore();
}
