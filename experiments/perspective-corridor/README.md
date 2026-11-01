# 让声谱，推动开凿。 · 透视长廊版

v0.3.0-corridor.2，独立分支 experiment/perspective-corridor。默认保留原始近大远小的长廊构图；旧版本 v0.2.0-corridor.1 标签可用于对比和回退。

- [长廊 Demo](https://xjh-jorhai.github.io/piston-audio-reactor/experiments/perspective-corridor/)
- [线性版](https://xjh-jorhai.github.io/piston-audio-reactor/) · [横卧版](https://xjh-jorhai.github.io/piston-audio-reactor/experiments/lying-eight/)
- 默认 16 路，支持 4–64 路和 8/16/32/64 快捷选择。链接可使用 `?count=64`。
- FFT 4096，对数频段覆盖 40 Hz–16 kHz；频谱响度直接映射到实际机械位置，没有周期载波。
- 电平 → 行程支持低/高电平端点及响应曲线。默认 38% → 0%，其中生成器进度 0% 表示躯干全伸出、50% 表示全收回。暂停或静音返回低电平端点。
- 高电平默认使中央躯干伸出，左右手臂同步反向。机械行程限制在一格，南瓜与活塞底座固定。
- 映射保存在当前浏览器，独立于线性版和横卧版。“恢复 38 → 0”只重置映射；响应默认值同时重置强度和平滑。
- 长廊/俯视预设、拖动自由旋转、Shift/右键拖动平移、滚轮缩放、单台聚焦、全屏。触屏支持单指旋转、双指平移和缩放。方向键旋转，Shift+方向键平移，Home 适配。
- 调节路数保留观察角度并适配新阵列。频谱条根据路数压缩间距，不产生水平滚动条；场景不再显示机器序号。
- 开发者面板可命名、记录、恢复视角，单个/全部导出 JSON，或重新导入。记录含透视距离、角度、目标/旋转中心、缩放、平移、画幅、路数及响应设置。长廊记录使用独立的 corridor 类型，避免误载正交相机。
- 使用六面纹理图集、WebGL2 深度缓冲及透视正确的 CPU 回退，保留轻度远景雾化。自由视角保持机器在裁剪面以内，CPU 在透视除法之前裁剪地板多边形。
- 默认音频 Assumptions / Sam Gellaitry，支持本地更换文件、进度、音量。允许时尝试自动播放；浏览器限制时，点击启动。音频分析在本机完成。

## 运行

Node.js 20+，无运行时外部依赖。

```sh
npm run dev
npm test
npm run build
```

开发地址 http://127.0.0.1:4173/，开发服务器支持音频 Range 请求。dist/ 可部署为静态页面。

## 来源

开凿机源自独立定版的 Piston Letter Studio v1.2.0；参考 Andy Wang 的 MIT 项目 reactor-audio-visualizer，保留作者与许可。Minecraft 纹理和音源归属详见 [CREDITS.md](CREDITS.md)。

## 三版连续切换

顶部“线性版 / 横卧版 / 长廊版”在当前标签页内切换。共用同一个 audio 元素、AudioContext、音源节点及分析器，保留进度、暂停、音量、播放速率及本地导入音源；不会重新开始音乐。浏览器前进/后退同样连续播放。每个版本的构图和响应参数在本次页面会话中保留，路数随切换带入。

完整的跨版本本地预览从 main 工作目录运行 npm run dev，三个入口及其 src/bootstrap.js、src/audio-session.js 必须一同部署。各实验分支仍保留独立几何、相机和发布快照；直接进入任一正式入口都可开始同页切换。

记录视角新增“播放器视角”（?preset=player-view），来自用户 piston-camera-view.json；保留原始透视角度、距离、平移和缩放，只切换相机，不更改当前路数或映射。
