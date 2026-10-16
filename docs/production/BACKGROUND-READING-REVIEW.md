# Healing v1.0.8 · 后台阅读暂停

2026-10-15。基线 `7dcb160c33318edbed9a94088401a6e7d0cb2223`，承接 PR #2 的检索、已读重读与同段载入修复。

## 实际问题与修复

`visibilitychange` 原先只关闭自动/快进并暂停声音，逐字 interval 没有暂停。已在基线生产 PWA 和真实 Chromium 153 重现：速度四字/秒，读到“十七”后注入隐藏信号，再推进 60 秒，全文仍在后台出现。

页面隐藏状态现与面板、确认、标题页及隐藏界面共用暂停条件；回到前台继续原字数。interval 回调与 `step` 还直接检查 `document.hidden`，避免 React effect 清理旧计时器前继续打字。自动和快进在返回前台后保持关闭。临时可见性及字数均不进入存档。

## 可复用检查与当前证据

`tests/e2e/background-reading.spec.ts` 用 Playwright 固定时钟核对前台 500ms 显示两字、后台 60 秒保持原字数、返回后 750ms 再显示三字；还检查同段重读、手动槽不变、旧 `chapter1-v1` 存档、断网重开及旋转。UI、存档和 Service Worker 为实际生产实现；隐藏/显示信号受控注入。无头 Chromium 的两个真实标签页都报告 visible，不能把这项检查写成手机原生锁屏测试。

v1.0.7 已核实的 [Build game #38662790234](https://github.com/AureliusWu/Healing/actions/runs/38662790234) 为 web/windows 成功：63 项逻辑、61 项浏览器通过/3 项设备适用性跳过，Windows 源码、实际 ASAR 和真实 NSIS 1.0.2→1.0.7 同安装位同 profile 升级成功。该结果仅对应 v1.0.7，不能替代本候选的平台结果。

历史执行中，后台/重读/同段载入专项 16 项在 Chromium 153 全部通过，无跳过、失败或重试；包含真实文件导出、取消、同段读取与导入。`tests/e2e/reread-route.spec.ts` 还实际从完整结局回跳旧选项、改选路线、断网重开，核对新进度、手动槽、旧回忆和未来文字边界。桌面离线阅读和手机确认界面已目视检查，截图仅留本地 QA，不随交付补丁保存。

完整 72 项浏览器随后运行到手机端第 55 项通过时因会话环境重置中断，没有最终汇总，不计为完整通过。上述 16 项属于重置前的历史实际执行；原始日志未随环境保留。本次恢复后重新执行的逻辑、构建与工具检查另见 [结构化验收](BACKGROUND-VALIDATION.json)，不把历史浏览器执行冒称为当前环境重跑。

本次恢复后，后台与路线重读两个文件的桌面/手机共 8 项已在 Chromium 153、两个工作进程下重新通过，耗时 21.7 秒、无跳过。原始输出保存为 `artifacts/current-browser.log`，摘要记入结构化证据；63 项逻辑、9 项发行回归、10 项素材工具、15 份共用哈希和生产构建也已重新通过。

## 当前 PR 双端验收

PR head `852678adf789331fb9bd56ccac1e5735466bd337` 的 [Build game #38743334332](https://github.com/AureliusWu/Healing/actions/runs/38743334332) 已全部成功；实际 checkout 为 PR merge `9c410cbcd4893033e873ccdd2c1fd5d9f5141b58`。web job `116450390189` 完成 63 项逻辑、9 项发行回归、10 项工具与 15 份共用哈希；完整 72 项浏览器已得到最终汇总：69 项通过、3 项设备适用性跳过，耗时 2.4 分钟。PWA 缓存版本 `e86f9306b4d43f`。

windows job `116452059363` 的源码启动、安装/便携包生成、实际打包 ASAR 启动和真实 NSIS 1.0.2→1.0.8 升级全部通过。同安装位、同 profile 恢复 schema 1 的 `end-lin-final`，安装后与构建 ASAR 的 SHA-256 均为 `cd59c067bbf734b163b77c12f374ef433382d20fdccdbb635335f7d999675d0b`。这是本版 PR 的实际结果，早期本地中断记录保留为历史快照，不再作为本版完整 CI 的状态。

该 PR 的 release job 按条件跳过，未由其触发正式部署。PR 与正式 main 的证据分别保留，准确 job 与产物摘要见结构化证据。

## 正式 v1.0.8 发布验收

2026-10-16，运行提交 `d7e6df9b697eebd982f2043785089b2463a1ab91` 的 [Build game #38827590631](https://github.com/AureliusWu/Healing/actions/runs/38827590631) 已全部成功。正式 web job `116738556805` 通过 63 项逻辑、9 项发行回归、10 项素材工具与 15 份共用哈希；完整浏览器汇总为 69 项通过、3 项设备适用性跳过，耗时 2.2 分钟，缓存版本仍为 `e86f9306b4d43f`。

正式 windows job `116739534640` 完成源码启动、NSIS/便携包生成、实际 ASAR 启动，以及真实 1.0.2→1.0.8 同安装位同 profile 升级，恢复 `end-lin-final`。安装后与构建 ASAR 摘要均为 `cd59c067bbf734b163b77c12f374ef433382d20fdccdbb635335f7d999675d0b`；正式安装器摘要为 `b6949395368592cf973dcc3a41c23565f8ed148242684727de75e94ecaaffbf4`，与此前 PR 产物分开记录。

[Publish PWA #38828306159](https://github.com/AureliusWu/Healing/actions/runs/38828306159) 成功部署同次产物并在实际公开网址完成电脑、手机竖屏、手机横屏的真实断网续读、旧章迁移、完整 CG、最终结局与制作名单检查，三组页面异常均为零。公开入口与 worker 均匹配正式 CI 字节。

[正式 Release](https://github.com/AureliusWu/Healing/releases/tag/v1.0.8) 为非草稿、非预发布，tag 与 target 均固定于上述运行提交。五份公开资产已全部实际回读：GitHub digest、四条 SHA-256 清单、两份 EXE 与正式 Windows CI 字节、PWA ZIP 全部 32 个文件与正式 Web CI 字节均一致。公开三屏的主验收来自成功的 GitHub Actions 实测；本地独立浏览器因代理证书不能导航，没有计为通过。完整凭据见 [PUBLISHED-v1.0.8.json](PUBLISHED-v1.0.8.json)。
