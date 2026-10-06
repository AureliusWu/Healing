# 技术结构

React 19 + TypeScript + Vite 8 是唯一的界面与构建入口。Electron 44 载入同一份 `dist/index.html`。PWA 和桌面端不维护两份剧本。

| 模块 | 职责 |
| --- | --- |
| `src/story/chapter1.ts` | 独立的有向剧情图、台词、选择效果、角色与结局描述 |
| `src/game/engine.ts` | 不依赖 DOM 的剧情推进、选择、路线重放与结局解析 |
| `src/game/storage.ts` | 版本化存档、本地槽位、设置、严格的导入解析 |
| `src/game/music.ts` | 用户点击解锁的原创程序音序；后台暂停 |
| `src/App.tsx` | 标题、阅读、角色、章节、回忆、存档、设置与回看 |
| `src/pwa.ts`、`src/components/PwaPanel.tsx` | 安装提示、完整离线缓存状态、下载失败重试及版本检查 |
| `scripts/build-pwa.mjs` | 按实际产物及内容哈希生成完整资源缓存 |
| `electron/main.cjs` | 本地窗口、全屏、加载控制、独立桌面启动校验 |
| `.github/workflows/` | Web 验证、Windows 构建与可选 Pages 部署 |
| `scripts/publish-release.mjs` | 仅在双端验证成功后发布不可变的版本下载、校验值与构建证据 |
| `scripts/live-smoke.mjs` | 复验真正发布的网址、双屏幕与离线存档恢复 |

## 存档契约

`schema: 1`、`game: moist-healing`、`storyVersion: chapter1-v1`。存档记录剧情位置和选择序列。导入时从入口重放选择来重建属性与历史，不相信输入文件中的属性、台词历史或任意场景跳转。大小限制为 2 MB。

两端使用相同 JSON 文件格式。浏览器与 Electron 的存储空间彼此独立，迁移需要玩家导出/导入。目前没有后端、账户或自动云同步。

内容增补可加入新章节数据并明确迁移契约。不要在原剧情版本内悄悄改段落顺序，否则旧存档的段落索引可能指向不同文本。

## 离线与更新

构建后枚举全部 HTML、JS、CSS、立绘、背景、图标与字体，再计算内容哈希作为缓存版本。安装缓存是原子的；任何必需资源失败，都不宣称离线已就绪。缓存只拦截自身 origin 和 scope 内的 GET。路径全部相对，支持 GitHub Pages 子目录。

新 Service Worker 不在阅读过程中强制跳过等待状态。旧页面仍由旧版本服务；下载完成后提示关闭所有游戏窗口并重新打开。手动检查通过 `registration.update()` 完成，下载失败允许重试。缓存成功并激活前不会宣称已可离线阅读。预缓存显式重新获取资源，避免浏览器旧 HTML 缓存混入新版本。激活后只清理本游戏的旧缓存。

Pages 自动部署只使用 `main` 上通过完整验证的那次构建产物，并拒绝用较旧提交覆盖已经前进的 `main`。Release 先创建草稿，上传并验证必要文件后再公开；已经公开的版本不被覆盖，下载提供 SHA-256 与确切源码提交。

## 桌面

使用本地 `file:` 加载；Service Worker 仅在 HTTP(S) 注册。运行时不开远程窗口、不导航到外部内容，Node integration 关闭，context isolation 与 renderer sandbox 开启。渲染器不需要 preload 或原生文件系统桥接。

下载/导入使用浏览器文件接口。桌面包用 `asar` 封装。Windows 流程输出安装 EXE 与便携 EXE；当前未配置代码签名。

## 视觉与音频

美术由内置图像生成工具生成，再转为 WebP；透明角色保留 alpha。中文正文使用自带的 Noto Serif SC 子集，避免外部字体加载。子集覆盖当前代码与剧本字符；加入新剧情时应重建字体子集或接受系统后备字体。

音乐由固定原创音序合成，不发起网络请求。首次用户点击后启动，页面隐藏时暂停。自动阅读、快进在分支与结局处停下，减少误选。
