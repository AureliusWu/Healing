# 验证记录

当前版本：0.1.6（发布验证中）。日期：2026-10-07（北京时间）。

## v0.1.6 检查范围

- 本地 20 项剧情、存档与表现逻辑检查通过；54 条路线均终止、三种结局可达，旧式存档能恢复争执中的表情和 v0.1.5 插入场景的十六个位置。
- 与正式 v0.1.4 逐场景比较，22 个原有场景的全部玩家可见台词与选择逐字一致；表情注解不进入玩家文本。v0.1.5 的追加片段另行修订，未改变原选择。
- 三组三视图为 1536×1024；三个透明表情图集为 1254×1254，共十八格。编码后的 alpha 与原图逐像素一致；真实主体范围与采样框已入库，避免依赖生成器未严格遵守的等分网格。
- 中文字体已重新生成，源码中文字形覆盖完整。生产构建通过，PWA 包含 21 个离线资源；旧许棠 SVG 已移除。
- 本地六项与本次改动直接相关的浏览器检查通过：电脑 / 手机的画集六种表情、三视图断网浏览、争执表情读档恢复，以及四种短横屏边界与 PWA 全资产断网重开。一次遗漏的知遥表情注解在实机测试发现后补齐，两个恢复检查重新通过。
- 三位角色在 1440×900、844×390、412×915 均完成实际预览，页面错误为 0；角色画集与三视图另存于 `docs/previews/v0.1.6/`。验收脚本为 `scripts/character-preview.mjs`。
- Windows 构建与实际包启动、完整 CI 浏览器检查、线上 PWA 与离线重开结果在执行后补记；未验证前不记录正式发布完成。

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
- [线上最终截图](https://github.com/AureliusWu/Project1/actions/runs/37554181424/artifacts/11454286573) 包含三种屏幕规格的标题、阅读、选择与隐藏界面。仓库 `docs/previews/` 同时保留该版本的 12 张最终实机预览。

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

- 包含完整第一章，后续章节尚未编写。
- 跨端存档通过导出/导入完成，未提供账户云同步。
- 暂无人物语音。
- Windows 包暂未代码签名。
- Pages 已启用并完成 v0.1.0 部署。后续版本由验证成功的构建自动发布；仓库的 Pages Source 应设为 GitHub Actions。
