# 开凿 · Listening Room

让声谱，推动开凿。带 Minecraft 开凿机频谱画面的纯静态音乐播放器，现为仓库 `main` 主线。

[打开播放器](https://xjh-jorhai.github.io/piston-audio-reactor/) · [六曲长廊定格版](https://xjh-jorhai.github.io/piston-audio-reactor/experiments/music-player/?v=0.1.0-player.3) · [原可视化工具归档](https://xjh-jorhai.github.io/piston-audio-reactor/visualizer/)

## 播放与画面

- **三种样式**：长廊、线性、横卧，在画面左下方切换。默认保留原来的长廊“播放器视角”。
- **音频连续**：只替换渲染器，共用音频元素和 Web Audio 图；进度、暂停状态、歌曲、歌词、音量和频谱设置不重置。
- **自由观察**：拖动旋转，Shift / 右键平移，滚轮缩放；触屏支持双指平移缩放。每种样式记住本次会话中的视角，恢复按钮回到该样式默认构图；路数改变后重新适配。
- **直接频谱驱动**：4–64 路，响应强度、平滑、行程端点及响应曲线可调。默认 38% → 0%，不使用周期载波。
- **音乐界面**：模糊加暗的封面背景、清晰悬浮封面、同步歌词、自定义播放与进度控制；点击歌词跳转。
- **本地导入**：读取音频 ID3、封面和歌词，也可单独导入封面 / LRC。文件只在浏览器处理，不上传、不写入后端或浏览器持久存储，刷新后重新选择。

固定演示曲目共六首，均附用户提供的同步 LRC 与 MP3 内嵌原始封面：

| 歌曲 | 艺术家 |
| --- | --- |
| Assumptions | Sam Gellaitry |
| おしえてかみさま | 理芽 |
| 双生コンフリクト | LOLUET / ヰ世界情緒 |
| 月 feat. ヰ世界情緒 | Guiano / ヰ世界情緒 |
| 琵琶曲（提供的 DJ 文件） | 秋秋 |
| 朋友的酒 | 李晓杰 / 玉萨 |

默认播放 Assumptions。浏览器限制自动播放时点击播放按钮。Space 播放 / 暂停，左右方向键前后 5 秒。数值偏好与样式选择保存在浏览器，不保存导入文件。

## 运行与构建

需要 Node.js 20+，无运行时外部依赖。

```sh
npm run dev
# 打开 http://127.0.0.1:4173/，自动进入 /player/
npm test
npm run build
```

`main` 直接保存播放器源码和静态资源，GitHub Pages 从主线发布。构建生成完整 `dist/`；整个 `player/` 也可单独部署。通过 HTTP 静态服务访问，不通过 file:// 打开 ES Modules。

分享链接支持 `player/?style=corridor`、`style=linear`、`style=lying`，只指定样式，路数与行程独立。`?autoplay=0` 关闭自动播放尝试，`?renderer=cpu` 检查 CPU 深度渲染回退。

## 版本与回退

| 版本 | 内容 | 在线目录 |
| --- | --- | --- |
| v1.2.0 | 播放器主线，三种可选样式 | `player/` |
| [v1.1.0](https://github.com/XJH-Jorhai/piston-audio-reactor/releases/tag/v1.1.0) | 六曲长廊播放器定格，集成其他样式前的版本 | `experiments/music-player/` |
| [v1.0.0](https://github.com/XJH-Jorhai/piston-audio-reactor/releases/tag/v1.0.0) | 原三版可视化工具定格 | `visualizer/` |

固定标签不移动。原播放器实验源码保留在 `v0.1.0-player.3`；`feature/music-player` 已合入主线，后续从 `main` 建短期分支。旧播放器预览发布脚本已停用，避免覆盖定格目录。

`visualizer/` 保留原工具完整目录及同页连续切换，不参与播放器开发。旧顶层横卧、长廊入口转到归档对应页面。历史实验标签与本地工作目录继续保留，详见 [展示路线与回退](EXPERIMENTS.md)。

## 维护与来源

`player/` 包含全部播放器代码、三种渲染器和素材；`tests/player/` 包含媒体、歌词与构图检查；`releases/` 保存发布记录。添加曲目时维护 `player/tracks.js`、`player/assets/` 与来源说明，不把访客导入文件加入仓库。

界面设计依据是用户标注图及模糊封面 / 悬浮封面要求，页面在项目内实现。音频分析与交互参考 Andy Wang 的 [reactor-audio-visualizer](https://github.com/wzk112/reactor-audio-visualizer)，原许可保留。完整音源、歌词、Minecraft 纹理、封面与设计来源见 [播放器来源与许可](player/CREDITS.md)。音乐、歌词、封面和 Minecraft 材质不以参考工程 MIT 许可重新授权。

不接入在线音乐账号或上传服务；此前 [网易云调研](docs/netease-integration.md) 已搁置。
