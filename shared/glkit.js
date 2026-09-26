// WebGL2 公共工具：上下文与自适应分辨率、着色器编译、错误显示、鼠标拖拽
// 以普通 <script> 引入，file:// 双击打开也能加载
window.glkit = {
  FULLSCREEN_VS: `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`,

  // 出错时把原因显示在页面上，而不是黑屏
  fail(msg) {
    const d = document.createElement('pre');
    d.style.cssText = 'position:fixed;inset:0;margin:0;padding:24px;color:#f88;background:#111;font:13px monospace;white-space:pre-wrap;z-index:9';
    d.textContent = msg;
    document.body.appendChild(d);
    throw new Error(msg);
  },

  // scale：相对设备像素比的渲染倍率，重着色器可调低
  context(canvas, scale = 1) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) this.fail('当前浏览器不支持 WebGL2');
    const resize = () => {
      const d = Math.min(2, devicePixelRatio || 1) * scale;
      canvas.width = Math.max(1, innerWidth * d | 0);
      canvas.height = Math.max(1, innerHeight * d | 0);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    addEventListener('resize', resize);
    resize();
    return gl;
  },

  program(gl, vsSrc, fsSrc) {
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) this.fail(`着色器编译失败：\n${gl.getShaderInfoLog(s)}`);
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) this.fail(`着色器链接失败：\n${gl.getProgramInfoLog(p)}`);
    gl.useProgram(p);
    return p;
  },

  uniforms(gl, prog, names) {
    return Object.fromEntries(names.map(n => [n, gl.getUniformLocation(prog, n)]));
  },

  // 拖拽累计偏移（x、y 以屏幕宽高归一化），带惯性衰减
  drag(el) {
    const s = { x: 0, y: 0, vx: 0, vy: 0, down: false, px: 0, py: 0 };
    el.addEventListener('pointerdown', e => { s.down = true; s.px = e.clientX; s.py = e.clientY; });
    addEventListener('pointerup', () => { s.down = false; });
    addEventListener('pointermove', e => {
      if (!s.down) return;
      s.vx = (e.clientX - s.px) / innerWidth;
      s.vy = (e.clientY - s.py) / innerHeight;
      s.x += s.vx; s.y += s.vy;
      s.px = e.clientX; s.py = e.clientY;
    });
    s.step = () => { if (!s.down) { s.x += s.vx; s.y += s.vy; s.vx *= .94; s.vy *= .94; } };
    return s;
  },
};
