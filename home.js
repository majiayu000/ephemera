// 首页：浮光背景 + 作品悬停实时预览 + 滚动入场

// 浮光：冷暖两色光点缓慢上浮，远近分层，随鼠标轻微视差
(() => {
  const cv = document.getElementById('motes'), ctx = cv.getContext('2d');
  const sprite = (rgb) => {
    const c = document.createElement('canvas'), g = c.getContext('2d').createRadialGradient(32, 32, 0, 32, 32, 32);
    c.width = c.height = 64;
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(.25, `rgba(${rgb},.35)`); g.addColorStop(1, `rgba(${rgb},0)`);
    const x = c.getContext('2d'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return c;
  };
  const SPR = [sprite('255,214,160'), sprite('170,190,255'), sprite('255,160,190')];
  let W = 0, H = 0, mx = 0, my = 0, px = 0, py = 0;
  const motes = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random(), z: .15 + Math.random() * .85, s: Math.floor(Math.random() * 3), p: Math.random() * 6 }));
  const resize = () => {
    const d = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  addEventListener('resize', resize);
  addEventListener('pointermove', e => { mx = e.clientX / W - .5; my = e.clientY / H - .5; });
  resize();
  function frame(ms) {
    requestAnimationFrame(frame);
    const t = ms / 1000, scroll = scrollY / H;
    px += (mx - px) * .04; py += (my - py) * .04;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const m of motes) {
      m.y -= .00012 * (.3 + m.z);
      if (m.y < -.05) { m.y = 1.05; m.x = Math.random(); }
      const x = (m.x + Math.sin(t * .2 + m.p) * .01 - px * m.z * .04) * W;
      const y = ((m.y - scroll * m.z * .15 - py * m.z * .04) % 1.1 + 1.1) % 1.1 * H;
      const r = 3 + m.z * 16, a = (.25 + .35 * Math.sin(t * .8 + m.p) ** 2) * m.z;
      ctx.globalAlpha = a;
      ctx.drawImage(SPR[m.s], x - r, y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
})();

// 悬停实时预览：同一时间只运行一个作品，离开后释放 iframe 以腾出 GPU
(() => {
  const pv = document.getElementById('pv'), frame = pv.querySelector('iframe');
  let tx = 0, ty = 0, x = 0, y = 0, current = null, unload = 0;
  const W = 440, H = 275;
  addEventListener('pointermove', e => {
    tx = Math.min(innerWidth - W - 16, e.clientX + 36);
    ty = Math.max(16, Math.min(innerHeight - H - 16, e.clientY - H / 2));
  });
  document.querySelectorAll('.work').forEach(row => {
    row.addEventListener('pointerenter', () => {
      clearTimeout(unload);
      if (current !== row.dataset.preview) { current = row.dataset.preview; frame.src = current; }
      pv.style.borderColor = getComputedStyle(row).getPropertyValue('--c');
      if (!pv.classList.contains('on')) { x = tx; y = ty; }
      pv.classList.add('on');
    });
    row.addEventListener('pointerleave', () => {
      pv.classList.remove('on');
      unload = setTimeout(() => { frame.src = 'about:blank'; current = null; }, 500);
    });
  });
  (function follow() {
    requestAnimationFrame(follow);
    x += (tx - x) * .14; y += (ty - y) * .14;
    pv.style.left = `${x}px`; pv.style.top = `${y}px`;
  })();
})();

// 滚动入场：作品行依次浮现
(() => {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const i = [...e.target.parentNode.children].indexOf(e.target);
    e.target.style.transitionDelay = `${(i % 6) * .08}s`;
    e.target.classList.add('in');
    setTimeout(() => { e.target.style.transitionDelay = ''; }, 1500);
    io.unobserve(e.target);
  }), { threshold: .2 });
  document.querySelectorAll('.work').forEach(el => io.observe(el));
})();
