# 展示路线与回退

## 当前主线

`main` 现维护音乐播放器；`feature/music-player` 已合入主线。后续从 `main` 建立短期分支，不再从独立 worktree 复制播放器预览。

首页进入 `player/`，`?style=corridor|linear|lying` 只切换画面，共用歌曲、播放状态、歌词和频谱参数。渲染器包含在播放器内，不依赖归档目录。

## 固定版本

| 标签 | 内容 | 在线目录 |
| --- | --- | --- |
| v1.2.0 | 播放器主线，三种可选样式 | `player/` |
| v1.1.0 | 六曲长廊播放器，加入其他样式前定格 | `experiments/music-player/` |
| v0.1.0-player.3 | 原播放器实验分支的完整六曲源码 | Git 标签归档 |
| v1.0.0 | 原三版可视化工具 | `visualizer/` |
| v0.2.0-linear.5 | 线性升级版实验源码 | Git 标签归档 |
| v0.3.0-lying-eight.11 | 横卧实验源码 | Git 标签归档 |
| v0.3.0-corridor.3 | 长廊实验源码 | Git 标签归档 |
| v0.1.0-linear | 原始线性基线 | `experiments/linear-legacy/` |

固定标签不移动。原 `v1.0.0` 提交为 `71df7b29394f1299d1678d2c4ea224f6dc525cf3`；六曲播放器源码为 `0480d0fdfecd2a62e316f06432a75012bd546011`。发布记录位于 `releases/`。

`visualizer/` 保留原工具的完整运行时，内部线性 / 横卧 / 长廊仍可同页切换，共用音频。旧顶层横卧、长廊入口转到该归档。历史 `src/` 与实验源文件保留作来源与回归检查，不是当前播放器入口。

## 恢复

```sh
git fetch origin --tags
git worktree add --detach ../piston-frozen v1.1.0
# 六曲长廊页面：../piston-frozen/experiments/music-player/
```

原工具用 `v1.0.0` 恢复，原播放器实验源码用 `v0.1.0-player.3` 恢复。固定版本通过 HTTP 静态服务访问。

## 开发约定

- 维护 `player/`，验证后将短期分支合回 `main`。
- 不修改 `experiments/music-player/`、`visualizer/` 的定格运行时。
- 保留本地实验 worktree、历史分支和标签；已合并的云端短期分支可清理。
- `scripts/publish-player.mjs` 已停用，防止误覆盖六曲定格目录；其他旧预览脚本仅保留历史用途。
- 素材和外部代码 / 设计参考同步记录在 `player/CREDITS.md`。
