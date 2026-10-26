# weilanx-claude-videos 增强包（v0.1）

> 非作者官方更新。基于原仓库的 8 个视频制作 Skills 做增量增强；保留原有源码、风格库、案例、许可证。所有变更应先在独立分支验证，再合并到 `main`。

## 增强内容

| 模块 | 新增 / 改动 | 作用 |
| --- | --- | --- |
| 环境自检 | `scripts/doctor.mjs` | Node / npm / FFmpeg / FFprobe / uv / 字体 / 音乐检查，支持 JSON 报告 |
| 跨平台目录 | `scripts/ep-dir.mjs` | Windows / macOS / Linux 均可用，查询缺失 ID 默认报错，不静默创建“未分类” |
| 跨平台导出 | `scripts/export-portable.mjs` | 移除 Bash 依赖，缺配音 / 配乐时提前失败，保留原有分轨混音及限幅参数 |
| 跨平台命令 | `scripts/remotion-cli.mjs`, `scripts/audio-all.mjs` | 直接运行 CLI 的 Node 入口及音频批处理 |
| 通用媒体 QA | `scripts/qa-media.mjs` | 检查分辨率、时长、音轨、响度、真峰值；支持严格画幅校验 |
| 9:16 初始版式 | `src/library/video-formats.ts` | 提供 1080×1920、1080×1440、1920×1080 的画布与安全区域预设 |
| 字幕时间轴 | `src/library/cues.ts` | 有词级时间戳时精确对齐；旧 SRT 没有词级数据则保留原插值法 |
| 主调度 Skill | `.claude/skills/weilanx-creator-video-master/SKILL.md` | 根据题材选择已有 8 个 Skills；不复制并维护第二套制作引擎 |
| 持续集成 | `.github/workflows/ci.yml` | PR 上自动检查跨平台脚本、TypeScript 与单元测试 |

## 环境与使用

依赖准备：安装 Node.js 24（建议）、FFmpeg / FFprobe。部分 Skills 还需要 Python/uv、自己的合法授权配乐、配音和真实素材。

```sh
npm ci
npm run doctor -- --json
npm run check:portable
npm run typecheck
npm test
```

只有需要制作视频时才创建目录，例如：

```sh
npm run ep-dir -- ep52-mechanics materials --new 03-像素贴纸风 机械科普
npm run ep-dir -- ep52-mechanics materials
npm run studio
```

在 Agent 写好 Composition、场景、字幕、音频和测试后，执行：

```sh
npm run export -- ep52-mechanics --aspect 9:16
npm run qa -- out/03-像素贴纸风/00-机械科普/ep52-mechanics.mp4 --aspect 9:16 --strict
```

上述路径仅为目录示例；每一集导出位置可用 `npm run ep-dir -- <作品ID> out` 查询。不要假定输入一个选题后这些脚本就能独立生成视频——它们是对作者原始 Skills 的基础设施增强。

## 限制与注意事项

1. **9:16 版式只是起点，并不自动把所有横屏老场景变成 9:16。** Agent 需要修改 Composition、stage、图表、角色、标题、安全区、字幕和封面布局。避免暴力裁剪 16:9。
2. **词级时间戳是可选的。** `makeCues` 接受 `words: [{text,start,end}]`，并优先使用有效词序；仅有 SRT 时仍按字符位置估计。不会自行调用 ASR。
3. **原作者的人声、配乐、B-roll 不在仓库中。** 无法保证原示例全部有声可渲；导出命令在发现必需音频缺失时会中止。
4. **自动 QA 不等于真人观看审核。** 音频可测响度和峰值，但不能判断音色好听、内容准确、画面是否好看、使用许可是否合规。
5. **新版本仍未实现**：自动批量选题、平台数据回传、所有风格统一 9:16、自适应复杂音乐网格、Blender 机械动画。它们需要另开独立 PR，逐项测试。
6. Windows 请确保 `ffmpeg` / `ffprobe` 在 PATH。原有 `.claude/skills/` 里仍有 Unix Shell 命令；执行这些 Skill 参考脚本时，可使用 Git Bash / WSL2 或另行迁移。
7. 音频批处理 `npm run audio` 会尝试生成全部期数音频。由于原作者私有素材缺失，该命令可能报缺少配乐/人声，这是预期的；做新视频建议运行相应 `node audio/episodes/<作品ID>.mjs`。

## 本地验证与后续 CI

增强包内 `scripts/portable-selftest.mjs` 通过目录测试；脚本已使用 Node 22.16 完成语法检查；`qa-media.mjs` 已通过 9:16 1080×1920、H.264/AAC 合成测试视频检查。**尚未完成**：整个仓库 npm install、Remotion 实际渲染、全部 Vitest/TypeScript 用例及 Windows 原生验证。CI 工作流合并到仓库后可提供进一步检查，不能代替实际视频验收。
