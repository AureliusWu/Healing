# 素材与提示词

生成方式：内置 `image_gen`，2026-10-06。生成后转为 WebP；角色保留透明通道。下面记录最终采用的提示词。图标为项目原创 SVG；音乐为项目原创程序音序。

## classroom.webp

Use case: illustration-story. Asset type: original background for the Chinese school visual novel 湿性愈合, chapter 生长痛. A beautifully hand-painted anime school classroom in Wuhan in early autumn, empty of people. Landscape 16:9, ideally 1536x864 or 1536x1024. Afternoon after rain: tall windows on the left with luminous pale mint green trees and rain droplets, rows of wooden desks and muted blue chairs, a dark green blackboard at the back, one cream curtain lifting in the breeze, a small pothos plant and a closed notebook on a foreground desk. Quiet sensitive coming-of-age mood, soft cream light, desaturated celadon green, delicate realistic architectural detail, painterly watercolor texture with refined anime linework. Eye level cinematic composition, room receding into deep space on the right, clear middle and lower foreground so UI may overlay. No people, no readable text, no logos, no watermarks. This is a production game background, no UI or borders.

## campus.webp

Use case: illustration-story. Original hand-painted background for a Chinese school visual novel, a quiet public high school campus in Wuhan just after autumn rain. Wide cinematic 16:9 landscape. An old cream three-storey school building with green window frames stands at the right behind large camphor trees; a red rubber running track curves away on the left; in the foreground wet pale stone walkway and a low bench with scattered golden leaves reflect the afternoon sky. Pale luminous cloudy sky, distant bluish city blocks and electrical poles, tiny puddles, fine soft rainy haze. Empty campus, absolutely no people. Refined anime architecture painting, delicate linework and watercolor texture, matching a sunlit classroom: warm ivory, desaturated celadon, subtle amber and green. Gentle melancholy and hopeful youthfulness. Rich readable environmental detail, no signs or readable text, no logos, no watermark, no frame, no UI. Production game background.

## lin.webp

Use case: illustration-story. Original visual novel character sprite, a Chinese schoolgirl named 林见夏 in a quiet school slice-of-life story. Show one person standing from head to knees, with generous transparent margin. Shoulder-length dark straight bob with wispy bangs and one small mint rectangular hair clip, warm brown eyes, thoughtful shy smile. Wearing a loose cream and forest-green zip-up school tracksuit jacket over a plain white T-shirt and dark blue full-length track trousers. Holding a closed cream literature notebook in both hands at waist level. Relaxed everyday standing pose, facing slightly left, looking toward the reader. Refined hand-drawn anime line art and painterly watercolor shading, soft cream and sage palette, natural proportions. Entirely transparent background. Only the student, no text, no logos, no border, no shadow backdrop. Suitable as a game sprite.

## chen.webp

Use case: illustration-story. Original Chinese school visual novel character standing sprite named 陈知遥. One girl, school class representative, shown from head to knees with transparent margin. Refined hand-drawn anime with delicate painterly watercolor shading. Dark chestnut hair tied in a practical mid-height ponytail with a simple cream elastic, a few wisps around face, warm brown eyes, calm capable expression with a modest friendly smile. Ordinary loose forest-green and ivory zip-up school tracksuit jacket over a white T-shirt, dark navy full-length athletic trousers. Holding a neat stack of school magazines against her body with her left arm; her right hand rests lightly on the top magazine. Relaxed upright three-quarter standing pose toward right, face toward reader. Palette warm cream and muted sage, natural proportions, matching a soft green Chinese classroom slice-of-life game. Genuine transparent alpha background. Only one figure, no text, no border, no logos, no scenery, no watermark, no backdrop gradients. Production game sprite.

## 字体

Noto Serif SC：来自 Google Fonts 官方仓库的 `ofl/notoserifsc/NotoSerifSC[wght].ttf`。以 fontTools 固定 400 字重，并对当前工程文本字符做 WOFF2 子集。原始许可保存为 `docs/OFL-NotoSerifSC.txt`。字体使用 SIL Open Font License，不受项目 MIT 许可替代。


## v0.1.3 二维重绘

当前美术的完整提示词与透明边缘处理见 [ART-v2.md](ART-v2.md)，实际资源参数见 [资源清单](../production/ART-ASSETS.json)。上文保留 v0.1.0 的制作历史；后续新增素材沿用 [制作规范](../PRODUCTION.md)。
