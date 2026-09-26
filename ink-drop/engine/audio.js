const SCALE = [0, 2, 4, 7, 9];
const LEVEL = { wind: .35, rain: .3, water: .22 };

// 五声音阶：deg 为音级序号，可跨八度
export const penta = (deg, base = 146.83) =>
  base * 2 ** (Math.floor(deg / 5) + SCALE[((deg % 5) + 5) % 5] / 12);

export const amb = (env, k, v) => { env.amb[k] = Math.max(env.amb[k] || 0, v); };

export class Sound {
  init() {
    if (this.ac) return;
    const ac = this.ac = new AudioContext();
    this.master = ac.createGain();
    this.master.gain.value = .8;
    this.master.connect(ac.createDynamicsCompressor()).connect(ac.destination);
    this.verb = ac.createConvolver();
    this.verb.buffer = this.impulse(3.2);
    const vg = ac.createGain();
    vg.gain.value = .35;
    this.verb.connect(vg).connect(this.master);
    this.noise = this.noiseBuffer(3);
    this.amb = { wind: this.loop('bandpass', 500, .8), rain: this.loop('highpass', 1400, .4), water: this.loop('lowpass', 420, .6) };
  }

  impulse(sec) {
    const ac = this.ac, n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2.5;
    }
    return b;
  }

  noiseBuffer(sec) {
    const ac = this.ac, n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  loop(type, freq, q) {
    const ac = this.ac, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = this.noise; src.loop = true;
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = 0;
    src.connect(f).connect(g).connect(this.master);
    src.start();
    return { f, g };
  }

  out(node, pan = 0, wet = .5) {
    const p = this.ac.createStereoPanner(), s = this.ac.createGain();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    s.gain.value = wet;
    node.connect(p);
    p.connect(this.master);
    p.connect(s).connect(this.verb);
  }

  // Karplus-Strong 拨弦，近似古琴 / 弦音
  pluck(freq, vel = .5, pan = 0, dur = 2.2) {
    if (!this.ac) return;
    const ac = this.ac, sr = ac.sampleRate, n = Math.floor(sr * dur), buf = ac.createBuffer(1, n, sr), d = buf.getChannelData(0);
    const p = Math.max(2, Math.round(sr / freq)), ring = new Float32Array(p).map(() => Math.random() * 2 - 1);
    for (let j = 0; j < n; j++) { const a = j % p; d[j] = ring[a]; ring[a] = .498 * (ring[a] + ring[(a + 1) % p]); }
    const src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = buf;
    g.gain.value = .25 * vel;
    src.connect(g);
    this.out(g, pan, .6);
    src.start();
  }

  tone(freq, dur = 3, vel = .15, vib = 0, pan = 0, type = 'sine') {
    if (!this.ac) return;
    const ac = this.ac, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    if (vib) {
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = 5; lg.gain.value = freq * vib;
      l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur);
    }
    const at = Math.min(.5, dur * .25);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + at);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g);
    this.out(g, pan, .7);
    o.start(t); o.stop(t + dur + .05);
  }

  sweep(f0, f1, len, vel, type = 'sine', pan = 0, delay = 0) {
    if (!this.ac) return;
    const ac = this.ac, t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + len * .4);
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + len);
    o.connect(g);
    this.out(g, pan, .6);
    o.start(t); o.stop(t + len + .05);
  }

  drop(pan = 0) { this.sweep(1500, 420, .3, .22, 'sine', pan); }
  thud(freq = 70, vel = .5) { this.sweep(freq * 1.8, freq, .6, vel); }
  chirp(pan = 0) { this.sweep(900, 1500, .35, .05, 'triangle', pan); this.sweep(950, 1450, .35, .045, 'triangle', pan, .32); }

  thunder(vel = .8) {
    if (!this.ac) return;
    const ac = this.ac, t = ac.currentTime, src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = this.noise; src.loop = true;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(60, t + 3.5);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + .08);
    g.gain.exponentialRampToValueAtTime(.0001, t + 4);
    src.connect(f).connect(g);
    this.out(g, 0, .5);
    src.start(t, Math.random()); src.stop(t + 4.2);
  }

  ambience(o) {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    for (const k in this.amb) this.amb[k].g.gain.setTargetAtTime((o[k] || 0) * LEVEL[k], t, .6);
    this.amb.wind.f.frequency.setTargetAtTime(420 + Math.sin(t * .35) * 180, t, .5);
  }
}
