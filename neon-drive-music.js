// 合成器浪潮配乐：110 BPM，Am–F–C–G 四小节循环，16 小节一轮
// 前 4 小节只有铺底和琶音，第 5 小节鼓组和贝斯一起进入（画面同时“点燃”）
window.Music = (() => {
  const BPM = 110, S16 = 60 / BPM / 4, BARS = 16, INTRO = 4;
  const CHORDS = [[45, [0, 3, 7]], [41, [0, 4, 7]], [48, [0, 4, 7]], [43, [0, 4, 7]]];
  const f = m => 440 * 2 ** ((m - 69) / 12);
  const kicks = [];
  let ac, out, dly, noise, t0 = 0, next = 0, n = 0;

  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(.0001, t + a + d);
  }

  function osc(type, freq, t, a, dur, peak, dest, cutoff, detune = 0) {
    const o = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    lp.type = 'lowpass'; lp.frequency.value = cutoff;
    o.connect(lp).connect(g).connect(dest);
    env(g, t, a, peak, dur);
    o.start(t); o.stop(t + a + dur + .05);
  }

  function kick(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + .12);
    env(g, t, .002, .9, .35);
    o.connect(g).connect(out);
    o.start(t); o.stop(t + .4);
    kicks.push(t);
  }

  function hiss(t, dur, peak, type, freq) {
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; fl.type = type; fl.frequency.value = freq;
    s.connect(fl).connect(g).connect(out);
    env(g, t, .002, peak, dur);
    s.start(t, Math.random()); s.stop(t + dur + .05);
  }

  function play(i, t) {
    const s = i % 16, bar = Math.floor(i / 16) % BARS, [root, tri] = CHORDS[bar % 4], full = bar >= INTRO;
    if (s === 0) tri.forEach(k => { for (const dt of [-9, 9]) osc('sawtooth', f(root + 12 + k), t, .35, S16 * 15, .045, out, 1100, dt); });
    osc('square', f(root + 24 + tri[s % 3] + (s % 6 >= 3 ? 12 : 0)), t, .003, S16 * .9, full ? .045 : .065, dly, 2400);
    if (!full) return;
    if (s % 4 === 0) kick(t);
    if (s === 4 || s === 12) hiss(t, .18, .35, 'bandpass', 1800);
    hiss(t, s % 4 === 2 ? .12 : .03, s % 4 === 2 ? .12 : .05, 'highpass', 7000);
    osc('sawtooth', f(root - 12 + (s % 4 === 2 ? 12 : 0)), t, .003, S16 * .8, s % 4 === 0 ? .1 : .2, out, 600);
  }

  function tick() {
    while (next < ac.currentTime + .12) { play(n, next); next += S16; n++; }
  }

  return {
    start() {
      ac = new AudioContext();
      out = ac.createGain();
      out.gain.value = .7;
      out.connect(ac.createDynamicsCompressor()).connect(ac.destination);
      dly = ac.createGain();
      const d = ac.createDelay(1), fb = ac.createGain();
      d.delayTime.value = S16 * 3; fb.gain.value = .35;
      dly.connect(out); dly.connect(d); d.connect(fb).connect(d); d.connect(out);
      noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      noise.getChannelData(0).forEach((_, i, a) => { a[i] = Math.random() * 2 - 1; });
      t0 = next = ac.currentTime + .1;
      setInterval(tick, 25);
    },

    // 画面同步用：当前时间、所在小节、鼓点脉冲、是否进入高潮、进入高潮瞬间的闪光
    state() {
      const t = ac.currentTime, steps = Math.max(0, (t - t0) / S16), bar = Math.floor(steps / 16) % BARS;
      while (kicks.length > 1 && kicks[1] <= t) kicks.shift();
      const beat = kicks.length && kicks[0] <= t ? Math.exp(-(t - kicks[0]) * 7) : 0;
      const drop = bar === INTRO ? Math.exp(-(steps % (16 * BARS) - 16 * INTRO) * S16 * 2.5) : 0;
      return { t, bar, beat, full: bar >= INTRO, drop };
    },
  };
})();
