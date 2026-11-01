# 展示路线与回退

## 当前状态

2026-11-02 将用户确认的在线功能固定为整站 `v1.0.0`。标签对应提交 `71df7b29394f1299d1678d2c4ea224f6dc525cf3`；之后的 README 和分支整理提交只更新文档，不改变该定格快照。

云端长期分支仅保留 `main`。三个已完成实验分支的最新源码由标签保留，线上三个页面依然共存。本地实验 worktree 和本地分支保留，不删除文件或历史。

## 历史来源

| 路线 | 原实验分支（已收拢） | 固定标签 | 完整源码提交 | main 中的页面 |
| --- | --- | --- | --- | --- |
| 线性升级版 | experiment/linear-modern | v0.2.0-linear.5 | 6a01016383799b60baedbe0e937453f216d711d4 | 根目录 |
| 横卧阵列 | experiment/lying-eight | v0.3.0-lying-eight.11 | ec9bcf0150c651996d3b2037f1a131a0088e58ee | experiments/lying-eight/ |
| 透视长廊 | experiment/perspective-corridor | v0.3.0-corridor.3 | 29a83aea6c5c471f796048e007db358f8464044e | experiments/perspective-corridor/ |
| 原始线性版 | 原始基线 | v0.1.0-linear | f04b95726cf4b55d38580165197de485ff66e2c1 | experiments/linear-legacy/ |

`linear-release.json` 和两个预览目录内的 `preview.json` 是发布时的来源记录，其中的分支字段代表历史来源，不代表云端仍保留该分支。原始长廊 `v0.2.0-corridor.1` 及其余历史标签也继续保留。

## 恢复固定版本

```sh
git fetch origin --tags
# 在新目录查看完整定格版，不改动当前 main：
git worktree add --detach ../piston-audio-reactor-v1.0.0 v1.0.0
```

查看某一路线的原始源码，可将最后一个参数换成对应标签。例如 `v0.3.0-corridor.3` 是长廊源码分支的完整快照；`v1.0.0` 则包含可一起部署的三个入口。

历史标签不移动、不覆盖。GitHub Release 自动提供固定标签的源码归档。

## 后续开发

以当前 `main` 或固定标签为起点建立新的短期分支，不重新保留三套长期云端实验分支：

```sh
git fetch origin
git worktree add -b feature/player ../piston-player origin/main
# 若要严格从定格功能起步，将 origin/main 换成 v1.0.0。
```

主工作树中的线性根目录、横卧目录和长廊目录已包含全部运行时。改动共享播放器、切换入口或公共控件时，三个版本一并检查。合并功能后删除已完成的短期分支；需要保留的阶段结果使用标签记录。

原有 `scripts/sync-linear.mjs` 与 `scripts/publish-preview.mjs` 保留为历史工作流工具，会校验对应实验源分支是否已提交并推送。云端实验分支收拢后，不直接沿用旧推送命令；若专门恢复该工作流，需先显式恢复并推送对应源分支。普通后续开发以 main 内已有目录为准。

## 三版行为

- 三个入口使用同页切换，保留同一个 audio 元素、AudioContext、音源节点和分析器；音频位置、暂停与本地音源不重置。
- 每次卸载停止旧视图的动画循环与 ResizeObserver，并用 AbortController 清理事件。
- 路数支持 4–64，切换版本带入当前路数；各版本映射分别保存在浏览器。
- 线性版两个用户视角、横卧版六个用户视角、长廊“播放器视角”均为相机快捷方式，不改变路数和响应参数。
- 线性、长廊保留开发者视角 JSON；横卧版隐藏开发者面板。载入完整开发者记录会恢复该记录的路数和响应设置。
- 原始线性版归档单独保留，不接入新的连续切换会话。
