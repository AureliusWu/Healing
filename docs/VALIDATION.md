# 验证记录

当前版本：0.1.2。日期：2026-10-07（北京时间）。

## v0.1.2 检查范围

- 16 项剧情与存档校验；原存档继续兼容。
- 浏览器集成检查增至 26 项。新增触屏横竖屏切换、竖屏提示关闭、实际全屏与系统退出、方向锁拒绝、全屏权限拒绝/接口缺失后的继续阅读。方向锁的成功与拒绝通过浏览器接口桩模拟；全屏进入和退出使用真实浏览器接口。
- 横屏布局检查扩展到 568×320、640×360、844×390、915×412，要求标题动作在一屏内，并检查剧情选项在页眉下方、正文上方。
- 生产网站复验扩展为桌面、手机竖屏、手机横屏；检查实际清单的横屏偏好，以及切换方向和离线重开后的进度。
- Windows 源码版与打包后的 ASAR 版启动验证新增真实全屏按钮进入/退出检查。全屏权限仅放行本地游戏主文档；其余权限拒绝。
- 本地 16 项逻辑与 26 项浏览器用例通过。高并发运行中有 7 项因本地测试进程争用而超时，降低并发后这 7 项全部通过；最终 CI 仍使用常规 Chromium 的两个工作进程复验。

发布验证结果将在对应 Actions 成功后补充；当前记录不代表 Windows 和 Pages 已发布。

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
