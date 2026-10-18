# 2026-10-18 · v1.1.0 发布回读

运行提交 `db551e14617e10db45e1982e45aec0d97f5c48d7` 已发布，公开版本和既有资产保持不可覆盖。[发行与下载](https://github.com/AureliusWu/Healing/releases/tag/v1.1.0) · [在线游玩](https://aureliuswu.github.io/Healing/)。

[Build 39104819907](https://github.com/AureliusWu/Healing/actions/runs/39104819907)、[CI 39104819907](https://github.com/AureliusWu/Healing/actions/runs/39104819907)、[Pages 39105245121](https://github.com/AureliusWu/Healing/actions/runs/39105245121) 均成功。逻辑 71 项；浏览器 75 passed, 3 device-specific skips。Windows 范围：source, win-unpacked EXE, real NSIS 1.0.2 -> 1.1.0 upgrade with same profile and prior save passed; portable built, wrapper not separately launched。

本轮在工作流之外匿名读取所有 5 份公开附件，实测字节数和 SHA-256 与服务端 digest 一致，校验表逐行相符，PWA ZIP 全项 CRC 通过。线上入口和 worker 与下载 ZIP 逐字节一致。

逐项附件摘要及线上入口/worker 摘要保存在 [发布凭据](PUBLISHED-v1.1.0.json)。实体设备体验、真人阅读审阅保持独立待办。
