# Healing · 历史语音失败复验 · 2026-10-31

本轮为制作工作流维护；保留原生引擎、录音、正文、存档和公开玩家版本。

复验源码：`49b08968bf29e130fd826a720f966f70f576569c`。当前导出对白与历史录音请求逐字段相同；历史 `sourceCommit` / `sourceFiles` 不改写，新证据独立记录当前源文件摘要。

实际完成：427/427 条录音的原始 / master / runtime 字节、请求摘要、运行绑定和完整 FFmpeg 解码通过；现有 `seed_verified_voice → render_full_voice merge` 全量复验通过，新增合成 0 条。可复核本地结果见 [JSON](VOICE-AUDIT-20261031.json)。

新增 `audit_recorded_voice.py` 和只读 Actions 入口，在当前提交重新导出正文、拒绝文字 / 音色 / 模型 / 次序漂移，复验已有制作函数并上传同提交证据。验证不安装 TTS/ASR 模型，不修改历史录音或原验收。

本地命令：

```sh
python -m unittest discover -s tools/production -p 'test_*.py'
node tools/production/export_dialogue.mjs /tmp/Healing-current-dialogue.json
python tools/production/audit_recorded_voice.py --current-plan /tmp/Healing-current-dialogue.json --decode --report /tmp/Healing-recorded-voice-audit.json
```

上述 JSON 只授予本轮技术复验 PASS。`humanListening=false`、`runtimeInteraction=NOT_RUN`、`release=NOT_ASSESSED` 保留；本轮未重测 Windows/PWA 交互或签定全篇听感。已有原平台记录保留原提交身份。

下一步：取得新 Actions 的同提交成功证据后，以此核销已被当前完整录音和运行文件覆盖的历史失败通知；质量待审项继续按本作验收记录推进。
