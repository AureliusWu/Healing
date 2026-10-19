# 四作本轮发布与共存验收 · 2026-10-19

本轮工程候选均已公开。网恋保留可玩预览（prerelease）身份；其余三作为正式版。每作沿用自己的引擎、人物、素材和存档命名空间。

| 作品 | 当前下载 | 本轮已完成 |
| --- | --- | --- |
| 回路 | [v1.5.2 正式版](https://github.com/AureliusWu/Circuit/releases/tag/v1.5.2) | 标题页从真实章节目录生成摘要，补列《取号》；城市线路档案补 V04；Windows 安装、保存重开、退出及卸载与公开三屏检查通过 |
| 网恋 | [v0.3.1 可玩预览](https://github.com/AureliusWu/NetLove/releases/tag/v0.3.1) | 已读章节、人物与关键词交叉检索；8 句本作离线录音与两张事件 CG 已交付；Windows 成品/安装升级/便携与公开 PWA 通过 |
| 湿性愈合 | [v1.1.1 正式版](https://github.com/AureliusWu/Healing/releases/tag/v1.1.1) | 已读章节筛选、完整阅读备份与临时重读；Windows 成品、旧档安装升级与公开 PWA 通过 |
| 雨停之前 | [v1.3.1 正式版](https://github.com/AureliusWu/Rain/releases/tag/v1.3.1) | 收藏交叉检索与数量反馈；源码/独立 EXE 各 37 用例、494 断言、86 截图，真实旧档升级和官方 WASM 通过；同次原包已发布 |

## 同一浏览器中的四作共存

[检查运行 39202908465](https://github.com/AureliusWu/Circuit/actions/runs/39202908465) 使用 Chromium 156.0.8078.4 的全新独立环境。依次完成四站的 Worker 注册和离线缓存，逐次核对已有缓存及三个 React 游戏通过真实界面产生的自动存档，再让同一环境断网并逐作重开。四站各自的 scope/controller、先前缓存和进度均保留，四次断网启动通过，页面错误为零。

| 作品 | 本次运行版本 | 缓存条目 |
| --- | --- | --- |
| Circuit | 1.5.2 | 96 |
| NetLove | 0.3.1 | 31 |
| Healing | 1.1.1 | 30 |
| Rain | 1.3.1 | 29 |
| 合计 | 四个独立 scope | 186 |

原始报告为 [FOUR-GAMES-COEXISTENCE-20261019.json](FOUR-GAMES-COEXISTENCE-20261019.json)，SHA-256 为 `dd756b10dca8ed2e26c220cd2135ef595cfb63f1f2c959b0a08eafeaa5716356`。原始工件 12164740814 的 ZIP SHA-256 为 `9a23aeeecaa0899d61844c347ad66bf746bc148b7685b672685a75f31585f087`，含报告和八张在线/离线截图，取回后的摘要与 CRC 已核对。已直接查看四作断网画面。

可复用入口：[tests/four-games-live.py](https://github.com/AureliusWu/Circuit/blob/0a95488507b0a8d5aee4be2f05592607fbdca907/tests/four-games-live.py) 与 [four-games-live.yml](https://github.com/AureliusWu/Circuit/blob/0a95488507b0a8d5aee4be2f05592607fbdca907/.github/workflows/four-games-live.yml)。测试只忽略存档顶层的保存时间，仍比较路线、历史、归档证明与其余载荷；Rain 的原生存档迁移由该仓完整 Windows/WASM 流程单独验证。

首次检查 39202628918 因测试器把字符串条件交给 eval，被 NetLove 既有 CSP 拒绝。改为函数条件后，本次完整检查通过；玩家 CSP 保持。测试器错误保留为历史记录，不冒充游戏故障或成功结果。

## 精确平台来源

- Circuit：运行提交 `0a95488507b0a8d5aee4be2f05592607fbdca907`；[CI 39202759195](https://github.com/AureliusWu/Circuit/actions/runs/39202759195)、[构建/发行 39202759203](https://github.com/AureliusWu/Circuit/actions/runs/39202759203)、[公开 PWA 39202759209](https://github.com/AureliusWu/Circuit/actions/runs/39202759209)。
- NetLove：运行提交 `a1ce670301e4c52b0e4bc253a4e1f787e81a6ddc`；[Windows/Web 39197244622](https://github.com/AureliusWu/NetLove/actions/runs/39197244622)、[公开 PWA 39197831595](https://github.com/AureliusWu/NetLove/actions/runs/39197831595)。
- Healing：运行提交 `e90273f0b19eabca496a7c01ac9614fa3eebbc18`；[Windows/Web 39197402297](https://github.com/AureliusWu/Healing/actions/runs/39197402297)、[公开 PWA 39197902979](https://github.com/AureliusWu/Healing/actions/runs/39197902979)。
- Rain：运行/tag `f1b521db0c7c954a9245411b58438f344b5717f7`；[Windows 39197411208](https://github.com/AureliusWu/Rain/actions/runs/39197411208)、[WASM/PWA 39197411207](https://github.com/AureliusWu/Rain/actions/runs/39197411207)、[原包发行 39202170966](https://github.com/AureliusWu/Rain/actions/runs/39202170966)。

各仓自己的 PUBLISHED 记录保存公开资产和来源。此次仅归档结果与校正文档，不重建或覆盖已公开的玩家包。缓存共存与浏览器断网通过不代表物理设备安装、真人试听、阅读计时或创作定案；这些继续按实际体验记录。
