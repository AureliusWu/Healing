# 原创纯音乐源文件

保存原始作曲、渲染与母带脚本，以及本作两首MIDI/逐音符JSON。运行OGG沿用已交付原曲，SHA-256见 docs/audio/original-music-20261024.json。

GeneralUser GS 2.0.3 未重复入库。重渲染前按 dependency-versions.json 中固定上游提交恢复 generaluser/GeneralUser-GS.sf2 并核对 soundfontSha256，再运行 npm ci、pip install -r requirements.txt、python compose.py、python master.py。脚本生成整张八首原声集；本作只绑定清单中的两首。完整24-bit母带、MP3与乐器库沿用已交付的四作原创纯音乐完整制作包。第三方许可单独保存；玩家包包含乐器库原许可。

自动音频测量与实际播放器检查分别留证，真人听感待审。
