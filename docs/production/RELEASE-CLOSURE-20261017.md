# 湿性愈合 v1.0.8 更新与推送闭环 — 2026-10-17

当前更新的源码推送、构建、发行附件和网页部署已完成核验，版本为 **v1.0.8（正式版）**。[发行页](https://github.com/AureliusWu/Healing/releases/tag/v1.0.8) · [在线游玩](https://aureliuswu.github.io/Healing/) · [机器回执](RELEASE-CLOSURE-20261017.json)。

| 环节 | 核验结果 |
| --- | --- |
| 主线 | 已审计 `main` 提交 `3fee2ee8b6d31c4bf518dc903c6d56d4daefb60c`；无开放 PR，无尚未发布的玩家程序差异 |
| 发行身份 | `v1.0.8` → `d7e6df9b697eebd982f2043785089b2463a1ab91`；公开且非草稿，prerelease 为 `false` |
| 下载 | 全部 5 份附件的字节数、SHA-256 与当前 GitHub digest 一致；4 条 checksum 记录一致 |
| 压缩包 | 1 个 ZIP 完整 CRC、路径和重复项检查通过 |
| 线上 | index.html 与离线 worker 共 2 份文件均为 HTTP 200，字节与已验证构建一致 |

全部附件均匿名重新下载并计算摘要。逐份附件 ID、大小、摘要、检验方法及压缩包条目数保存在机器回执。入口与 worker 均与本版本公开 Web/PWA ZIP 中对应文件逐字节一致。

本轮及原版本的程序验证：本轮 63 项逻辑（1,296 路线及 54 条旧章迁移）、10 项素材、9 项发布回归、构建与 69 项浏览器通过，另 3 项按设备适用性跳过；原版本 Windows 源码/ASAR 与 NSIS 1.0.2→1.0.8 同档升级已通过。证据见 [PUBLISHED-v1.0.8.json](PUBLISHED-v1.0.8.json) 和 [本轮实现/复验记录](MAINTENANCE-20261017.json)。

| 必需工作流 | 结论 | 已验证提交 |
| --- | --- | --- |
| [Build game](https://github.com/AureliusWu/Healing/actions/runs/38860005612) | success | `62b6088424cf` |
| [Publish PWA](https://github.com/AureliusWu/Healing/actions/runs/38860559654) | success | `62b6088424cf` |
| [Finalize v1.0.8 publication record](https://github.com/AureliusWu/Healing/actions/runs/38860005504) | success | `62b6088424cf` |

该回执是在表中已审计主线之后追加的文档提交；原版本 tag、发行附件及玩家程序保持原有身份。闭环范围为本轮工程更新、推送、发行和线上一致性。物理设备和真人体验按原验收范围记录；本轮未重新执行 Windows 安装。
