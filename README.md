# 湿性愈合

<!-- project-badges:start -->
[![Version](https://img.shields.io/github/v/tag/AureliusWu/Healing?sort=semver&style=flat-square&label=version)](https://github.com/AureliusWu/Healing/tags) [![Build](https://github.com/AureliusWu/Healing/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/AureliusWu/Healing/actions/workflows/build.yml) [![Last commit](https://img.shields.io/github/last-commit/AureliusWu/Healing?style=flat-square)](https://github.com/AureliusWu/Healing/commits/main) [![License](https://img.shields.io/github/license/AureliusWu/Healing?style=flat-square)](LICENSE)
<!-- project-badges:end -->

当前正式版：`1.5.4`。Windows 与 PWA 共用剧情和存档格式。

> 有些话，长大后才学会说。有些人，在雨停之前就已靠近。

青春期校园题材原创视觉小说。你扮演江城七中高二学生程屿，在成绩、家庭期待、文学社与几段没有说完的话之间，走过《生长痛》《显影》《雨停以后》三章。

[在线游玩 / 安装 PWA](https://aureliuswu.github.io/Healing/) · [v1.5.4 Release](https://github.com/AureliusWu/Healing/releases/tag/v1.5.4)

## 当前内容

- 三章完整剧情、65 个场景、7 次选择与 4 个最终结局。
- 十二位角色图鉴；主要角色包含多表情立绘、场景与事件 CG。
- 427 条人物对白离线语音，支持重听、自动阅读与独立音量。
- 自动存档、3 个手动槽、已读回看、结局回忆与 JSON 备份迁移。
- 横屏优先的 PWA 与 Windows 客户端；资源完整缓存后支持离线游玩。

## 开发与验证

```bash
npm ci
npm run dev
npm run build
npm run preview
```

Windows：

```bash
npm run desktop
npm run desktop:win
```

## AI / 维护者入口

修改前先读 [AGENTS.md](AGENTS.md)。

- 剧情：`docs/STORY.md`。
- 制作与布局：`docs/PRODUCTION.md`、`docs/production/FULLSCREEN-READING.md`。
- 架构与验证：`docs/ARCHITECTURE.md`、`docs/VALIDATION.md`。
- 跨仓制作：`docs/production/VN-WORKFLOW-R1.md`、`docs/production/SHARED-VN.md`。
- 当前发行与真实证据：GitHub Release 与 `docs/production/`。

保持剧情 ID、存档兼容、素材来源与双端行为；未实际执行的真人阅读、实体设备或听感审阅不能写成已通过。历史发布、截图矩阵、工作流 run 和逐轮验收不要重新堆进 README。

## License

许可与素材来源见 [LICENSE](LICENSE) 及仓库中的素材/来源文档。