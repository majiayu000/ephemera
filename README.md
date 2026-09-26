# Ephemera · 浮光

[![CI](https://github.com/majiayu000/ephemera/actions/workflows/ci.yml/badge.svg)](https://github.com/majiayu000/ephemera/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[中文说明](README.zh-CN.md)

A collection of browser animations generated entirely by code. No images, no audio files: every frame is drawn live with Canvas / WebGL2 and every sound is synthesized with the Web Audio API. Close the tab and it is gone; open it again and it is computed anew.

| Piece | File | Technique | Interaction |
|---|---|---|---|
| **Ink Drop** · 一滴墨 | `ink-drop/` | Canvas 2D, Web Audio, ES modules | ~3-minute six-act ink-wash short film; chapter timeline, Space to pause, ←/→ to seek |
| **Moon Loom** · 月下织机 | `moon-loom.html` | Canvas 2D, Karplus-Strong string synthesis | Strum the warp threads; hold to weave faster |
| **Event Horizon** · 事件视界 | `black-hole.html` | WebGL2 ray marching with light bending | Drag to orbit, scroll to zoom |
| **Stardust** · 百万星尘 | `stardust.html` | WebGL2, 1,048,576 GPU particles | Click to morph, drag to rotate, hover to repel |
| **Neon Drive** · 霓虹夜驰 | `neon-drive.html` | WebGL2, Web Audio step sequencer | Click to start; visuals pulse with the drums |

## Recording

A one-minute excerpt of Ink Drop: [`ink-drop-video/一滴墨-1分钟.mp4`](ink-drop-video/一滴墨-1分钟.mp4)

## Run

Every piece except **Ink Drop** opens directly by double-clicking its HTML file.

Ink Drop uses ES modules, which browsers refuse to load from `file://`, so serve the folder locally:

```bash
git clone https://github.com/majiayu000/ephemera.git
cd ephemera
python3 -m http.server 8000
```

Then open http://localhost:8000/ — `index.html` is the gallery.

Pieces with sound need one click on the page before the browser allows audio.

## Layout

```
index.html              gallery
shared/glkit.js         shared WebGL2 helpers (context, shader compile, error display, drag)
black-hole.html         Event Horizon
stardust.html           Stardust
neon-drive.html         Neon Drive (visuals)
neon-drive-music.js     Neon Drive (music)
moon-loom.html          Moon Loom
ink-drop/               Ink Drop (structure and timeline in ink-drop/SPEC.md)
```

## Requirements

A modern browser with WebGL2 and Web Audio (Chrome, Edge, Firefox, Safari 15+).

## License

[MIT](LICENSE)
