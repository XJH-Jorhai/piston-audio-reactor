# 素材与许可

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

固定演示音源均由用户提供，按用户要求随静态 Demo 发布。曲名、艺术家及专辑信息读取自各 MP3 的 ID3 标签；多人艺术家之间的分隔符仅调整显示空格，音频文件本身未修改。

| 曲目 | 艺术家 | 专辑 | 提供的文件名 |
| --- | --- | --- | --- |
| Assumptions | Sam Gellaitry | IV | Sam Gellaitry - Assumptions.mp3 |
| おしえてかみさま | 理芽 | NEW ROMANCER2 | 理芽 - おしえてかみさま.mp3 |
| 双生コンフリクト | LOLUET / ヰ世界情緒 | 双生コンフリクト | LOLUET; ヰ世界情緒 - 双生コンフリクト.mp3 |
| 月 feat. ヰ世界情緒 | Guiano / ヰ世界情緒 | 花鳥風月 | Guiano; ヰ世界情緒 - 月.mp3 |
| 琵琶曲 | 秋秋 | 琵琶曲 | 秋秋 - 琵琶曲(DJ).mp3 |
| 朋友的酒 | 李晓杰 / 玉萨 | 有情有义 | 李晓杰,玉萨 - 朋友的酒.mp3 |

《琵琶曲》使用用户指定的 `(DJ)` 文件，页面曲名沿用该文件内嵌的“琵琶曲”标签。

音乐及封面归各原权利人所有，不以本项目或参考工程的 MIT 许可重新授权。用户自行导入的其他音频通过浏览器本地文件对象播放和分析，不上传到服务器，也不会加入上述公共演示目录。

## 播放器封面

六首演示曲目的封面均直接提取自对应 MP3 的 ID3 APIC 标签，保持原始图片字节，未重新绘制，也未另外从网络下载。背景模糊与加暗通过 CSS 完成，不修改原封面文件。

这六首 MP3 均未内嵌歌词。演示同步歌词来自用户另行提供的六份 LRC，分别对应上述曲目，存放在 `assets/lyrics/`，由播放器按当前曲目自动载入。文件来源为用户本机的 `CloudMusic` / `CloudMusic/VipSongsDownload` 目录，未另行联网抓取。仅统一静态文件名和 UTF-8 文本编码，保留所提供的歌词内容与时间标记；歌词归各原权利人所有，不以本项目 MIT 许可重新授权。

用户仍可手动导入自己的 LRC / 文本歌词，或读取本地音频内嵌 USLT；这些本地导入的内容不上传到服务器。

## 播放器界面与设计依据

播放器的构图依据为用户在本项目对话中提供的长廊“播放器视角”截图及标注：左侧显示开凿机长廊，右侧安排清晰封面、歌曲信息、歌词与进度控制，并去掉底部频谱条。全屏模糊封面叠暗背景、清晰封面的悬浮效果也来自用户明确提出的设计要求。

页面排版、配色、字级、封面倾斜与阴影、弹窗和播放控制使用项目内编写的 HTML/CSS/JavaScript 实现，没有引入第三方播放器 UI 模板或组件库。播放器样式没有另行选用某个外部网站作为临摹来源。

上文署名的 `reactor-audio-visualizer` 是此前音频分析和控制台交互思路的参考；长廊几何、相机与渲染器沿用本项目定格版本。页面图标为项目内联 SVG，字体使用系统字体栈，不从外部字体服务载入。后续如采用新的外部设计或代码参考，会在这里追加链接、作者及具体使用范围。
