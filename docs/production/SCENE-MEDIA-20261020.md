# 场景美术与音乐 · v1.2.0 已发布 · 2026-10-20

c2-confirm 显示已确认的校刊清样与专曲，隐藏立绘；保留既有路线、鉴赏及存档身份。

## 新增素材

CG《七点四十》：[原图、提示词、参考与校验](../art/confirmed-proof-manifest.json)。原创场景音乐《七点四十》：[编配配方、源 WAV、运行 OGG 与完整解码](../audio/proof-confirmed-score-manifest.json)。图像由 image_gen 制作；音乐为原创编配与程序合成。各作素材独立，保留源文件、配方与运行文件。

## 当前检查

本地 74 项逻辑 / 作者工具检查及生产校验通过。[本版 Build](https://github.com/AureliusWu/Healing/actions/runs/39370279598) 的网页路线、六尺寸新 CG、离线音频和实际 Windows 包检查通过；[公开 PWA](https://github.com/AureliusWu/Healing/actions/runs/39370842536) 成功。[v1.2.0 下载](https://github.com/AureliusWu/Healing/releases/tag/v1.2.0) 已公开。独立下载公开 PWA ZIP 和 Windows 附件后，大小及 SHA-256 与 GitHub 摘要匹配；PWA ZIP CRC 正常，新 CG 与 OGG 逐字节匹配已测源文件。

四作 [同源联合检查 39382250096](https://github.com/AureliusWu/Circuit/actions/runs/39382250096) 已通过：同一新 Chromium 配置中依次安装四作，192 个缓存文件与各自 scope 保持隔离，保留此前 React 存档，四作均可断网重开，0 页面错误。[完整原始报告及工件摘要](FOUR-GAMES-OFFLINE-20261020.json)。

## 制作与验收边界

新图只在对应物品出现后显示，收走后恢复原场景；文件音轨接入既有音乐总线，保留原有音量、暂停和混音行为。React 三作的异步播放检查覆盖迟到下载、重复配置、暂停上下文与离开场景；Rain 保留原生引擎通道与逐句演出。

真人试听、普通硬件和最终美术选择仍待实际体验。本批是新制作的四图四曲，不记录此前未找到的临时素材或录音为已恢复。[精确检查点](SCENE-MEDIA-20261020.json)。
