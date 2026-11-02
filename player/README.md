# 开凿 · Listening Room

播放器现为仓库 `main` 主线，版本 `1.2.0`。此前六曲长廊已定格为 `v1.1.0`，目录 `experiments/music-player/` 不变；原可视化工具保留在 `visualizer/`。

- 长廊、线性、横卧三种画面直接切换；默认保留长廊“播放器视角”。共享音源、AudioContext、频谱、歌词与进度，不重新播放。
- 三种画面可自由旋转、平移和缩放，各自保留本次会话中的视角。恢复按钮重置当前样式，路数改变后重新适配。
- 4–64 路及行程映射共用当前设置，默认 38% → 0%。相机记录不带入旧工具的路数或响应参数。
- 六首固定曲目附原始内嵌封面和用户提供的 LRC，切歌自动载入，支持点击歌词跳转；旧请求不覆盖当前歌曲或手动导入歌词。
- 本地音频、封面与歌词只在浏览器处理，不上传、不持久保存；刷新后重新选择。数值偏好与样式选择可保存。
- 自定义播放、进度、前后 10 秒、音量、静音、单曲循环、全屏及系统 Media Session；Space 播放 / 暂停，左右方向键前后 5 秒。

## 开发与部署

仓库根目录运行 `npm run dev`，打开 `/` 或 `/player/`。`npm test` 检查完整项目，`npm run test:player` 只检查播放器，`npm run build` 输出完整 `dist/`。

整个 `player/` 可独立部署，包含渲染器及全部素材。`?style=corridor|linear|lying` 指定样式，`?autoplay=0` 关闭自动播放尝试，`?renderer=cpu` 检查 CPU 回退。

`tracks.js` 管理固定曲目，音频 / 封面 / LRC 位于 `assets/`。访客文件不修改曲目目录；切回演示音源时释放本地 Blob URL 并替换歌曲信息、封面与歌词。

`engine/` 保留长廊渲染器，`engine/linear/`、`engine/lying/` 从定格工具复制正交渲染器，旧代码只调整素材路径。`scene-styles.js` 管理加载与播放器构图。

素材、歌词和界面设计依据见 [CREDITS.md](CREDITS.md)。
