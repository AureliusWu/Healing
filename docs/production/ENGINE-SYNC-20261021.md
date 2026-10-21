# 四项目引擎同步优化 · 2026-10-21

本轮处理场景音频的资源生命周期和 Ren’Py PWA 交付。各作品继续使用当前原生引擎与存档身份，本批代码已同步推送，四作 PWA 与各自 Windows 实际运行验证均已通过。正式下载的晋级状态单独记录。

| 项目 | 候选版本 | 实际改动 |
| --- | --- | --- |
| 雨停之前 / Rain | 1.4.1 | 完整离线下载最多两路并行；逐文件 SHA-256 和字节数验证；首个失败取消其他下载，等待任务退出后移除候选缓存；进度按完成顺序广播 |
| 湿性愈合 / Healing | 1.2.1 | 两首 / 32 MiB 场景音乐 PCM 缓存；LRU 淘汰；换场景和销毁取消未完成下载；取消后的解码结果不入缓存 |
| “网”恋 / NetLove | 0.4.1 | 与 Healing 同字节 SceneLoop，保留原作品的配乐、角色语音与播放总线 |
| 回路 / Circuit | 1.6.1 | 同一 SceneLoop 适配现有 Tauri/React 播放器；暂停、重新进入与旧回调隔离仍由本作管理 |

## 发现与实现

修改前，三个 React 作品的 Promise<AudioBuffer> 映射不断累积，离开场景仅停止播放，下载和解码继续。本轮先用实际失败的回归重现旧下载未取消、旧轨不淘汰和超额解码仍保留，再实施相同模块。缓存预算按 AudioBuffer.length × numberOfChannels × 4 计算；正在播放或淡出的音轨、正在解码的浏览器临时内存另计，因此不能将 32 MiB 描述为整个应用的内存峰值。

Rain 原逐个下载完整离线包，现在最多两个文件同时下载和校验；保留完整标记及只清理本 scope 的规则。失败会取消请求并等待所有已启动任务结束，避免迟到写入重建失败缓存。只有全量成功才写完整标记，不强制接管正在阅读的旧窗口。REUSABLE-ASSETS 中该配方的当前指纹同步更新，历史凭据不改写。

## 复用与验证入口

三个 React 仓库的 `src/game/sceneLoop.ts` 保持同字节。Healing / NetLove 的 `tests/scene-loop.test.ts`、Circuit 的 `tests/scene-loop.test.cjs` 分别使用原有测试框架；测试覆盖取消、迟到响应、重入复用、LRU、合计 PCM 上限、过大单轨、失败重试与销毁。

Rain 使用 `node --test tests/pwa-progress.test.mjs tests/pwa-downloads.test.mjs` 验证并发上限、最后才发布完整标记、并发失败等待清理、进度与哈希反例；该命令已接入原 Web 工作流。

各仓另执行自身完整逻辑/剧情/存档检查和生产构建、相关真实 Chromium 阅读/音频/PWA 检查。实际结果写入同目录 ENGINE-SYNC-20261021.json。Windows 成品、公开部署和下载回读以本候选对应的 CI 结果为准，旧版平台结果不作为本次成功证明。

本地结果：Rain 239 项 Python / 全部作者校验 / Ren’Py lint、4 项 Worker 单测和 5 项真实 Worker 交互通过；NetLove 67 项逻辑、26 项浏览器通过；Healing 79 项逻辑通过，完整相关浏览器批次 27 通过 / 1 次首次缓存等待超时，该用例同源码独立复验通过；Circuit 95 项逻辑、28 项浏览器检查通过。Healing 的完整批次以本次 CI 继续验收，不把独立复验冒充整批全通过。三个 React 生产构建和当前复用素材指纹通过。


## 最终平台回读 · 2026-10-21

| 项目 | Windows / 原生验证 | 公开 PWA |
| --- | --- | --- |
| Rain 1.4.1 | [完整源码、独立 EXE、真实旧档与新进程读档通过](https://github.com/AureliusWu/Rain/actions/runs/39528122230) | [官方 WASM、离线及公开页面通过](https://github.com/AureliusWu/Rain/actions/runs/39528122222) |
| Healing 1.2.1 | [81 项浏览器通过、3 项设备适用性跳过，Windows 源码 / ASAR / 真实旧档升级通过](https://github.com/AureliusWu/Healing/actions/runs/39528127729) | [公开三屏与离线通过](https://github.com/AureliusWu/Healing/actions/runs/39528846411) |
| NetLove 0.4.1 | [58 项浏览器、实际 Windows 成品与安装 / 便携检查通过](https://github.com/AureliusWu/NetLove/actions/runs/39528133150) | [公开版本与断网续读通过](https://github.com/AureliusWu/NetLove/actions/runs/39528854377) |
| Circuit 1.6.1 | [完整 CI 通过](https://github.com/AureliusWu/Circuit/actions/runs/39528140326)，[真实安装、运行及卸载通过](https://github.com/AureliusWu/Circuit/actions/runs/39528140324) | [公开部署与实际离线通过](https://github.com/AureliusWu/Circuit/actions/runs/39528140338) |

Rain 源码与独立 EXE 各 37 用例 / 498 断言 / 87 张截图，新进程读档 1 / 17 / 3，通过真实 v1.1.0 旧档升级。前文的本地等待超时已由 Healing 本次完整 CI 的零失败结果接续，原始失败记录仍保留。

正式下载：[Healing 1.2.1](https://github.com/AureliusWu/Healing/releases/tag/v1.2.1) 已发布；[NetLove 0.4.1](https://github.com/AureliusWu/NetLove/releases/tag/v0.4.1) 已发布为可玩预览。Rain 1.4.1 的正式 Release 尚未晋级；Circuit 1.6.1 因制作中的语音检查点推进 main，发布器按既定规则保留原公开版本。两作的新引擎均已上线 PWA，已验收的桌面包保存在对应 CI 工件中。本记录不把成功构建写成全部正式发布。
