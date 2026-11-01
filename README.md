# 线性开凿声场 · Piston Audio Reactor

保留原版开凿机的站立造型与 X 轴线性排列，在独立分支中同步横卧版的相机、音频映射与开发者工具。默认 16 路，支持 4–64 路逐路调节和 8/16/32/64 快捷按钮。

- 演示：https://xjh-jorhai.github.io/piston-audio-reactor/
- 分支：experiment/linear-modern；标签：v0.2.0-linear.2。
- 横卧版：https://xjh-jorhai.github.io/piston-audio-reactor/experiments/lying-eight/
- 旧线性版：https://xjh-jorhai.github.io/piston-audio-reactor/experiments/linear-legacy/
- 长廊版：https://xjh-jorhai.github.io/piston-audio-reactor/experiments/perspective-corridor/

## 相机与造型

站立机器沿 X 轴以 3.9 格间距排列，中央躯干前伸，两侧手臂同步反向。南瓜、活塞底座固定，仅活塞臂、顶板和铁块伸缩。所有六个面均参与深度绘制，正交投影保持远近机器等大。

拖动自由旋转，Shift/右键拖动或启用“平移”按钮后平移，滚轮缩放；触屏单指旋转、双指缩放和平移。提供正俯视、侧俯视、适配、单台聚焦与全屏。画布方向键旋转，Shift 加方向键平移，+/− 缩放，Home 适配。可点击频段聚焦对应机器。

## 音频与映射

默认音频 Assumptions / Sam Gellaitry，浏览器允许时尝试自动播放，否则点击启动或页面开始。支持本地音频导入、暂停、进度、音量、响应强度和动作平滑。FFT 4096，将 40 Hz–16 kHz 按路数分为对数频段；每路频谱 RMS 响度直接控制机械位置，没有周期载波。

电平→行程面板可修改低电平姿态、高电平姿态与响应曲线，默认生成器进度 32→0；0 为躯干全伸出，50 为全收回。两端物理位移之间插值，响应曲线小于 1 时突出弱信号，大于 1 时突出强信号。静音停在低电平端点。设置自动保存在当前浏览器，线性版与横卧版分别保存。

## 开发者视角记录

页面底部保留“开发者 · 视角记录”。输入名称并记录当前构图，可保存多个、载入恢复、分别或批量导出 JSON，也可导入 JSON。记录完整角度、缩放、平移、目标点、旋转枢轴、画幅、路数、选择和响应参数。相同画幅精确恢复，其他画幅等比缩放。

视角文件采用 `piston-audio-reactor.camera-views` v1，使用 `layout: linear` 区分站立阵列；每个版本分别保存记录。最多 200 条，导入前完整校验。线性版使用用户新提供的两个快捷视角“默认视角”和“开凿者”；只恢复相机，不修改当前路数或响应参数。可用 ?preset=saved-1 或 saved-2 直接打开，仍保留开发者面板记录自己的构图。

## 运行与验证

Node.js 20+，无外部运行时依赖：

    npm run dev
    npm test
    npm run build

默认 http://127.0.0.1:4173/。共享 WebGL2 图集/深度缓冲，提供逐像素 CPU 回退（?renderer=cpu）。支持 ?count=64 直达 64 路。dist/ 可部署为静态网站。

测试覆盖站立刚体几何、固定底座与完全收回、反向伸缩、4–64 路分配、自由相机裁剪和取景、端点映射/曲率、视角文件往返与画幅适配。旧版通过标签和独立预览保留。

原版纹理、MIT 参考项目和用户音源的来源见 [CREDITS.md](CREDITS.md)。

标题统一为“让声谱，推动开凿。”，标题下的造型说明已移除。频谱柱宽与间距随路数和容器宽度自适应，4–64 路均完整排列，不使用横向滚动条。
