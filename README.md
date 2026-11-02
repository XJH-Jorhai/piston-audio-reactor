# 开凿 · Listening Room

独立音乐播放器实验，分支 **feature/music-player**，以整站定格标签 [v1.0.0](https://github.com/XJH-Jorhai/piston-audio-reactor/releases/tag/v1.0.0) 为起点。原有三个可视化版本和固定标签继续保留。

[音乐播放器预览](https://xjh-jorhai.github.io/piston-audio-reactor/experiments/music-player/) · [定格版](https://xjh-jorhai.github.io/piston-audio-reactor/)

封面模糊、加暗后铺满背景，右侧显示清晰的悬浮封面。左侧沿用长廊“播放器视角”，真实频谱驱动 64 台开凿机，去掉底部频谱条和生成器控制台，保留完整的播放与声场设置。

## 使用

- 自定义播放/暂停、进度、前后 10 秒、音量、静音、单曲循环和全屏；Space 播放/暂停，左右方向键前后 5 秒。
- 导入本地音频时读取 ID3 歌名、作者、专辑和内嵌封面，也可单独更换封面。
- 支持 LRC 同步滚动歌词、点击跳转及普通文本歌词。六首演示曲目自动载入用户提供的 LRC，也可手动导入自己的歌词文件。
- 设置面板保留 4–64 路、响应强度、平滑、行程端点和响应曲线，默认 38% → 0%。
- 默认封面直接从用户提供 MP3 的 APIC 标签提取，CSS 负责模糊和暗化，原图未改动。
- 音频、封面和歌词文件均在本地处理，不上传到服务器。
- “演示曲目”提供六首用户指定的固定 MP3：Assumptions、おしえてかみさま、双生コンフリクト、月 feat. ヰ世界情緒、琵琶曲、朋友的酒；“本地导入”读取访客自己的文件，不加入公共曲库，刷新后需重新选择。

## 本地运行

需要 Node.js 20+，无运行时外部依赖。

```sh
npm run dev
# 打开 http://127.0.0.1:4173/player/
npm run test:player
npm run build
```

`player/` 是可整体部署的独立页面，构建结果位于 `dist/player/`。根目录和 `experiments/` 仍保留定格版本；新页面的预览位于独立目录 `experiments/music-player/`。

详细说明见 [player/README.md](player/README.md)，素材与权属见 [player/CREDITS.md](player/CREDITS.md)。

## 固定曲目与本地导入

采用纯静态 Demo，不接入网易云等在线音乐账号，无登录、上传接口或后端歌曲存储。固定演示资源随仓库和 GitHub Pages 公开发布；访客本地文件通过浏览器 Blob URL 播放，不写入浏览器持久存储，也不发送到服务器。仅声场及音量等数值偏好保存在此浏览器。

添加固定曲目：把提供的 MP3、封面和 UTF-8 LRC 放入 `player/assets/audio/`、`player/assets/artwork/`、`player/assets/lyrics/`，在 `player/tracks.js` 增加 id、标题、艺术家、专辑以及音频、封面、`lyricsUrl` 路径，并在 `player/CREDITS.md` 补充来源。不要把访客导入的文件复制进这些目录。

此前的 [网易云接入调研](docs/netease-integration.md) 已搁置，不是当前产品的实施计划。
