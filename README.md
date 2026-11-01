# 开凿 · Listening Room

独立音乐播放器实验，分支 **feature/music-player**，以整站定格标签 [v1.0.0](https://github.com/XJH-Jorhai/piston-audio-reactor/releases/tag/v1.0.0) 为起点。原有三个可视化版本和固定标签继续保留。

[音乐播放器预览](https://xjh-jorhai.github.io/piston-audio-reactor/experiments/music-player/) · [定格版](https://xjh-jorhai.github.io/piston-audio-reactor/)

封面模糊、加暗后铺满背景，右侧显示清晰的悬浮封面。左侧沿用长廊“播放器视角”，真实频谱驱动 64 台开凿机，去掉底部频谱条和生成器控制台，保留完整的播放与声场设置。

## 使用

- 自定义播放/暂停、进度、前后 10 秒、音量、静音、单曲循环和全屏；Space 播放/暂停，左右方向键前后 5 秒。
- 导入本地音频时读取 ID3 歌名、作者、专辑和内嵌封面，也可单独更换封面。
- 支持 LRC 同步滚动歌词、点击跳转及普通文本歌词。默认 Assumptions 音源未附歌词，可导入自己的 LRC 文件。
- 设置面板保留 4–64 路、响应强度、平滑、行程端点和响应曲线，默认 38% → 0%。
- 默认封面直接从用户提供 MP3 的 APIC 标签提取，CSS 负责模糊和暗化，原图未改动。
- 音频、封面和歌词文件均在本地处理，不上传到服务器。

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

## 网易云接入规划

优先研究网易云官方接入，用户凭证不持久化；授权尚未上线。官方目前对个人应用仅提供 CLI，公开 Web API 需先确认厂商接入权限。授权流程、独立后端边界与验收要求见 [网易云接入与授权凭证处理](docs/netease-integration.md)。不要向聊天或仓库提交私钥、密码和账号 Cookie。
