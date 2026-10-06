# 验证记录

版本：0.1.0。日期：2026-10-06。

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
- Pages 部署需要在仓库设置中启用 GitHub Actions 源，再运行发布工作流。
