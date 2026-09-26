// 开场页、章节时间轴、键盘控制
export function setupUI(dir, onStart) {
  const intro = document.getElementById('intro'), bar = document.getElementById('bar');
  const prog = document.getElementById('prog'), pause = document.getElementById('pause');
  const chs = dir.scenes.map((s, i) => {
    const el = document.createElement('div');
    el.className = 'ch';
    el.textContent = s.name;
    el.style.left = `${dir.starts[i] / dir.total * 100}%`;
    bar.appendChild(el);
    return el;
  });
  let started = false, idle = 0;

  intro.addEventListener('click', () => {
    started = true;
    intro.classList.add('gone');
    onStart();
  });
  bar.addEventListener('click', e => {
    const r = bar.getBoundingClientRect();
    dir.seek((e.clientX - r.left) / r.width * dir.total);
  });
  addEventListener('keydown', e => {
    if (!started) return;
    if (e.code === 'Space') {
      dir.paused = !dir.paused;
      pause.style.opacity = dir.paused ? .6 : 0;
      e.preventDefault();
    }
    if (e.code === 'ArrowRight') dir.seek(dir.T + 5);
    if (e.code === 'ArrowLeft') dir.seek(dir.T - 5);
  });
  addEventListener('pointermove', () => {
    if (!started) return;
    bar.classList.add('show');
    clearTimeout(idle);
    idle = setTimeout(() => bar.classList.remove('show'), 2500);
  });

  return {
    update(T, ch) {
      prog.style.width = `${T / dir.total * 100}%`;
      chs.forEach((el, i) => el.classList.toggle('on', i === ch));
    },
  };
}
