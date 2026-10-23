# 四游戏统筹升级与发行闭环 · 2026-10-23

已完成冻结计划内的四作并行升级、Windows 与公开 PWA 验收、正式发行、公开下载回读及四作共同断网复验。以下版本均为公开稳定版本，保留不可覆盖的原标签与原包。

| 作品 | 版本 | 运行 / 标签提交 | 入口 |
| --- | --- | --- | --- |
| 雨停之前 | 1.6.0 | `b820f868e4fe` | [在线](https://aureliuswu.github.io/Rain/) · [下载](https://github.com/AureliusWu/Rain/releases/tag/v1.6.0) |
| 湿性愈合 | 1.4.0 | `62f84f738565` | [在线](https://aureliuswu.github.io/Healing/) · [下载](https://github.com/AureliusWu/Healing/releases/tag/v1.4.0) |
| “网”恋 | 1.0.0 | `6e53a29d653b` | [在线](https://aureliuswu.github.io/NetLove/) · [下载](https://github.com/AureliusWu/NetLove/releases/tag/v1.0.0) |
| 回路 | 1.8.0 | `4860750b5bc7` | [在线](https://aureliuswu.github.io/Circuit/) · [下载](https://github.com/AureliusWu/Circuit/releases/tag/v1.8.0) |

## 本轮交付

四作均提供标题与阅读中的玩家帮助，说明操作、存档与备份、回看重听、离线与更新；打开帮助暂停阅读，关闭后保留原处。Healing 修正备份说明并补齐中文字体；NetLove 从五章预览晋级正式 1.0。四仓发行器均在草稿中回读完整附件后才公开，旧版和标签保持不可变。

原剧情、人物、台词身份、1,356 条人物对白录音及存档契约保持。Circuit 第一部六章完结、第二部四章仍在连载，本轮没有宣称全系列完结。

## 各平台实际证据

| 作品 | 本轮检查 | 原生与线上 |
| --- | --- | --- |
| Rain | 252 Python、14 Node；源码与独立 EXE 各 39 用例 / 521 断言 / 91 截图 | 新进程读档、真实 v1.1.0 旧档升级；18 项官方 WASM 检查与公开原生存读档 / 断网通过 |
| Healing | 82 逻辑、16 发行、10 素材；85 浏览器通过 / 3 设备适用性跳过 | Windows 源码、ASAR、真实 v1.0.2 → 1.4.0 同 profile 升级；公开三屏断网、旧章续读、CG、最终结局与制作名单通过 |
| NetLove | 67 逻辑、18 发行、10 素材；66 浏览器通过，288 路线 | Windows 源码、ASAR、真实 v0.5.0 → 1.0.0 同 profile 升级和 portable 外壳；公开三屏断网续读通过 |
| Circuit | 105 逻辑、107 浏览器阶段；十章与全部录音缓存检查 | 实际 NSIS 安装、窗口交互、帮助、保存关闭重开、WebView 清理及卸载；公开三屏断网和音频解码通过 |

Healing 的运行源码与公开原包仍固定于 `62f84f73856504f7432e35d970cd35cd8bc5cc21`。支持提交 `910a30597df858ed930f098ce574f6de16b896bd` 仅调整 CI 安装预算并增加只读验收；[39975049079](https://github.com/AureliusWu/Healing/actions/runs/39975049079) 固定原标签与 ZIP 摘要，执行原完整三屏检查并通过。

四仓 `PUBLISHED-v<版本>.json` 固定运行、构建、公开 PWA 和发行编号。此前 PWA 下载失败和系统依赖下载耗尽任务时限的尝试保留为历史；只有实际成功的最终验收计入本次门槛，未放宽原测试断言，也未替换公开包。

## 公开下载与四作共存

20 个公开附件、共 803,323,655 字节，均已匿名完整下载；大小、实际 SHA-256、公开校验表和五份 ZIP 的 CRC 通过。各站入口与 Worker 八份文件匹配各自部署产物。Circuit 通用 Web ZIP 使用根路径，Pages 使用 `/Circuit/` 构建，公开字节与对应 Pages 工件比较，避免跨构建路径误比。

[同源共存 CI 39972929371](https://github.com/AureliusWu/Circuit/actions/runs/39972929371) 在 Chromium 156.0.8078.4 通过；独立 Chromium 153.0.8010.0 也通过。两次实际缓存清单摘要一致：`8c74b4357b594b499a0f4a1c8a551743bb9eeb1c90030d45080a2e44e93cc44e`。Circuit 479、NetLove 257、Healing 475、Rain 37，共 1,248 条缓存。依次安装不删除其他作品缓存、不改变已有存档；统一断网后四作重开成功，React 实际自动进度与 Rain 原生菜单保持，各自 scope / controller 正确，页面错误为零。Rain 的原生 Save / Load 另有本版 WASM 与公开 PWA 证据。

原始机器结果见 [CI 报告](FOUR-GAMES-LIVE-CI-20261023.json)、[CI 来源](FOUR-GAMES-LIVE-CI-20261023-PROVENANCE.json)、[独立报告](FOUR-GAMES-LIVE-20261023.json) 与 [独立来源](FOUR-GAMES-LIVE-20261023-PROVENANCE.json)。每仓的 PUBLIC-READBACK 文件保存本作全部资产 ID、公开 URL 与实际摘要。

## 保留的人工体验项

真人全量试听、有效阅读计时、普通 Windows / 中文路径 / DPI、实体手机主屏安装与最终美术、演出和创作定案继续按用户既定安排集中待验。机器通过不代替这些体验。历史恢复素材缺少原生成请求的情况如实保留。

本次收尾追加文档、实际预览、验证凭据及仅作用于 CI 的依赖安装预算 / 只读验收配置，已发布的客户端、剧情、素材与标签保持冻结。
