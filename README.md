# 让声谱，推动开凿。

用 Minecraft 原版开凿机展示音乐频谱。声音越强，躯干越向外伸出，两侧铁块同步反向移动；活塞底座和南瓜固定。

当前定格版本：[v1.0.0](https://github.com/XJH-Jorhai/piston-audio-reactor/releases/tag/v1.0.0)（2026-11-02）。三个版本可以在同一个标签页内切换，共用同一个播放器，音乐继续从当前位置播放。

## 在线体验

| 版本 | 展示方式 | 打开 |
| --- | --- | --- |
| 线性版 | 站立机器横向排列，正交投影 | [线性版](https://xjh-jorhai.github.io/piston-audio-reactor/?v=continuous-1) |
| 横卧版 | 机器旋转 90° 横卧，形成三列联动轨道 | [横卧版](https://xjh-jorhai.github.io/piston-audio-reactor/experiments/lying-eight/?v=continuous-1) |
| 透视长廊 | 近大远小的纵深阵列 | [长廊版](https://xjh-jorhai.github.io/piston-audio-reactor/experiments/perspective-corridor/?v=continuous-1) |
| 播放器视角 | 用户记录的长廊构图 | [64 路播放器视角](https://xjh-jorhai.github.io/piston-audio-reactor/experiments/perspective-corridor/?count=64&preset=player-view&v=continuous-1) |

顶部“线性版 / 横卧版 / 长廊版”直接切换画面。切换会保留音频进度、暂停状态、音量和本地音源，浏览器前进 / 后退同样有效。在线演示跟随 `main`；需要固定源码时，请下载 Release 中的标签归档。

**独立实验：[开凿 · 音乐播放器](https://xjh-jorhai.github.io/piston-audio-reactor/experiments/music-player/)**。以长廊播放器视角为主视觉，加入悬浮封面、模糊背景、自定义播放控制和 LRC 歌词；源码位于 [`feature/music-player`](https://github.com/XJH-Jorhai/piston-audio-reactor/tree/feature/music-player) 分支。它在单独目录预览，原有定格版本保持不变。

播放器为纯静态 Demo：“演示曲目”提供六首用户指定的 MP3 与配套同步 LRC：Assumptions、おしえてかみさま、双生コンフリクト、月 feat. ヰ世界情緒、琵琶曲、朋友的酒。“本地导入”只在浏览器处理访客的歌曲、封面与歌词，不上传或保存到后端，不接入在线音乐账号。播放器设计依据和素材来源见 [来源说明](experiments/music-player/CREDITS.md)。

## 功能与操作

- **4–64 路频谱**：可连续调节，也可快捷选择 8 / 16 / 32 / 64 路。频谱覆盖 40 Hz–16 kHz，随路数重新分配对数频段。
- **直接音频驱动**：每个频段的 RMS 频谱响度直接控制机械位置，没有周期运动或预制循环；机械行程不超过一格。
- **电平 → 行程**：低 / 高电平姿态和响应曲线都可调。姿态使用生成器进度：`0%` 为躯干全伸出，`50%` 为全收回。静音或暂停时平滑回到低电平姿态。
- **独立参数与构图**：各版本保留自己的映射和本次会话中的观察构图。映射自动保存在当前浏览器，路数随版本切换带入。
- **自由观察**：拖动旋转，Shift / 右键拖动平移，滚轮缩放；触屏支持单指旋转、双指平移和缩放。方向键旋转，Shift + 方向键平移，Home 适配。
- **视角切换**：内置记录视角只修改相机，不改变路数或响应参数。线性版保留两个用户视角，横卧版保留六个，长廊版包含“播放器视角”。
- **视角 JSON**：线性版和长廊版保留开发者面板，可记录、导入和导出视角。开发者记录载入时恢复完整构图、路数和响应参数；横卧版隐藏该面板。各版本的记录分别保存，透视与正交记录不能混用。
- **更换音频**：支持本地音频文件、播放进度和音量控制。文件在浏览器本机播放与分析，不上传服务器。

默认音源是 **Assumptions — Sam Gellaitry**。首次进入会尝试自动播放；浏览器限制自动播放时，点击“启动声场”即可。切换版本不会重新触发从头播放。

| 初始设置 | 线性版 | 横卧版 | 长廊版 |
| --- | --- | --- | --- |
| 频谱路数 | 16 | 8 | 16 |
| 低电平姿态 → 高电平姿态 | 38% → 0% | 32% → 0% | 38% → 0% |

浏览器已保存的映射会优先使用；页面提供恢复默认按钮。链接可附加 `?count=64`；长廊的 `preset=player-view` 只指定相机，不强制路数。

## 本地运行

需要 Node.js 20+。项目没有运行时外部依赖，无需安装 npm 包。

```sh
git clone https://github.com/XJH-Jorhai/piston-audio-reactor.git
cd piston-audio-reactor
npm run dev
```

打开 <http://127.0.0.1:4173/>。从仓库根目录运行，可完整体验三个版本的连续切换。

```sh
npm test        # 根目录线性版与共享逻辑测试
npm run build  # 构建完整静态站点到 dist/
```

构建后的 `dist/` 需要通过 HTTP 静态服务器提供访问。三个版本的页面、脚本和素材必须一起部署；不要单独复制某一个 HTML。WebGL2 优先渲染，提供 CPU 深度渲染回退。

## 仓库结构

```text
src/                              线性版与共享播放器、页面切换逻辑
assets/                           默认音源与 Minecraft 纹理
experiments/lying-eight/           横卧版完整页面和运行时
experiments/perspective-corridor/  长廊版完整页面和运行时
experiments/linear-legacy/         原始线性版归档
scripts/                          本地服务、静态构建与历史快照工具
tests/                            根目录自动检查
licenses/                         参考项目的原始许可
releases/                         定格版本记录
```

## 版本与分支

整站固定标签为 **`v1.0.0`**，对应已验证上线的提交 `71df7b2`。此标签不随后续开发移动。

| 路线源码 | 保留标签 |
| --- | --- |
| 线性版 | `v0.2.0-linear.5` |
| 横卧版 | `v0.3.0-lying-eight.11` |
| 长廊版 | `v0.3.0-corridor.3` |
| 原始线性基线 | `v0.1.0-linear` |

云端只保留长期分支 `main`。已完成的三个实验分支收拢到上述标签，源码历史与页面都保留；本地已有实验工作目录不删除。后续功能使用短期 `feature/*` 分支，完成后合回 `main` 并清理分支。

[定格记录](releases/v1.0.0.md)包含完整提交和验证结果；[展示路线与回退](EXPERIMENTS.md)说明历史来源、恢复方式及后续开发约定。各路线 `package.json` 继续保留其内部版本号，整站 Release 版本以 `v1.0.0` 标签为准。

## 来源与许可

- 开凿机几何基于独立定版的 [Piston Letter Studio v1.2.0](https://github.com/XJH-Jorhai/piston-letter-studio/releases/tag/v1.2.0)。
- 音频分析与交互参考 Andy Wang 的 [reactor-audio-visualizer](https://github.com/wzk112/reactor-audio-visualizer)，原始 MIT 许可保存在 `licenses/`。
- Minecraft 原版材质来自 [InventivetalentDev/minecraft-assets](https://github.com/InventivetalentDev/minecraft-assets/tree/1.21.4/assets/minecraft/textures/block) 提取镜像，归 Mojang / Microsoft 所有。
- 默认音源由用户提供，曲名 Assumptions，歌手 Sam Gellaitry。

完整固定来源、文件路径与授权说明见 [CREDITS.md](CREDITS.md)。参考项目的 MIT 许可不覆盖 Minecraft 材质和音乐。
