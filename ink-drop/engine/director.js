// 时间轴：相邻两幕重叠 fade 秒用于交叉淡化，末幕与首幕首尾相接
export class Director {
  constructor(scenes, fade = 1.6) {
    this.scenes = scenes;
    this.fade = fade;
    let s = 0;
    this.starts = scenes.map(sc => { const v = s; s += sc.dur - fade; return v; });
    this.total = s;
    this.T = 0;
    this.paused = false;
    this.active = new Set();
  }

  tick(dt) { this.T = (this.T + dt) % this.total; }

  seek(T) {
    this.T = ((T % this.total) + this.total) % this.total;
    this.active.clear();
  }

  // 当前可见场景，按开始先后排序（先开始的作底层）
  visible(T) {
    const out = [];
    this.scenes.forEach((s, i) => {
      for (const tt of [T, T + this.total]) {
        const t = tt - this.starts[i];
        if (t >= 0 && t < s.dur) out.push({ i, t, s });
      }
    });
    return out.sort((a, b) => b.t - a.t);
  }

  chapter(T) {
    let c = 0;
    this.starts.forEach((s, i) => { if (T >= s) c = i; });
    return c;
  }
}
