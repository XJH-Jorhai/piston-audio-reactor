# 素材与许可

当前主线为音乐播放器，六首演示音源、配套 LRC、封面、三种样式和界面设计依据的完整说明见 [播放器来源与许可](player/CREDITS.md)。以下保留原可视化工具的来源记录，对应运行时归档在 `visualizer/`。

## 已定版的开凿机

几何关系和静止姿态基于本账号的
[Piston Letter Studio v1.2.0](https://github.com/XJH-Jorhai/piston-letter-studio/releases/tag/v1.2.0)。
固定来源提交：f4e4619eaafa825c296c61312a150a177009f5cf。
该工程保持定版，本项目在独立目录和仓库开发。

## 音频可视化参考

参考 [wzk112/reactor-audio-visualizer](https://github.com/wzk112/reactor-audio-visualizer)
的音频分析与控制台交互思路。作者：Andy Wang。
固定参考提交：b5822479812bbde4a3ee9bbea09bd6d5fa84280e。
该项目采用 MIT 许可，完整原始许可保留在
[licenses/reactor-audio-visualizer.MIT.txt](licenses/reactor-audio-visualizer.MIT.txt)。

本试验重新实现 4–64 台可调站立开凿机线性阵列、共享深度缓冲渲染、对应路数的对数频谱分配和双向行程映射。
频谱响度直接决定活塞位置，静音时回低电平端点；不使用周期载波，也不模拟游戏红石更新。

## Minecraft 原版材质

Minecraft Java Edition 1.21.4 原版 16×16 纹理，归 Mojang / Microsoft 所有。
来源为 [InventivetalentDev/minecraft-assets](https://github.com/InventivetalentDev/minecraft-assets/tree/1.21.4/assets/minecraft/textures/block)
的客户端材质提取镜像，固定提交 58d92c8cee4c7ac22d02988fb2bc3e4648af9ef2。
文件及详细路径见 [assets/minecraft/README.md](assets/minecraft/README.md)。
这些纹理不以参考项目的 MIT 许可重新授权；本项目不是 Mojang 或 Microsoft 的官方产品。

## 音源

默认音源由用户提供，文件名为 Sam Gellaitry - Assumptions.mp3。
页面标注曲名 Assumptions 与歌手 Sam Gellaitry。
导入的其他音频通过浏览器本地文件对象播放和分析，不上传到服务器。
