# 三项目视觉小说制作契约 v1.0.0

同步日期：2026-10-08。适用仓库：[NetLove](https://github.com/AureliusWu/NetLove)、[Project1](https://github.com/AureliusWu/Project1)、[Test](https://github.com/AureliusWu/Test)。

这三个项目共用制作方法和检查接口，各自保留故事、美术与原生引擎。共用文件为本文、`scripts/vn-contract.mjs`、`scripts/vn-contract.d.mts`；文件哈希写入各仓库的 `docs/production/REUSE-MANIFEST.json`。升级时先改版本、验证实际使用者，再顺序同步，避免三份副本悄悄分叉。

## 已有能力与来源

| 能力 | 来源与可复用入口 | 在 NetLove 的实际接入 |
| --- | --- | --- |
| 全窗口画面、底部半透明阅读层、隐藏恢复 | Project1 的 fullscreen-reading.css、ReadingOverlayOpacity、useDisplayMode | 同一语义结构、独立配色；隐藏暂停、旋转保留段落 |
| 横屏 PWA 与 Windows 共用内容 | Project1 的 pwa.ts、build-pwa.mjs、Electron | 资源相对路径、完整原子缓存、独立应用 ID |
| 选择重放与跨设备 JSON 存档 | Project1 的 engine.ts、storage.ts、progress.ts | 独立 netlove-v1；不信任导入分数与历史 |
| 稳定剧情事实来源与全路线执行 | Test 的 story.json、compile_story、原生回归 | 单一 JSON、场景/台词 ID、288 条原生运行路线 |
| 源图、提示词、许可与 SHA-256 | Test 的 assets_source、Prompt Registry、资产校验 | 7 张原图和运行 WebP，准确请求与哈希绑定 |
| 实际包与源码分开验收 | Test 的 Windows EXE 验证、Project1 的 ASAR smoke | CI 分别启动源码与 win-unpacked 中的实际 EXE |
| 字体与资源离线自给 | Project1 的 subset-font.py、prepare-art.py | 重新覆盖 JSON 剧情字形；alpha 无损保留 |

NetLove 在本轮回馈：引擎无关结构校验器、JSON 台词字形覆盖修正、跨作品移植清单与三项目能力索引。Project1 的角色/年级和 Test 的 Ren'Py 规则只在各自仓库生效。

## 共用结构校验

`node scripts/vn-contract.mjs path/to/story.json` 接受 `scenes` 或 `nodes`，检查入口、唯一 ID、台词非空、选项冲突、目标存在、全图可达、意外环路与未完成终点。Test 的 `routes` 作为结构分支读取；条件是否成立仍由 Test 原生验证器判断。

Project1 通过 `tests/shared-vn.test.ts` 适配 `resolve`、`bridge` 和原有段落偏移，继续使用自己的旧存档夹具。结构上的路径数量不能替代真实状态路线数量；通用脚本不判断角色语义、剧情节奏、表情质量或恋爱是否成立。

## 新作品移植清单

1. 记录来源提交与许可证；复制框架时建立全新的故事标识、存储前缀、应用 ID、缓存前缀和文件名前缀。
2. 删除来源作品的剧本、人物图集、专用夹具和发布脚本；查找界面、安装说明、窗口标题与发行元数据中的旧名和旧章节数量。
3. 正文只留一个事实来源。台词 ID 与存档位置稳定；回看和读档从原生路线重建。
4. 图像生成负责人物与场景绘制；编码脚本只负责格式。每个最终素材绑定原图、最终请求、尺寸、alpha 与 SHA-256。
5. 字体子集必须包括 JSON 正文和所有界面文字；授权文本随播放器提供。
6. 浏览器验证覆盖 1440×900、412×915、568×320 与 844×390；检查选择、结局、导入导出、透明度、隐藏恢复、旋转和断网重开。
7. Windows 源码、实际包和公开 PWA 分别记录结果。截图来自实际程序，生成素材不记为界面证据。
8. 安装包/网页验证通过后再提供下载；已有公开版本保持不可覆盖。没有执行的项目写清待验证。

## 本轮发现

Project1 的字体子集原先仅搜 TS/TSX/CSS；NetLove 正文移到 JSON 后，必须扩展字符采集。PWA 安装说明仍写“完整第一章”，移植时发现并修正为五章。前者影响字形，后者影响玩家对离线范围的判断，这两类检查都纳入复用清单。

三仓同步只新增制作文档、共用检查脚本与 Project1 的适配检查，既有两个作品的角色、剧情、存档和已公开版本保持各自原生契约。
