# 验证记录

当前全量素材版本为 **v1.3.0**。82 项逻辑、81 项浏览器（另 3 项设备适用性跳过）、实际 Windows 包与旧档升级、公开三屏离线及五项公开下载回读全部通过。运行提交 `c7298ad385fa026983e7ea3f6b745d444c139217`。详见 [本版发布凭据](production/PUBLISHED-v1.3.0-full-media.json)。真人听感与最终美术定案待实际体验。

v1.3.0 的 427 条录音完整解码与素材校验已通过；平台、公开下载和独立再次下载分别保留在 [发布凭据](production/PUBLISHED-v1.3.0-full-media.json) 与 [2026-10-22 回读](production/PUBLIC-READBACK-20261022.json)。见 [本轮制作记录](production/ITERATIONS.md)。

历史验证基线：**v1.0.8**，运行提交 `d7e6df9b697eebd982f2043785089b2463a1ab91`。Windows 与公开 PWA 均已更新；正式双端、真实安装升级、公开三屏和五项下载回读见 [PUBLISHED-v1.0.8.json](production/PUBLISHED-v1.0.8.json)。

## v1.0.8 正式发布与公开结果

- [Build game #38827590631](https://github.com/AureliusWu/Healing/actions/runs/38827590631) 的 Web、Windows、Release 全部 success。正式 web job `116738556805` 完成 63 项逻辑（1,296 条完整路线、54 份旧章迁移）、9 项发行回归、10 项素材工具和 15 份共用哈希。完整 72 项浏览器最终得到 69 项通过、3 项设备适用性跳过，耗时 2.2 分钟。PWA 为 30 项预缓存资源，缓存版本 `e86f9306b4d43f`。
- 正式 windows job `116739534640` 的源码、NSIS/便携包构建、实际 ASAR 启动均成功。一次性 Windows runner 实际安装公开 v1.0.2，再同安装位升级至 v1.0.8；EXE 产品版本分别为 1.0.2/1.0.8，同 profile 实际旧存档恢复 `end-lin-final`，随后安装后完整 smoke 通过。安装后与构建 ASAR 的 SHA-256 均为 `cd59c067bbf734b163b77c12f374ef433382d20fdccdbb635335f7d999675d0b`。正式安装器与之前 PR 的摘要分别记录；便携 EXE 核验了构建和公开字节，没有独立执行便携包装器。
- [Publish PWA #38828306159](https://github.com/AureliusWu/Healing/actions/runs/38828306159) 已部署上述正式产物。公开网址电脑、手机竖屏、手机横屏三组 `LIVE_SMOKE_OK` 均为 1.0.8，选择、存档续读、真实断网刷新、旧章迁移、完整 CG、最终结局、制作名单均通过，页面异常为零。公开 `index.html` SHA-256 为 `fdb5b6872b78a59fd2ff8cdb0782fcf5bff287d77eba9dd9602f1b4e01b3e75d`，`sw.js` 为 `5008e5beb67c7e7f09f7e7996eef51242307a7d8c3247128bf5a47d438aae35b`，均与正式 CI 附件实际字节一致。本地独立 HTTP 比对也成功；本地浏览器导航被代理证书拦截，没有计为独立三屏通过。
- [正式 v1.0.8](https://github.com/AureliusWu/Healing/releases/tag/v1.0.8) 为非草稿、非预发布；tag 与 target 均精确绑定上述运行提交。五项公开资产已全部实际下载并核对 GitHub digest，四行 `SHA256SUMS.txt` 全部一致。安装 EXE 为 122,225,347 字节、SHA-256 `b6949395368592cf973dcc3a41c23565f8ed148242684727de75e94ecaaffbf4`；便携 EXE 为 121,991,104 字节、SHA-256 `30d30ece5b3dfab105f72df63ab6066cf2fad26e3a69d50412d22382213d540c`，二者均与正式 Windows 附件实际字节一致。PWA ZIP 为 10,372,979 字节、SHA-256 `2a1383282fbdc0a5dca18a6dfea539aa1052fdab6dfdddf8b1508c050af02ca7`，全部 32 个文件的集合与字节均匹配正式 PWA 附件。公开 `release.json` 的运行提交、schema 1 与两种兼容剧情标识也已核对。

PR head `852678ad` 的 [Build game #38743334332](https://github.com/AureliusWu/Healing/actions/runs/38743334332) 为先前候选验证；完整 PR 与正式 main 分别保存在 [后台阅读验收](production/BACKGROUND-READING-REVIEW.md) 和 [结构化证据](production/BACKGROUND-VALIDATION.json)，未将 PR 产物冒称为正式下载。后台信号为真实 Chromium 中受控注入，不代表物理手机锁屏认证；截图保持为 CI 或本地 QA 产物。

## v1.0.7 基线候选平台核验

已回读 [Build game #38662790234](https://github.com/AureliusWu/Healing/actions/runs/38662790234)：web/windows 成功，63 项逻辑、61 项浏览器通过/3 项设备适用性跳过，Windows 源码/实际 ASAR 和真实 NSIS 1.0.2→1.0.7 同安装位同 profile 旧存档恢复成功。准确提交及摘要见 [v1.0.7 平台证据](production/PLATFORM-v1.0.7.json)。该证据不能替代 v1.0.8 的平台执行。

## v1.0.3 正式发布与公网结果

- [Build game 38110162164](https://github.com/AureliusWu/Healing/actions/runs/38110162164)：Web、Windows、Release 全部 success。九项发布回归、五项素材工具回归、44 项逻辑用例通过；浏览器 49 项通过，三项因设备类型不适用跳过。CI 使用固定 Playwright，PWA 共 29 项预缓存资源，CI 缓存版本 `38bbf7fa2ee8e0`。本机 Windows 构建的缓存版本不同，来源是 checkout 换行差异；公网哈希比较使用同次 CI 附件，未替换成本机 dist。
- Windows 源码与实际打包程序均完成 `DESKTOP_SMOKE_OK`。一次性 Windows runner 真实安装已公开的 v1.0.2，再在同路径升级 v1.0.3，读取 EXE 产品版本分别为 1.0.2 / 1.0.3；复用旧版实际存档 profile，`DESKTOP_UPGRADE_OK` 恢复 schema 1 的 `end-lin-final`，`sameProfile:true`。随后完整桌面 smoke 通过，安装后的 ASAR 与 CI 已测试 ASAR 同为 `a4191c172cc3b313ba3091fce09af1d6df656df8e8af52263252f5ba618ebe52`。实际安装证据产物为 `Healing-Windows-Runtime-Evidence`（11690962918）。本机没有运行安装器。
- [Publish PWA 38110500780](https://github.com/AureliusWu/Healing/actions/runs/38110500780)：部署和实际公开网址三个视口全部 success。Pages 唯一附件、部署前最新 main SHA 二次检查已在本次流程执行。实际版本为 1.0.3，桌面、手机竖屏、手机横屏的选择、保存续读、真实断网刷新、旧章续读、完整 CG、最终结局与制作人员均通过，页面异常为零。
- 独立公网复验在 `https://aureliuswu.github.io/Healing/` 执行，采用同次 `MoistHealing-PWA` 附件 11690464903 的实际字节，系统 Chrome 154.0.8037.98，1440×900、412×915、844×390。三组 `LIVE_SMOKE_OK` 全部成功，真实断网由浏览器网络离线设置执行；隐藏恢复和旋转保持第 1 段。续章、CG 和结局检查显式使用原生迁移夹具，并通过真实控件继续，不把夹具定位冒称为完整路线阅读。三屏整体执行 79.63 秒，无证书绕过；竖屏阅读与横屏 CG 实际截图已目视复核。
- 公网入口 `index.html` SHA-256 为 `2b87e2dfe0686044f85f113abedc99537527c364c1546c638ada045778760bee`，`sw.js` 为 `b6ff9af1059404dbb6773304901d96262cc7d32a77c864a26c5c381f6efed89c`；两份 HTTP 200 响应与已验收 CI 附件一致。独立执行原始输出、三屏截图和下载回读保存在忽略目录 `tmp/public-ci-38110162164-848792b-review-2/`，永久精简元数据见 [PUBLISHED-v1.0.3.json](production/PUBLISHED-v1.0.3.json)。
- [正式 v1.0.3](https://github.com/AureliusWu/Healing/releases/tag/v1.0.3) 为非草稿、非预发布，标签与目标提交均精确指向上述客户端。五份公开资产全部实际下载并核验服务端 digest，四行 `SHA256SUMS.txt` 全部一致。安装版 122,012,380 字节，SHA-256 `cdc0987e96a7d5f9b213b0b85639b6eb387a0baeeb5d39a942ed3273515f101a`；便携版 121,778,109 字节，SHA-256 `52686bd39797014120836ef65069316407cda337a6a82562d70daa1116eee76c`，均与 CI Windows 附件 11690713084 的实际 EXE 一致。PWA ZIP 10,159,107 字节，SHA-256 `3e41f676671d0f9075653e3c609d4f93c3deabbbba70131d45d19b9b0eb5ac63`，全部 31 个文件的集合及字节与 CI PWA 附件一致。下载的 `release.json` 再次确认提交、schema 1 和两种兼容 storyVersion。
- 原始剧情、美术、依赖版本和存档身份保持不变；共用素材 gate 已导出独立复用包。物理手机主屏安装、真人阅读与试听、普通硬件体验继续独立验收，Windows 下载未代码签名；素材目录中缺失原图与完整字体源的记录保留。线上历史预览继续标注其 v1.0.1 来源。

## v1.0.3 本地双端检查

- 九项发布回归、44 项剧情/存档/PWA 生命周期与缓存逻辑检查通过。六个测试文件保持 1,296 条完整路线、54 条旧章迁移等原验证；未修改角色、美术、剧本、引擎和存档格式。一次同时打包和跑浏览器时路线回放超出默认五秒，独立重跑全部 44 项在 5.42 秒内通过，未放宽测试超时。
- TypeScript 和生产构建通过：29 项离线资源，确定性路径/字节缓存版本 `36c58e91a9688a`。脚本改名、文件边界、原子失败、同 scope 清理、异 origin / scope 与非 GET、缓存导航均有检查；全局 ready 已不参与本游戏就绪判断。
- 系统 Chrome `154.0.8037.98`、两个工作进程、桌面 1440×900 和手机 412×915 的完整浏览器集成：49 项通过，另三项明确因设备类型不适用跳过。四种短横屏 568×320、640×360、844×390、915×412 全窗口画面和控件边界、真实离线重开、四个最终 CG、旧章续读、音频、隐藏暂停与恢复、阅读层透明度持久化均通过。
- 新增真实 worker 检查：父目录 worker 已 ready 时，本游戏资源失败仍显示下载待重试；同源 `/school/` 与 `/copy/` 的两份完整缓存互不删除，两份页面均在浏览器真实断网后重开成功。实际下载的新 worker 等原窗口关闭后激活，旧阅读段落在新缓存内恢复。安装事件测试只验证浏览器安装接口调用和状态处理，不代表系统安装对话框已人工完成。
- 本地并行项目曾共用预览端口 4173，测试快照实际打开了 NetLove；该轮已停止且不计入结果。Healing 现使用独立端口 4185、strictPort 和禁止复用已有预览服务，最终整套结果来自本项目实际产物。专用 worker observer 返回成功空页，避免新版 Chrome 对 404 页面导航直接失败。
- Windows 11 `10.0.26200`、锁定 Electron `44.5.1`、electron-builder `26.15.3`：真实源码窗口与最终 `release/win-unpacked/湿性愈合.exe` 均输出 `DESKTOP_SMOKE_OK`；全屏进入/退出、全窗口画面、透明度入口、存档、剧情、隐藏恢复、渲染器隔离、旧章续读、包内 CG、结局、制作名单和回忆全部 true。原生全屏会让 `show:false` 的窗口自动显示，测试现禁止抢焦点和任务栏、静音，在全屏退出后显式隐藏，结束时实际 `hiddenWindow:true`；全屏转换仍可能瞬时可见，不能宣称完全 headless。测试专用后台计时保持开启，正常玩家后台暂停逻辑不变。包内 `electron/main.cjs` 与当前源文件逐字节一致。
- 最终 NSIS 安装版 122,012,357 字节、便携版 121,778,112 字节，本地打包成功。源码和 ASAR 程序再次使用同一个隔离测试 profile，均输出 `DESKTOP_UPGRADE_OK`，实际恢复 schema 1 的 `end-lin-final` 结局及同一选择序列；这是重开恢复证据，尚不能替代旧版安装器升级。
- 真实 NSIS 安装/升级门禁仅允许一次性 Healing Windows Actions runner 执行：下载公开 v1.0.2 的安装包，核对官方 SHA-256、大小与服务端 digest，先实际安装并启动旧版，再同路径安装新版、读 Windows EXE 产品版本、复用旧版实际存档 profile 并重放结局，最后比较安装后的 ASAR 与本次构建摘要。本机拒绝执行该安装步骤，未改变用户注册表、快捷方式或实际应用数据；随后取得的真实 CI 结果见上方正式发布记录。
- 共享契约 v1.1.0 的九份文件与素材 gate 五项回归通过；Healing 索引 24 条目、48 文件，包含六项可复用素材/制作配方、18 项项目专用美术。缺失的 18 条原始美术和完整字体源共 19 条明确标记；字体子集携 OFL 许可，PWA 适配代码携 MIT。CI 会实际导出 `.reuse-kit/v1.1.0` 并上传独立材料产物。
- 版本 1.0.3、锁文件、十一份日志索引检查与 diff 空白检查通过。本地检查阶段未升级依赖，也未推送或修改已公开版本标签；后续仅在门禁通过后发布本次新版本。

## v1.0.3 本地性能对照

同机器、Chrome 154、1440×900、本地 no-store 服务、文字速度零；各三份新浏览器 context 冷启动，再由相同 context 的真实 worker 进行热启动。真实交互为开始阅读并到第 1 段，记录中位数和最慢样本；原始数据位于 `test-results/performance/baseline.json`、`current.json` 与 `current-final.json`。小样本仅判断明显回归，不宣称稳定提速。

| 指标 | v1.0.2 基线 | v1.0.3 最终 | 门禁 / 结论 |
| --- | --- | --- | --- |
| JS 原始字节 / gzip | 360,676 / 120,966 | 360,814 / 120,988 | +0.04% / +0.02%，通过 |
| CSS 原始字节 / gzip | 38,914 / 8,802 | 38,914 / 8,802 | 相同，通过 |
| 冷启动中位数 / 最慢 | 328.70 / 358.78 ms | 198.46 / 258.85 ms | 无 >20% 回归、均 <3 秒 |
| 热启动中位数 / 最慢 | 136.94 / 195.24 ms | 77.02 / 113.33 ms | 无 >20% 回归、均 <3 秒 |
| 冷交互中位数 / 最慢 | 231.40 / 645.22 ms | 130.34 / 582.65 ms | 无 >20% 回归、均 <3 秒 |
| 热交互中位数 / 最慢 | 137.48 / 154.19 ms | 98.42 / 119.83 ms | 无 >20% 回归、均 <3 秒 |
| 冷启动资源传输 / 热传输 | 2,137,795 / 0 B | 2,137,933 / 0 B | 差值仅 JS 增量，通过 |
| 最长主线程长任务 | 122 ms | 86 ms | 未出现 >200 ms 新长任务 |

并行检查期间的初轮热交互中位数为 158.11 ms，比基线增加 15%，触发小样本告警；结束打包与整套浏览器检查后以相同设置补测三次，未复现该回归。三个快照均保留，页面异常均为零。素材、CSS 与字体字节不变，运行时未新增外部请求或依赖。

## v1.0.2 发布链核查

2026-10-11 只读核对公开 Release：v1.0.2 已于 `2026-10-08T15:30:33Z` 发布。Build game [37800543785](https://github.com/AureliusWu/Healing/actions/runs/37800543785) 成功；Publish PWA [37801369207](https://github.com/AureliusWu/Healing/actions/runs/37801369207) 的实际部署日志报 `Multiple artifacts named "github-pages" ... Artifact count is 2`，因此不能将 Windows 公开下载等同于 PWA 同步成功。本次上传与部署改为同一个带 `run_id` / `run_attempt` 的唯一产物名，后续 v1.0.3 的真实部署已成功验证修复。

当前仓库及 Pages 地址已更名为 [Healing](https://github.com/AureliusWu/Healing) / [在线游戏](https://aureliuswu.github.io/Healing/)，历史 Project1 的验证链接和已归档截图保留原始来源。v1.0.3 的公网三屏幕离线、真实 Windows 安装器升级结果已单列于上方；物理手机安装继续保留人工验收边界。

## v1.0.2 本地检查

- 同步用户新增的三项目制作契约，31 项原生剧情、存档与共用结构检查通过，九项发布回归通过。`REUSE-MANIFEST.json` 的三份共享文件 SHA-256 全部一致。
- 安装面板的下载中、联网就绪和断网状态改为三章完整故事。实际资源依然通过完整原子缓存进入设备；现有浏览器重试/离线用例增加真实面板文案断言。
- TypeScript 和生产构建通过，29 项离线资源，本地缓存版本 `bd85469580f126`；版本与十份日志索引通过。
- v1.0.0 和 v1.0.1 的各 23 张预览全部固定于版本目录；每张 JPEG 的尺寸与 SHA-256 均匹配来源记录。归档脚本实际拒绝将其他运行提交写入已经固定的版本。
- 正式浏览器、Windows 源码与实际 ASAR 包、线上三屏幕离线复验等待本次 CI 结果。

## v1.0.1 本地检查

- 实际下载 v1.0.0 的附加元数据和校验清单：JSON 能解析，四条校验行使用真实换行；下载元数据的剧情标识仍为 chapter1-v1，与完整游戏的 moist-healing-v1 不符。发布标题也被脚本固定为“生长痛”。
- 修订发布脚本，从已经实际重放的 CG / 最终结局夹具读取当前剧情标识和存档容器版本，并列出旧章标识兼容性；标题来自本版本日志，构建 ID、标题和夹具不一致会阻止发布。
- 九项独立发布回归通过，运行的是真实发布脚本：JSON 解析、逐行 SHA-256、标题与五项上传；已公开版本无写入；外来草稿与标签拒绝；同提交草稿重试；错误上传摘要不公开；不一致夹具、日志标题或缺失构建 ID 在网络请求前失败。
- 30 项逻辑与存档检查通过，新增检查将发布所用夹具与当前引擎契约、真实 CG 和最终结局重放关联。原有 1,296 条路线与 54 条旧章迁移检查继续通过。
- TypeScript 与生产构建通过；PWA 缓存 29 个资源，本地缓存版本 bb466f6d7ca1dc。版本与九份日志索引检查通过。
- 正式 Web、Windows 源码与实际 ASAR 包、线上三屏幕离线复验全部成功，结果见下方。

## v1.0.1 发布结果

运行代码与版本标签：`99ff191db6c3f2e567ab74ea1346d502acba5eb6`。

- [Build game #37711889809](https://github.com/AureliusWu/Project1/actions/runs/37711889809)：Web、Windows、Release 全部 success。九项发布回归、30 项逻辑、43 项浏览器检查通过，另 3 项设备类型不适用跳过。Web 包缓存 29 项资源，版本 `bb466f6d7ca1dc`。
- Windows 源码与实际 ASAR 程序各自输出 `DESKTOP_SMOKE_OK`，剧情、存档、全屏、隐藏恢复、渲染器隔离、旧章续读、包内 CG、最终结局、制作人员与回忆均为 true。
- [Publish PWA #37712335944](https://github.com/AureliusWu/Project1/actions/runs/37712335944)：部署与电脑/手机竖屏/手机横屏复验全部 success。`LIVE_SMOKE_OK` 版本 1.0.1，三屏幕断网重开、旧章续章、CG、最终结局与制作名单成功，页面异常均为 0。当前公开 PWA 缓存哈希与正式 Web 构建一致。
- [正式下载](https://github.com/AureliusWu/Project1/releases/tag/v1.0.1) 五项资源已公开：安装 EXE 122,011,676 字节，便携 EXE 121,777,435 字节，PWA ZIP 10,159,072 字节；附 `release.json` 和 `SHA256SUMS.txt`。直接下载的 JSON 正确记录 `moist-healing-v1`、schema 1 及两种兼容剧情标识，四条校验值与服务端摘要一致。
- [实机预览](previews/v1.0.1/README.md) 归档 23 张实际 JPEG，来自正式构建截图产物 `11521729792` 与线上产物 `11523125317`，保留原尺寸与原 PNG、ZIP、JPEG 摘要。
- 用户后续同步的 `4a79d30` 为制作契约、结构适配和字体生产脚本改进；本地 31 项逻辑与九项发布回归通过，生产包缓存哈希仍为 `bb466f6d7ca1dc`，与实际已发布客户端相同。

## v1.0.0 本地检查

- 29 项逻辑与存档检查通过。65 个场景唯一且全部可达，1,296 条完整路线结束于四个最终结局；全部路线可导出/恢复为相同段落、选择、分数和历史。
- v0.1.6 第一章的 23 个场景全部玩家可见台词、选择、下一场景和三个结局逐项一致；54 条旧式 `chapter1-v1` 结局存档保留位置并明确续章，无法伪造后续章节目标。
- 一条完整路线的 520 个阅读位置逐段恢复；章节结束不自动越过，章首重读保留实际选择，未到达的章节不能仅凭标签解锁。
- 八张新增图片均为 1672×941，正式 WebP 经脚本验收。提示词、参考角色、尺寸与 SHA-256 保存在 `production/complete-art/`。现有三视图和十八格表情未改动。
- 中文字体重新生成，208,088 字节，源码 CJK 字形覆盖完整；生产构建包含 29 个离线资源。
- 本地原有浏览器检查及新增续章/锁定检查共 39 项通过，另 3 项设备类型不适用跳过。完整版专项电脑与手机 10 项通过：四个最终结局、四张 CG 断网加载、重读、真实检查点、六首配乐的实际有界音频输出、单一上下文、试听结束恢复设置。
- 实际截图发现竖屏结局信息被按钮挤窄，已调整为上下排列；新增按钮完整边界与标题高度断言，修订后电脑/手机两项复验通过，568×320、844×390、412×915 的续章和返回按钮完整可见，标题不再被挤成窄列。
- Windows 源码、实际 ASAR 包和线上三屏幕离线复验全部通过，证据见下方正式发布结果。

## v1.0.0 发布结果

运行代码与不可覆盖的版本标签：`aa9b6444106f5a56a53f4ac281c5f6ddb620db4e`。

- [Build game #37614961604](https://github.com/AureliusWu/Project1/actions/runs/37614961604)：Web、Windows、Release 全部 success。29 项逻辑与 43 项浏览器检查通过，另 3 项设备类型不适用跳过；浏览器用例耗时 1.7 分钟。PWA 缓存 29 个资源，版本 `7c8ee2d04d8019`。
- Windows 源码与实际 ASAR 程序两次输出 `DESKTOP_SMOKE_OK`：原剧情、自动存档、全屏、隐藏/恢复、渲染器隔离，以及旧章续读、实际包内 CG、最终结局、制作人员与回忆均为 true。
- [Publish PWA #37615575960](https://github.com/AureliusWu/Project1/actions/runs/37615575960)：部署与公开网址复验 success。电脑、手机竖屏、手机横屏均输出版本 1.0.0 的 `LIVE_SMOKE_OK`；断网、存档、旧章续读、结局 CG、最终结局与制作人员均成功，页面异常为 0。
- [v1.0.0 下载](https://github.com/AureliusWu/Project1/releases/tag/v1.0.0) 已公开：安装 EXE 122,011,660 字节、便携 EXE 121,777,414 字节、PWA ZIP 10,159,075 字节，另附 `release.json` 与 `SHA256SUMS.txt`。五项上传状态、大小与服务端 SHA-256 均已核对，版本标签固定指向上述代码提交。
- [完整 CG 实机产物](https://github.com/AureliusWu/Project1/actions/runs/37614961604/artifacts/11479623722) 保留四幅 CG 的电脑和手机实际 PNG；[线上最终截图](https://github.com/AureliusWu/Project1/actions/runs/37615575960/artifacts/11478794360) 包含三屏幕的标题、阅读、选择、隐藏界面与断网结局 CG。正式八张新增美术及全部提示词已保存在仓库 `public/art/` 与 `docs/production/complete-art/`。
- 收尾时从两份正式产物恢复并归档 23 张 JPEG：四幅 CG 的电脑/手机预览 8 张、线上三屏幕 CG 3 张、标题/阅读/选择/隐藏界面 12 张。保留原尺寸，文件与原 PNG 的 SHA-256、来源 ZIP 摘要、构建与产物 ID 固定在 `docs/previews/v1.0.0/provenance.json`；原 PNG 仍在上述产物中。`scripts/archive-previews.py` 已实际运行并完成格式、尺寸和重复文件验收。当前 `docs/previews/` 的十二张界面同步为 v1.0.0。

发布后的文档提交保存实际验证证据；已公开客户端和版本标签固定于上述运行提交。

## v0.1.6 检查范围

- 本地 20 项剧情、存档与表现逻辑检查通过；54 条路线均终止、三种结局可达，旧式存档能恢复争执中的表情和 v0.1.5 插入场景的十六个位置。
- 与正式 v0.1.4 逐场景比较，22 个原有场景的全部玩家可见台词与选择逐字一致；表情注解不进入玩家文本。v0.1.5 的追加片段另行修订，未改变原选择。
- 三组三视图为 1536×1024；三个透明表情图集为 1254×1254，共十八格。编码后的 alpha 与原图逐像素一致；真实主体范围与采样框已入库，避免依赖生成器未严格遵守的等分网格。
- 中文字体已重新生成，源码中文字形覆盖完整。生产构建通过，PWA 包含 21 个离线资源；旧许棠 SVG 已移除。
- 本地六项与本次改动直接相关的浏览器检查通过：电脑 / 手机的画集六种表情、三视图断网浏览、争执表情读档恢复，以及四种短横屏边界与 PWA 全资产断网重开。一次遗漏的知遥表情注解在实机测试发现后补齐，两个恢复检查重新通过。
- 三位角色在 1440×900、844×390、412×915 均完成实际预览，页面错误为 0；角色画集与三视图另存于 `docs/previews/v0.1.6/`。验收脚本为 `scripts/character-preview.mjs`。
- 首次完整云端 Web 检查通过：20 项逻辑、33 项浏览器用例，另 3 项因设备类型不适用而跳过。Windows 首次启动检查仍断言旧版“十八岁”首句，已同步为恢复后的“十七岁”；随后重新执行完整双端流程并通过，结果见下方发布证据。
- 完整 CI 浏览器检查、Windows 源码与实际 ASAR 包启动、线上 PWA 与离线重开全部通过，证据见下方发布结果。

## v0.1.6 发布结果

运行代码提交：`c16120834b902c0fbf4058aa26c2f8181d778ae4`。

- [Build game #37572000848](https://github.com/AureliusWu/Project1/actions/runs/37572000848)：Web、Windows、Release 全部 success；20 项逻辑、33 项浏览器用例通过，另 3 项因设备类型不适用而跳过。Web 生产包包含 21 个离线资源，缓存版本 `286bdeb308e0ee`。
- Windows 源码与实际 ASAR 打包程序均输出 `DESKTOP_SMOKE_OK`，验证剧情启动、自动存档、系统全屏、画面与阅读区域、隐藏界面及恢复不推进、渲染器隔离；恢复后的十七岁开场通过实际启动检查。
- [Publish PWA #37572389175](https://github.com/AureliusWu/Project1/actions/runs/37572389175)：部署与实际网址复验全部 success。电脑、手机竖屏、手机横屏均输出 `LIVE_SMOKE_OK`，版本 0.1.6，横屏清单、美术、存档、方向切换、隐藏界面与断网重开均成功，页面异常数为 0。Pages 实际配置为 `build_type: workflow`。
- [v0.1.6 下载](https://github.com/AureliusWu/Project1/releases/tag/v0.1.6) 已公开：安装 EXE 118,832,278 字节、便携 EXE 118,598,005 字节、PWA ZIP 6,974,672 字节，另附构建记录 JSON 与 SHA-256 校验文件。五项上传状态、大小与服务端提供的摘要已由发布脚本校验，版本标签固定指向上述代码提交。
- [线上最终截图](https://github.com/AureliusWu/Project1/actions/runs/37572389175/artifacts/11460997282) 包含三种屏幕规格的标题、阅读、选择与隐藏界面。该次线上原图已转换为仓库 `docs/previews/` 的十二张 JPEG；三位角色与三视图的十三张专项预览另存于 `docs/previews/v0.1.6/`。

发布后仅补充验证记录、制作经验与预览，不改变已公开客户端。

## v0.1.3 检查范围

- 保持 16 项剧情与存档校验，第一章与 `chapter1-v1` 继续兼容。
- 本地 16 项逻辑与 28 项浏览器用例全部通过（特殊浏览器按项目和文件分组，每项独立进程）。浏览器用例增至 28 项。短横屏检查明确验证顶部信息、场景、完整立绘、阅读区和选项边界；选项现在位于阅读区内部。新增隐藏界面暂停自动/快进、选择处恢复不代选、轻触/快捷键恢复不推进、重载续读检查。
- 四张美术全部重新绘制为二维风格。两张背景为 1672×941，两张真实透明立绘为 1024×1536；格式脚本验证透明角、主体边距与 WebP 编码后的 alpha 一致。最终资源参数与 SHA-256 见 `docs/production/ART-ASSETS.json`。
- 中文字体重新生成固定 400 字重，当前源码 CJK 字形覆盖完整。PWA 构建枚举 15 个资源，全部随包缓存。
- 本地生产包的电脑、手机横屏、手机竖屏均完成实际游玩、选择、方向切换、断网重开、画面分区与隐藏界面检查，页面异常数为 0。预览同时保存标题、阅读、选择与隐藏界面；在实机背景上确认透明边缘正常。
- Windows 源码及实际 ASAR 包启动检查新增画面与控件分区、隐藏界面与恢复不推进验证。双端与线上检查已实际通过，证据见下方发布结果。
- 可复用内容固定在根目录 `AGENTS.md`、`docs/PRODUCTION.md`、迭代记录、提示词与两个制作脚本中。

## v0.1.3 发布结果

运行代码提交：`02b0975a2be970fdd9dd432f8372a9fe69eb0e57`。

- [Build game #37553843794](https://github.com/AureliusWu/Project1/actions/runs/37553843794)：Web、Windows、Release 全部 success；16 项逻辑、28 项浏览器测试全部通过，CI 浏览器用例耗时 59.6 秒。Web 生产包包含 15 个离线资源，缓存版本 `6fc79b99ffbc16`。
- Windows 源码客户端与实际 ASAR 打包客户端均输出 `DESKTOP_SMOKE_OK`，实际验证剧情、自动存档、全屏、`stageSeparated: true`、`pictureMode: true` 与渲染器隔离。恢复界面后的段落保持不变。
- [Publish PWA #37554181424](https://github.com/AureliusWu/Project1/actions/runs/37554181424)：部署和实际网址复验全部 success。电脑、手机竖屏、手机横屏均输出 `LIVE_SMOKE_OK`，版本 0.1.3，横屏清单、美术、画面分区、隐藏界面、存档与断网重开全部成功，页面异常数为 0。
- Pages 实际配置为 `build_type: workflow`，继续通过 GitHub Actions 发布。
- [v0.1.3 下载](https://github.com/AureliusWu/Project1/releases/tag/v0.1.3) 已公开，包含安装 EXE、便携 EXE、PWA ZIP、构建证据 JSON、SHA-256 校验文件。已核对五项资源的上传结果与摘要，Release 与版本标签都固定指向上述代码提交。
- [线上最终截图](https://github.com/AureliusWu/Project1/actions/runs/37554181424/artifacts/11454286573) 包含三种屏幕规格的标题、阅读、选择与隐藏界面。当时的 12 张实机预览保留在该版本代码提交的 `docs/previews/`；当前目录随最新版本更新。

发布后仅补充验证结果与迭代记录，不改变已发布客户端。

## v0.1.2 检查范围

- 16 项剧情与存档校验；原存档继续兼容。
- 浏览器集成检查增至 26 项。新增触屏横竖屏切换、竖屏提示关闭、实际全屏与系统退出、方向锁拒绝、全屏权限拒绝/接口缺失后的继续阅读。方向锁的成功与拒绝通过浏览器接口桩模拟；全屏进入和退出使用真实浏览器接口。
- 横屏布局检查扩展到 568×320、640×360、844×390、915×412，要求标题动作在一屏内，并检查剧情选项在页眉下方、正文上方。
- 生产网站复验扩展为桌面、手机竖屏、手机横屏；检查实际清单的横屏偏好，以及切换方向和离线重开后的进度。
- Windows 源码版与打包后的 ASAR 版启动验证新增真实全屏按钮进入/退出检查。全屏权限仅放行本地游戏主文档；其余权限拒绝。
- 本地 16 项逻辑与 26 项浏览器用例通过。高并发运行中有 7 项因本地测试进程争用而超时，降低并发后这 7 项全部通过；最终 CI 仍使用常规 Chromium 的两个工作进程复验。

## v0.1.2 发布结果

运行代码提交：`ddbfb907914415b849562bf2649be9e318dc7fef`。

- [Build game #37495595686](https://github.com/AureliusWu/Project1/actions/runs/37495595686)：Web、Windows、Release 全部 success。16 项逻辑测试和 26 项浏览器交互测试全部通过，CI 浏览器用例耗时 59.6 秒。
- Windows 源码客户端及实际打包的 ASAR 客户端均输出 `DESKTOP_SMOKE_OK`，其中 `fullscreen: true`，同时验证剧情、自动存档与渲染器隔离。
- [Publish PWA #37496380466](https://github.com/AureliusWu/Project1/actions/runs/37496380466)：部署及实际网址复验全部 success。桌面、手机竖屏、手机横屏均输出 `LIVE_SMOKE_OK`，版本 0.1.2，清单偏好 `landscape`，美术、自动存档、断网重开均成功，页面异常数为 0。手机方向切换后位置保持。
- Pages 实际配置继续为 `build_type: workflow`，通过 GitHub Actions 发布。
- [v0.1.2 下载](https://github.com/AureliusWu/Project1/releases/tag/v0.1.2) 已公开：安装 EXE、便携 EXE、PWA ZIP、构建证据 JSON、SHA-256 校验文件全部上传并验证。版本标签与 Release 固定指向上述代码提交。
- [线上三种屏幕截图](https://github.com/AureliusWu/Project1/actions/runs/37496380466/artifacts/11428365069) 保留该次实际网站的标题与阅读页面。

发布后仅补充验证记录和更清晰的阅读预览：截屏脚本现在等待进度恢复提示消失后再截图，本地三种屏幕复验通过。此调整不属于客户端运行代码，不改变已验证的 PWA 和 Windows 下载包。

## v0.1.1 检查范围

- 保留 16 项剧情与存档校验；第一章与 `chapter1-v1` 存档契约保持兼容。
- 浏览器集成检查增加到 20 项，覆盖电脑与手机的资源缓存失败/重试、子目录离线重开、等待更新与关闭窗口后的存档恢复、安装提示状态。
- 更新测试使用真实 Service Worker 和完整构建包，在同一浏览器存储空间内切换两次缓存版本。观察页面位于游戏作用域之外，确认旧窗口关闭后才激活新版本。
- 安装事件测试验证应用如何调用浏览器提供的安装事件；系统安装对话框由浏览器自行提供。
- Windows 流程验证源码窗口及打包后 ASAR 窗口，全部通过后才公开 Release。
- Pages 使用通过双端验证的产物自动发布；发布后另用真实网址检查手机、电脑、所有美术、自动存档及断网重开。证据截图作为 `MoistHealing-Live-Previews` 产物提供。

实际结果以 [Build game](https://github.com/AureliusWu/Project1/actions/workflows/build.yml) 和 [Publish PWA](https://github.com/AureliusWu/Project1/actions/workflows/pages.yml) 的对应运行记录为准。版本下载中的 `release.json` 固定记录源码提交和构建证据。

## v0.1.1 发布结果

运行代码提交：`2eec3dfeeeb89acd4d6c59041cec4dccacee7fe1`。

- [Build game #37487512201](https://github.com/AureliusWu/Project1/actions/runs/37487512201)：Web、Windows、Release 全部 success；16 项逻辑、20 项浏览器测试全部通过。Windows 源码及 ASAR 安装包启动均输出 `DESKTOP_SMOKE_OK`。
- [Publish PWA #37488175964](https://github.com/AureliusWu/Project1/actions/runs/37488175964)：部署及实际网址验证全部 success。电脑、手机分别输出 `LIVE_SMOKE_OK`，版本 0.1.1，美术、自动存档、离线重开均成功，页面异常数为 0。
- 已读取 Pages 实际配置：`build_type: workflow`，使用 GitHub Actions 发布。
- [版本下载](https://github.com/AureliusWu/Project1/releases/tag/v0.1.1) 已公开：安装 EXE、便携 EXE、PWA ZIP、`release.json`、`SHA256SUMS.txt` 五项文件上传并校验成功，版本标签指向上述运行代码提交。
- [线上双端截图](https://github.com/AureliusWu/Project1/actions/runs/37488175964/artifacts/11423708478) 包含标题与实际阅读界面。

发布结果记录后补充了发布脚本的草稿提交检查：未公开的草稿若属于另一个提交，会拒绝上传。此检查不属于客户端运行代码，不改变上述已验证的游戏包与 PWA。

## v0.1.0 历史记录

## 已完成

- TypeScript 严格检查通过。
- Vite 生产构建与 PWA 完整资源缓存生成通过。
- 16 项引擎/存档测试通过：全部 54 条路线结束、三种结局可达、全部场景可达、逐段恢复、导入篡改/格式/路线/大小校验。
- 两张校园背景、两张透明角色立绘、中文字体与应用图标已随包提供。
- 14 项真实浏览器集成测试全部通过：手机与电脑分别验证完整结局、手动存档、迁移、回看、短横屏与离线重开。测试截图见 `docs/previews/`。
- 断网重开针对 `Vary: Origin` 主机响应的缓存差异修复后，两端离线恢复通过。
- Windows 源码客户端和打包后的 ASAR 客户端均实际启动通过：标题、美术、剧情、自动存档、渲染器隔离检查成功。
- Windows x64 安装版与便携版构建成功，PWA 包、Windows 包和真实截图均已上传。

最终运行证据：[Build game #37448430945](https://github.com/AureliusWu/Project1/actions/runs/37448430945)，代码提交 `008f6f8f086e50e44df67ddec5cee3a9b75b99a1`，Web / Windows 均为 success。

下载：[PWA](https://github.com/AureliusWu/Project1/actions/runs/37448430945/artifacts/11403928418) · [Windows x64](https://github.com/AureliusWu/Project1/actions/runs/37448430945/artifacts/11404438410)。产物包含 `MoistHealing-0.1.0-x64-Setup.exe` 与 `MoistHealing-0.1.0-x64-Portable.exe`。

## 集成验证

Playwright 测试覆盖桌面与手机：标题与美术资源、路线选择、重载续读、手动存档、回看、完整结局、存档迁移、离线重开、短横屏布局。

Windows CI 载入实际 Electron 窗口，检查标题、美术、剧情开始、自动存档及渲染器隔离后生成安装包与便携 EXE，再启动 ASAR 内的实际打包程序复验。以 Actions 运行结果为最终证据；构建配置本身不等于已产出安装包。

当前开发环境的 Chromium 常规下载与桌面窗口启动受运行环境限制。已使用独立测试浏览器运行真实界面；该浏览器每个测试需独立进程，常规 CI 浏览器无此要求。Windows 桌面已通过 CI 的源码启动、打包和打包后启动复验。

## 产品边界

- 当前版本包含三章完结；上方 v0.1.0 为第一章时期的历史记录。
- 跨端存档通过导出/导入完成，未提供账户云同步。
- v1.3.0 候选已接入人物语音；真人听感仍待实际体验。
- Windows 包暂未代码签名。
- Pages 已启用并完成 v0.1.0 部署。后续版本由验证成功的构建自动发布；仓库的 Pages Source 应设为 GitHub Actions。
