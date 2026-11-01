# 展示路线与回退

## 基线

- 当前线性演示：https://xjh-jorhai.github.io/piston-audio-reactor/
- 原始线性演示：https://xjh-jorhai.github.io/piston-audio-reactor/experiments/linear-legacy/
- 基线标签：v0.1.0-linear
- 基线提交：f04b95726cf4b55d38580165197de485ff66e2c1
- main 当前为用户要求同步升级的线性版（v0.2.0-linear.3），默认低电平进度 38 → 高电平进度 0；原始 v0.1.0-linear 通过标签与独立预览保留。透视长廊维持独立快照。

## 实验路线

| 路线 | 分支 | 独立工作目录 | 预览 |
| --- | --- | --- | --- |
| 透视长廊（4–64 路） | experiment/perspective-corridor | ../piston-audio-reactor-corridor | https://xjh-jorhai.github.io/piston-audio-reactor/experiments/perspective-corridor/ |
| 横卧阵列（4–64 路） | experiment/lying-eight | ../piston-audio-reactor-lying-eight | https://xjh-jorhai.github.io/piston-audio-reactor/experiments/lying-eight/ |
| 线性版升级（4–64 路） | experiment/linear-modern | ../piston-audio-reactor-linear-modern | https://xjh-jorhai.github.io/piston-audio-reactor/ |
| 原始线性版 | v0.1.0-linear 标签 | — | https://xjh-jorhai.github.io/piston-audio-reactor/experiments/linear-legacy/ |

横卧路线基于 v0.2.0-corridor.1，默认侧俯视，可切换正俯视（从长边正面斜向看入）或拖动自由旋转；直接链接附加 ?view=top。采用正交投影，机器等大。默认 8 路，支持 4–64 路调节，附加 ?count=64 可打开 64 路；切换路数保留角度、自动适配并重新分配频段。映射默认低电平进度 32 → 高电平进度 0（躯干全伸出），可在页面编辑两端姿态与响应曲线并自动保存在当前浏览器。

横卧版的六个用户视角以 ?preset=saved-1 至 saved-6 切换，保持当前路数与映射独立，开发者面板隐藏。线性版沿用相同控制核心，保留站立造型和 X 轴排列，开发者记录/JSON 继续可用，保存空间按版本分开。

透视长廊 v0.3.0-corridor.1 同步 4–64 路、自由旋转/平移/缩放、响应强度和平滑、电平两端姿态与响应曲线，默认 38 → 0。保留原始近大远小长廊构图和轻度远景雾化，增加俯视预设。开发者视角库独立保存透视距离、构图和响应参数，支持 JSON 导入/导出；不能与正交视角记录混用。频谱完整适配容器，标题统一且移除序号和副标题。旧版 v0.2.0-corridor.1 标签继续保留。

线性升级先在独立分支提交并推送，再从 main 执行 `node scripts/sync-linear.mjs --source ../piston-audio-reactor-linear-modern`。脚本检查源提交、远端和工作区状态，首次同步前归档原始线性页，只复制根站点源码/测试与文档；不覆盖实验快照。linear-release.json 记录根站点来源提交。撤回根站点升级可 revert 对应发布提交。

每条路线使用独立分支、独立 worktree、独立预览路径。先在实验分支提交并验证，再更新 main 中对应的预览快照。
预览目录中的 preview.json 记录来源分支、完整提交和基线标签。

## 新开一条路线

在主目录执行，目录名和分支名按路线更换：

    git worktree add -b experiment/grid ../piston-audio-reactor-grid v0.1.0-linear
    git worktree list

进入新目录后开发、测试和提交。不要在两个目录中检出同一分支。

## 发布某一路线的预览

先在实验 worktree 中完成提交并推送：

    git push -u origin experiment/perspective-corridor

再回到 main 的工作目录：

    node scripts/publish-preview.mjs --source ../piston-audio-reactor-corridor --slug perspective-corridor
    git add experiments/perspective-corridor
    git commit -m "Update perspective corridor preview"
    git push origin main

该命令检查来源 worktree 与当前仓库是否一致、来源是否已提交；只更新 experiments/ 下指定路线的静态快照。
来源必须已推送；可用 --base-tag 指定其他基线标签，脚本会验证该标签是来源提交的祖先。例如横卧路线使用 --source ../piston-audio-reactor-lying-eight --slug lying-eight --base-tag v0.2.0-corridor.1。
不修改根页面，不合并实验分支。静态快照可独立打开，其素材与许可随快照保存。

## 比较与回退

比较实验源码：

    git diff v0.1.0-linear...experiment/perspective-corridor
    git log --oneline --all --decorate

开一个只读思路的基线工作目录供本地对照：

    git worktree add --detach ../piston-audio-reactor-baseline v0.1.0-linear

撤销实验中的某次更改，用 git revert 加新提交；撤销已发布预览，用 git revert 撤销对应的预览快照提交。
这些操作保留历史，避免重写 main 或移动基线标签。无需删除或覆盖其他路线。

线性版采用用户提供的“默认视角”和“开凿者”两种相机构图，路数与映射保持独立。两版主标题统一，频谱随通道数自适应且完整显示。
