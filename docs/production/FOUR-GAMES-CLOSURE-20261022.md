# 四作全量素材与发布闭环 · 2026-10-22

四作的全量人物对白、计划内新增立绘 / 背景 / CG 均已接入 Windows 和 PWA，原有角色设定、剧情身份、存档与离线边界保持。网恋继续为可玩预览，其余三作为正式版。

| 作品 | 当前下载 | 人物对白绑定 | 本批新增运行图 | 平台结果 |
| --- | --- | --- | --- | --- |
| 雨停之前 | [v1.5.0 正式版](https://github.com/AureliusWu/Rain/releases/tag/v1.5.0) | 306 | 12 | 原生 Windows / 官方 WASM / 公开离线 / 原包发行通过 |
| 湿性愈合 | [v1.3.0 正式版](https://github.com/AureliusWu/Healing/releases/tag/v1.3.0) | 427 | 16 | Electron 源码 / ASAR / 实际安装升级 / 公开离线通过 |
| 网恋 | [v0.5.0 可玩预览](https://github.com/AureliusWu/NetLove/releases/tag/v0.5.0) | 220 | 4 | Electron 源码 / 成品 / 实际安装升级 / portable / 公开离线通过 |
| 回路 | [v1.7.0 正式版](https://github.com/AureliusWu/Circuit/releases/tag/v1.7.0) | 403 | 14 | Windows 实际安装 / 保存重开 / 卸载 / 十章浏览器路线与完整声音离线通过 |
| 合计 | 四个独立作品 | 1,356 | 46 | 各作平台凭据分别保留 |

对白数字是台词绑定数；同一作品内的历史录音回放可复用原文件。新增运行图包含表情图集和逐张表情，原有素材继续沿用。旁白与纯系统提示保留文字。远程说话人与第一人称人物的原有表现规则保持，不把图鉴立绘强行放进正文现场。

## 当前剧本与素材复核

从四仓当前唯一剧情源重新导出配音计划，全部语义摘要、人物 / 台词 / 分支身份与留档计划一致。Circuit 保留一条明确的时间读法规范化 `00:03` → `零点零三分`，其他录音请求字段一致。

全部已验收录音的原始文件、请求指纹、独立识别凭据、运行绑定与 SHA-256 再次核对；1,356 条绑定及 46 张新图完整解码通过。Rain 的 246 项 Python 与作者校验、Healing 的 82 项逻辑、NetLove 的 67 项逻辑、Circuit 的 97 项逻辑和后三作生产构建通过。原始结果见 [全量素材审计](FULL-MEDIA-AUDIT-20261022.json)。生产输入中较早的 pending 字段保留为当时快照，当前交付状态以本页和各作 PUBLISHED 记录为准。

## 四作同源共存与断网

[运行 39604977040，第 6 次尝试](https://github.com/AureliusWu/Circuit/actions/runs/39604977040/attempts/6) 使用全新独立 Chromium 156.0.8078.4，依次完成四作安装缓存与实际阅读保存，再共同断网并逐作重开。四站 scope / controller、已有缓存与 React 作品的自动存档载荷保持，四次离线重开通过，页面错误为零。Rain 的原生存读档另由同提交 Windows / WASM 门槛验证。

| 本次运行版本 | 完整缓存条目 |
| --- | --- |
| Circuit 1.7.0 | 479 |
| NetLove 0.5.0 | 257 |
| Healing 1.3.0 | 475 |
| Rain 1.5.0 | 37 |
| 合计 | 1,248 |

[原始报告](FOUR-GAMES-COEXISTENCE-20261022.json) SHA-256：`faa3bec3309264b6c297cc81a2f7c76930d3c4240eb09b8f183f32040bc7008a`。工件 12400996628 的 ZIP SHA-256：`beccdc559726a088ba34bb574bbb6f24de704890f842dd1012a069d825a780b1`；报告、八张实际在线 / 离线截图和 ZIP CRC 已取回核对，四作离线画面已查看。

第 5 次尝试曾在 Circuit 首次启动的等待阶段 120 秒超时；第 6 次使用相同脚本与版本重跑成功。未定位该次超时的确定原因，失败记录保留；未缩减资源、延长时限或放宽缓存 / 存档断言。

## 精确平台与公开下载

- Rain：运行 / tag `e4856b5a5f44803e1c1b263534702f5d7d8c80dc`；[Windows 39715827353](https://github.com/AureliusWu/Rain/actions/runs/39715827353)、[WASM / PWA 39715827275](https://github.com/AureliusWu/Rain/actions/runs/39715827275)、[发行 39721240542](https://github.com/AureliusWu/Rain/actions/runs/39721240542)。源码与独立 EXE 各 38 用例 / 509 断言 / 89 张截图，真实旧档升级与新进程恢复通过；188 张原始截图和 388 项包内资产审计通过。四个公开附件、三条校验和、两个 ZIP CRC 与当前线上 Worker 原字节已再次回读。[凭据](https://github.com/AureliusWu/Rain/blob/main/docs/production/PUBLISHED-v1.5.0-full-media.json)。
- Healing：[Windows / Web 39595336935](https://github.com/AureliusWu/Healing/actions/runs/39595336935)、[公开 PWA 39596506346](https://github.com/AureliusWu/Healing/actions/runs/39596506346)；81 项浏览器通过，另 3 项按设备适用范围跳过，五份公开下载与四条校验和已独立回读。[凭据](https://github.com/AureliusWu/Healing/blob/main/docs/production/PUBLISHED-v1.3.0-full-media.json)。
- NetLove：[Windows / Web 39596383055](https://github.com/AureliusWu/NetLove/actions/runs/39596383055)、[公开 PWA 39597413596](https://github.com/AureliusWu/NetLove/actions/runs/39597413596)；58 项浏览器通过，四份公开下载与三条校验和已独立回读。[凭据](https://github.com/AureliusWu/NetLove/blob/main/docs/production/PUBLISHED-v0.5.0-full-media.json)。
- Circuit：[完整 CI 39604218721](https://github.com/AureliusWu/Circuit/actions/runs/39604218721)、[Windows / 发行 39604219022](https://github.com/AureliusWu/Circuit/actions/runs/39604219022)、[公开 PWA 39604218950](https://github.com/AureliusWu/Circuit/actions/runs/39604218950)；七份公开下载、四条校验和和线上入口 / Worker 已独立回读。[凭据](https://github.com/AureliusWu/Circuit/blob/main/docs/production/PUBLISHED-v1.7.0-full-media.json)。

本次仓库收尾只更新说明与证据，不重新构建或替换已公开的玩家包。真人试听、阅读计时、普通电脑 / 中文路径 / DPI、物理设备和最终创作选择继续按实际体验登记。部分恢复 CG 缺少原生成请求，来源缺口如实保留。Rain 发行页正文的后续编辑被自动审批额度限制拦截；仓库中的 RELEASE_NOTES_V150.md 已更新为实际结果，版本、附件与校验结论不受影响。
