# 湿性愈合

> 有些话，长大后才学会说。有些人，在雨停之前就已靠近。

青春期校园题材原创视觉小说。三章 **《生长痛》《显影》《雨停以后》** 已完整收录，当前版本 **v1.0.0**。

[在线游玩 / 安装 PWA](https://aureliuswu.github.io/Project1/) · [下载 Windows / PWA](https://github.com/AureliusWu/Project1/releases/tag/v1.0.0)

你扮演江城七中高二学生程屿，在一次月考后的换座中，与林见夏、陈知遥和许棠相遇。成绩、家庭期待、文学社与一场没有说完的争执，构成九月的这个下午。

![共同篇事件画面](public/art/cg-shared-print.webp)

[完整版实机预览与验证证据](docs/previews/v1.0.0/README.md)

下表为 v1.0.0 正式线上版本的实际界面，已将通过验证的截图归档到仓库。

| 预览 | 电脑 | 手机横屏 | 手机竖屏兼容 |
| --- | --- | --- | --- |
| 标题界面 | [查看](docs/previews/title-desktop.jpg) | [查看](docs/previews/title-landscape.jpg) | [查看](docs/previews/title-mobile.jpg) |
| 实际阅读 | [查看](docs/previews/reading-desktop.jpg) | [查看](docs/previews/reading-landscape.jpg) | [查看](docs/previews/reading-mobile.jpg) |
| 剧情选择 | [查看](docs/previews/choices-desktop.jpg) | [查看](docs/previews/choices-landscape.jpg) | [查看](docs/previews/choices-mobile.jpg) |
| 隐藏界面 | [查看](docs/previews/picture-desktop.jpg) | [查看](docs/previews/picture-landscape.jpg) | [查看](docs/previews/picture-mobile.jpg) |

[三位角色与表情实机预览](docs/previews/v0.1.6/characters-desktop.png) · [角色美术规范与素材](docs/production/CHARACTER-ART.md) · [v1.0.0 更新记录](docs/releases/v1.0.0.md)

## 可玩的内容

- 三章完结，65 个场景、7 次选择、1,296 种组合；保留第一章 3 种章节结局，追加 4 个最终结局。
- 四张新增背景与四张事件 CG；章首重读、结局重读、事件画面和音乐鉴赏随阅读开启，保留真实路线。
- 三位主要女角色沿用 v0.1.4 的统一二维美术；每人六种表情与完整三视图，可在角色档案浏览。生日、身高、体重保留，恢复十七岁的高二校园设定。
- 全窗口场景画面 + 底部一体化半透明阅读层；透明度可调，隐藏界面可完整欣赏背景与立绘。
- 逐字文本、自动阅读、快进、已读回看、结局回忆手册。
- 自动存档 + 3 个手动存档位；JSON 导入/导出，在手机与电脑之间迁移进度。
- 横屏优先：手机短横屏标题、立绘和阅读布局；竖屏旋转提示可关闭，旋转时保留进度。
- 标题页、阅读界面与设置提供全屏入口；手机网页采用页面内沉浸模式，避免 Android Chrome 无法由页面关闭的系统全屏提示；桌面继续使用系统全屏。
- 键盘操作、减少动态效果选项。
- 安装说明、完整离线下载状态、下载失败重试与版本检查。
- 六首原创 Web Audio 配乐、场景雨声与操作提示音，可独立控制；无账号、无 API 密钥、无运行时外部请求。

## 两个客户端，一套游戏

| 客户端 | 运行方式 | 离线支持 | 存档 |
| --- | --- | --- | --- |
| 手机 / 电脑 PWA | HTTPS 网站安装到主屏幕或桌面 | 首次缓存全部资源后可断网重开 | 浏览器本地存储，可导出迁移 |
| Windows 桌面 | Electron 安装包 / 便携 EXE | 所有资源随安装包提供 | 应用本地存储，可导出迁移 |

PWA 安装清单指定 `orientation: landscape`，支持的系统安装后优先横屏。网页可直接横向握持手机；全屏按钮只在点击后请求全屏。若系统锁定了竖屏，请开启自动旋转。竖屏保留兼容布局。

这是共用代码与数据格式的双端实现。当前版本不包含账户云同步。

## 开发与游玩

需要 Node.js 24（或满足 Vite 8 要求的 Node.js 22.12+）。

```bash
npm ci
npm run dev
```

浏览器打开终端显示的地址。测试生产 PWA：

```bash
npm run build
npm run preview
```

localhost 可测试 Service Worker；手机实际安装需要 HTTPS。

桌面版：

```bash
npm run desktop       # 构建并启动桌面客户端
npm run desktop:pack  # 输出未打包目录
npm run desktop:win   # 在 Windows 生成 NSIS 安装包和便携 EXE
```

`release/`、`dist/` 和依赖目录不进入 Git。发布包通过 Actions 生成。

## 下载与部署

直接打开 [游戏网页](https://aureliuswu.github.io/Project1/)，标题页的「安装与离线」提供安装操作、下载状态与更新检查。离线状态就绪后可以断网重开。

[版本下载页](https://github.com/AureliusWu/Project1/releases/tag/v1.0.0) 提供 Windows 安装版、便携版及 PWA ZIP，包含文件 SHA-256 与实际构建提交记录。该下载不依赖 Actions 产物保留期限。

每次推送 `main` 会运行 [Build game](https://github.com/AureliusWu/Project1/actions/workflows/build.yml)：先验证剧情与手机/电脑 PWA，再在 Windows 启动实际 Electron 程序、生成安装包并启动实际打包程序复验。全部成功后，对应版本的安装包和 PWA 会发布到 Releases。需要发布新版本时，同时更新 `package.json`、锁文件与 `docs/releases/v版本号.md`；已发布版本不被覆盖。对应运行页面也保留 Artifacts：

- `MoistHealing-PWA`：完整静态网页包。
- `MoistHealing-Windows-x64`：NSIS 安装包与便携 EXE。

仓库已启用 GitHub Pages。[Publish PWA](https://github.com/AureliusWu/Project1/actions/workflows/pages.yml) 在完整构建验证成功后自动部署该次构建的 PWA 包，随后检查实际网站的手机/电脑游玩、存档及离线重开。也可以手动运行该流程。

仓库 Settings → Pages 的 Source 应选择 **GitHub Actions**，以保证只发布构建产物。使用 `main` 分支目录发布会载入开发源码，无法直接运行游戏。

还可以把 `dist/` 部署到任意 HTTPS 静态主机。采用相对路径，支持子目录部署。网页的新版本完整下载后会显示提示，关闭所有游戏窗口再打开时接管，保留当前存档。

## 操作

| 操作 | 键盘 / 触屏 |
| --- | --- |
| 显示完整段落 / 下一段 | 空格、Enter、右方向键，或点击画面/文本 |
| 自动阅读 | A，或「自动」 |
| 存档 | S / Esc，或「存档」 |
| 回看 | L，或「回看」 |
| 隐藏 / 恢复界面 | H，或「隐藏界面」；轻触画面与 Esc 可恢复 |
| 进入 / 退出全屏 | 标题、阅读页或设置中的全屏按钮；桌面版也支持 F11 |

隐藏界面会暂停自动与快进，恢复操作保持当前段落。快进与自动阅读都会在选择处停下。回到标题会保留进度；开启新故事前会提示自动存档将更新。

## 验证

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:desktop
npm run test:desktop:packaged # Windows 打包后，检查实际 ASAR 桌面程序
```

剧情校验遍历 1,296 条完整路线与 54 条旧章迁移，并验证段落可恢复、全部场景可达、非法存档被拒绝。浏览器测试覆盖电脑与手机的完整游玩、存档、迁移、离线重开与短横屏布局。桌面启动检查验证实际窗口、立绘资源、剧情启动、自动存档和渲染器隔离。

详见 [技术结构](docs/ARCHITECTURE.md)、[三章剧情设计](docs/STORY.md)、[素材与提示词](docs/prompts/ART-v4.md)、[制作规范](docs/PRODUCTION.md)、[迭代记录](docs/production/ITERATIONS.md) 和 [验证记录](docs/VALIDATION.md)。

## 授权

项目代码和原创文本使用 [MIT](LICENSE)。AI 美术来源与生成记录见素材文档。游戏内字体使用 Noto Serif SC 子集，遵循 [SIL Open Font License](docs/OFL-NotoSerifSC.txt)。两份许可文本也随 PWA 和桌面包提供于 `licenses/`。
