# Ephemera · 浮光

[English](README.md)

一组用纯代码实时生成的浏览器动画：没有图片、没有音频文件，画面由 Canvas / WebGL 绘制，声音由 Web Audio 合成。

| 作品 | 文件 | 技术 | 交互 |
|---|---|---|---|
| 一滴墨 | `ink-drop/` | Canvas 2D、Web Audio、ES 模块 | 底部章节时间轴跳转，空格暂停，←→ 跳 5 秒；鼠标引鱼、控制竹林风向 |
| 月下织机 | `moon-loom.html` | Canvas 2D、Karplus-Strong 拨弦 | 划过经线拨弦，按住加速织造 |
| 事件视界 | `black-hole.html` | WebGL2 光线步进 | 拖动环绕，滚轮缩放 |
| 百万星尘 | `stardust.html` | WebGL2 GPU 粒子（1,048,576 颗） | 点击变形，拖动旋转，鼠标推开粒子 |
| 霓虹夜驰 | `neon-drive.html` + `neon-drive-music.js` | WebGL2、Web Audio 音序器 | 点击启动，画面随鼓点同步 |

## 运行

除「一滴墨」外，其余作品都可以直接双击 HTML 打开。

「一滴墨」使用 ES 模块，浏览器不允许从 `file://` 加载，需要本地服务：

```bash
python3 -m http.server 8000
```

然后打开 http://localhost:8000/ ，首页 `index.html` 是作品画廊。

有声音的作品需要先点击一次页面，浏览器才允许播放。

## 目录

```
index.html              作品画廊
shared/glkit.js         WebGL2 公共工具（上下文、着色器编译、报错显示、拖拽）
black-hole.html         事件视界
stardust.html           百万星尘
neon-drive.html         霓虹夜驰（画面）
neon-drive-music.js     霓虹夜驰（配乐）
moon-loom.html          月下织机
ink-drop/               一滴墨（结构与时间轴见 ink-drop/SPEC.md）
```

## 环境要求

需要支持 WebGL2 和 Web Audio 的现代浏览器（Chrome、Edge、Firefox、Safari 15+）。
