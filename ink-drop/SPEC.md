# 一滴墨 · SPEC

一滴墨从砚台落下，依次化为鱼、鹤、云、雨、江河，最后写成一首诗回到砚台，首尾循环。水墨风格：宣纸底、墨色浓淡，只有鹤顶、灯笼、印章用朱红。

## 运行

ES 模块需要 http 服务：`python3 -m http.server` 后打开 `index.html`。

## 时间轴（相邻两幕交叉淡化 1.6s，循环约 170s）

| 幕 | 文件 | 时长 | 内容 | 声音 |
|---|---|---|---|---|
| 壹 落墨 | scenes/s1-drop.js | 25s | 毛笔蘸墨 → 笔尖挂墨滴 → 墨滴坠落、镜头推近 | 拨弦、水滴 |
| 贰 游鱼 | scenes/s2-fish.js | 30s | 墨入水晕开 → 聚成锦鲤游动（跟随鼠标）→ 跃出水面 | 古琴、涟漪 |
| 叁 化鹤 | scenes/s3-crane.js | 35s | 鱼形点云变形为鹤 → 飞越四层视差远山 → 散作云 | 风声、长音、鹤鸣 |
| 肆 云雨 | scenes/s4-rain.js | 35s | 墨云聚拢、闪电、雨、竹林随风（鼠标控风向）→ 积水 | 雨声、雷声 |
| 伍 江河 | scenes/s5-river.js | 30s | 江面、乌篷船与红灯笼、芦苇、飞鸟 → 收成一根墨线 | 流水、箫、橹声 |
| 陆 归砚 | scenes/s6-return.js | 25s | 墨线收拢 → 逐字写出五言四句 → 盖印章 | 逐字拨弦、印章声 |

## 模块

- `main.js`：画布、主循环、交叉淡化渲染
- `ui.js`：开场页、章节时间轴、键盘（空格暂停 / ←→ 跳 5 秒）
- `engine/director.js`：时间轴、可见场景、跳转
- `engine/math.js`：缓动、噪声、随机数
- `engine/canvas.js`：离屏画布、宣纸纹理、墨点精灵、配色
- `engine/brush.js`：变宽墨线（含枯笔飞白）
- `engine/text.js`：字体、章节标题
- `engine/audio.js`：WebAudio 合成（KS 拨弦、音色、环境噪声、混响）
- `engine/fish.js` / `crane.js` / `bamboo.js` / `boat.js` / `landscape.js`：各幕造型

## 场景接口

```js
{ name, dur, reset(env, t), draw(ctx, t, env) }
```

`env = { W, H, dpr, dt, now, mouse, sound, amb, ink, mist, red }`。场景在 `draw` 内用 `prev < k <= t` 触发声音事件；环境音通过 `env.amb.{wind,rain,water}` 上报，主循环统一设置。

## 约束

- 每个文件不超过 200 行
- 无外部依赖、无素材文件，全部程序生成
