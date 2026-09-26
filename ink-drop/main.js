import { Director } from './engine/director.js';
import { makeCanvas, makePaper, makeSprite, PAPER, INK, RED } from './engine/canvas.js';
import { Sound } from './engine/audio.js';
import { clamp } from './engine/math.js';
import { setupUI } from './ui.js';
import drop from './scenes/s1-drop.js';
import fish from './scenes/s2-fish.js';
import crane from './scenes/s3-crane.js';
import rain from './scenes/s4-rain.js';
import river from './scenes/s5-river.js';
import ret from './scenes/s6-return.js';

const cv = document.getElementById('stage'), ctx = cv.getContext('2d');
const dir = new Director([drop, fish, crane, rain, river, ret], 1.6);
const sound = new Sound();
const env = {
  W: 0, H: 0, dpr: 1, dt: 0, now: 0, amb: {}, sound,
  mouse: { x: 0, y: 0, last: -1e9, active: false },
  ink: makeSprite(INK), mist: makeSprite(PAPER), red: makeSprite(RED),
};
let paper = null, buf = null, started = false, last = performance.now();

function resize() {
  env.dpr = Math.min(2, devicePixelRatio || 1);
  env.W = innerWidth;
  env.H = innerHeight;
  if (!env.W || !env.H) return;
  cv.width = env.W * env.dpr;
  cv.height = env.H * env.dpr;
  cv.style.width = `${env.W}px`;
  cv.style.height = `${env.H}px`;
  ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
  paper = makePaper(env.W, env.H, env.dpr);
  buf = makeCanvas(env.W, env.H, env.dpr);
  dir.active.clear();
}

// 先开始的场景画在主画布，后开始的画到缓冲层再按淡入比例叠加
function render() {
  const vis = dir.visible(dir.T), ids = new Set(vis.map(v => v.i));
  for (const i of dir.active) if (!ids.has(i)) dir.active.delete(i);
  env.amb = {};
  vis.forEach((v, k) => {
    if (!dir.active.has(v.i)) { v.s.reset(env, v.t); dir.active.add(v.i); }
    const g = k === 0 ? ctx : buf.x;
    g.drawImage(paper, 0, 0, env.W, env.H);
    v.s.draw(g, v.t, env);
    if (k > 0) {
      ctx.globalAlpha = clamp(v.t / dir.fade);
      ctx.drawImage(buf.c, 0, 0, env.W, env.H);
      ctx.globalAlpha = 1;
    }
  });
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!env.W || !env.H) return;
  const dt = Math.min(.05, (now - last) / 1000);
  last = now;
  env.dt = started && !dir.paused ? dt : 0;
  env.now = now / 1000;
  env.mouse.active = now - env.mouse.last < 2000;
  if (!started) { ctx.drawImage(paper, 0, 0, env.W, env.H); return; }
  dir.tick(env.dt);
  render();
  sound.ambience(dir.paused ? {} : env.amb);
  ui.update(dir.T, dir.chapter(dir.T));
}

const ui = setupUI(dir, () => { sound.init(); started = true; dir.seek(0); });
addEventListener('resize', resize);
addEventListener('pointermove', e => {
  env.mouse.x = e.clientX;
  env.mouse.y = e.clientY;
  env.mouse.last = performance.now();
});
resize();
requestAnimationFrame(frame);
window.__ink = { dir, env };
