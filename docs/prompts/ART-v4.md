# v0.1.6 · 统一角色三视图与表情

日期：2026-10-07。使用内置 image_gen；不使用 API / CLI 回退。美术输入基准为正式 v0.1.4（b51f8bd6dbf98165c1a20f24d58ca1cb6ddc6bcc）的 public/art/lin.webp 与 chen.webp。许棠按现有两位人物的画法重新制作，采用深棕低马尾、相机和校刊样张的原识别设计。

运行图集均由初次生成后用同一内置工具修正边距；三个最终图集实际输出 1254×1254，三视图实际输出 1536×1024。原图无损保留 alpha 后转 WebP，三视图使用质量 92 编码；没有用脚本绘画、补背景、抠图或重写透明像素。最终尺寸、SHA-256、透明比例和六个采样框见资源清单。

原工具输出存在列间位置偏差，因此项目按真实人物范围采样，不把提示词中请求的等分网格当成已成立事实。脚本只测量并转换编码；游戏组件按同一人物的固定尺寸与头顶边距显示。

## lin-expressions.webp

### 初次生成

```text
Use case: identity-preserve. Asset type: one transparent 3-by-2 expression sprite atlas for the original Chinese school visual novel 湿性愈合.
Input image 1 is the approved v0.1.4 character 林见夏, the identity, drawing style, clothing, pose and prop reference. Preserve this exact character and the reference art's thin clean anime linework, flat cream/mint/forest-green colors, two-tone cel shadows, face shape and brown eyes. Make a SQUARE high-resolution 3072x3072 PNG atlas, genuine transparent alpha.
Exactly SIX separate copies of the SAME character in a rigid grid of THREE equal-width columns and TWO equal-height rows, no borders. Each cell shows her complete head through knees, with generous clear transparent margin; center each copy precisely in its cell, keep head size, head position, shoulders, standing body, clothing, hands and cream notebook identical across cells. No overlap between cells. A game engine will display one cell at a time.
Cell order left-to-right top then bottom: 1 neutral listening with relaxed closed mouth; 2 gentle happy open-eyed smile; 3 surprised eyes slightly wide and small open mouth; 4 worried downturned eyes and small tense mouth; 5 hurt/frustrated brows and restrained serious mouth; 6 shy blush, eyes OPEN, a tiny embarrassed smile. Make expressions clearly distinct without distorting her identity.
Character invariants: shoulder-length dark-brown straight bob, wispy bangs, mint rectangular hair clip on the same side as reference, warm brown anime eyes, loose cream and forest-green zip-up school tracksuit jacket with double cream stripes, white round-neck T-shirt, dark navy long track trousers. Both hands hold the closed cream literature notebook at waist. Ordinary age-appropriate high-school everyday appearance and clothing. Keep the same gently turned standing pose as reference.
Remove the reference's cloudy glowing halo completely. Only crisp figure pixels and soft antialiasing on TRUE TRANSPARENT alpha, absolutely no scenery, background color, cast shadow, fake checkerboard, title, text, game dialogue UI, icons, logos or watermark. This is one production sprite atlas, never a screenshot.
```

### 采用的边距修正

```text
Use case: precise-object-edit. Edit ONLY THE REGISTRATION AND SPACING of this six-expression character atlas. Keep the same character identity, art style, uniform, props, pose and six expressions exactly. Preserve TRUE TRANSPARENT background.
The current sprites are too close to cell boundaries. Redraw/rearrange the SIX copies into a rigorously registered 3-column, 2-row SQUARE atlas. Each equal cell has aspect 2:3. All six copies must be centered identically in their cell and scaled identically to 82% of cell HEIGHT, including all hair, hands and props. Use the top-of-head anchor at 8% of each cell height and the knee cutoff at 90%; leave clear transparent margins on ALL FOUR SIDES OF EACH CELL. The entire drawn figure and its props must stay within the central 78% of its cell WIDTH. Same face position and head size for every expression. No part of a neighboring figure can enter a cell. Clear generous transparent gutters between columns and rows. No cropping of hair, fingers or magazines at grid borders or the image edge. Keep order: neutral, smile, surprised / worried, hurt, shy. No captions, numbers, cell lines, checkerboard, background glow, UI or extra objects. Strongly preserve the reference character; solve spacing only.
```

## lin-turnaround.webp

```text
Use case: identity-preserve. Asset type: ONE production character turnaround sheet for the original Chinese campus visual novel 湿性愈合. The provided image is the LOCKED character design: preserve face, hair, hair accessories, uniform colors and structure, eye style and thin precise anime outlines. Three full-body views laid out horizontally, left-to-right FRONT, exact LEFT SIDE PROFILE, BACK. Same character, same height and body proportions, head top and soles aligned, all shoes fully inside the canvas with comfortable margins. Neutral standing posture, feet shoulder width, relaxed arms and hands, ordinary age-appropriate everyday high-school clothing. Cream and forest-green zip tracksuit with double pale sleeve stripes, white round-neck shirt, navy long athletic trousers with pale stripes, simple ivory sneakers. Flat cel-color blocks with two-level shadows, clean original 2D Chinese galgame drawing matching reference, not a photo or painting. Pale warm IVORY SOLID background. No shadows, scenery, UI, character names, writing, labels, border, logos or watermark. Wide 3:2 landscape composition. This is an illustrator's model sheet, not a game screenshot. Maintain correct front-side-back rotational consistency.
林见夏: shoulder-length dark-brown straight bob, wispy bangs, one small mint rectangular hair clip on the character's left temple as reference, brown eyes. Cream literature notebook held loosely by one hand at side in front and profile views; keep hair clip on the correct anatomical side across rotations.
```

## chen-expressions.webp

### 初次生成

```text
Use case: identity-preserve. Asset type: expression sprite atlas for 陈知遥 in 湿性愈合. Image 1: exact v0.1.4 identity, pose and clothing reference. Image 2: fellow character's drawing-style reference only. Preserve image 1's chestnut-brown high ponytail, ivory hair tie, brown anime eyes, friendly capable school class-representative appearance; cream and forest-green loose tracksuit jacket with double cream stripes, white T-shirt, long navy track trousers with pale stripes. Left arm holds exactly three green geometric-cover school magazines, right hand rests on the top magazine. SQUARE high-resolution transparent PNG. Exactly SIX head-to-knees standing copies in THREE equal-width columns and TWO equal-height rows. Every cell must be registered to the same centered head, same head size, pose, body, hands and prop placement. Clear transparent gutters, no overlap, no text or borders. Row-major expressions: neutral listening, happy open-eyed smile, surprised small open mouth, worried/sad, hurt/frustrated, shy blush with BOTH EYES OPEN. Keep consistent thin anime ink lines, simple nose and mouth, flat color shapes and two-level cel shadows. Match the approved reference drawing rather than painterly or realistic treatment. This is ONE runtime expression sprite atlas. TRUE TRANSPARENT alpha, no background, halo, checkerboard, scene, UI, gradients, shadows, logos, watermark or lettering. Ordinary age-appropriate school clothing.
```

### 采用的边距修正

```text
Use case: precise-object-edit. Edit ONLY THE REGISTRATION AND SPACING of this six-expression character atlas. Keep the same character identity, art style, uniform, props, pose and six expressions exactly. Preserve TRUE TRANSPARENT background.
The current sprites are too close to cell boundaries. Redraw/rearrange the SIX copies into a rigorously registered 3-column, 2-row SQUARE atlas. Each equal cell has aspect 2:3. All six copies must be centered identically in their cell and scaled identically to 82% of cell HEIGHT, including all hair, hands and props. Use the top-of-head anchor at 8% of each cell height and the knee cutoff at 90%; leave clear transparent margins on ALL FOUR SIDES OF EACH CELL. The entire drawn figure and its props must stay within the central 78% of its cell WIDTH. Same face position and head size for every expression. No part of a neighboring figure can enter a cell. Clear generous transparent gutters between columns and rows. No cropping of hair, fingers or magazines at grid borders or the image edge. Keep order: neutral, smile, surprised / worried, hurt, shy. No captions, numbers, cell lines, checkerboard, background glow, UI or extra objects. Strongly preserve the reference character; solve spacing only.
```

## chen-turnaround.webp

```text
Use case: identity-preserve. Asset type: ONE production character turnaround sheet for the original Chinese campus visual novel 湿性愈合. The provided image is the LOCKED character design: preserve face, hair, hair accessories, uniform colors and structure, eye style and thin precise anime outlines. Three full-body views laid out horizontally, left-to-right FRONT, exact LEFT SIDE PROFILE, BACK. Same character, same height and body proportions, head top and soles aligned, all shoes fully inside the canvas with comfortable margins. Neutral standing posture, feet shoulder width, relaxed arms and hands, ordinary age-appropriate everyday high-school clothing. Cream and forest-green zip tracksuit with double pale sleeve stripes, white round-neck shirt, navy long athletic trousers with pale stripes, simple ivory sneakers. Flat cel-color blocks with two-level shadows, clean original 2D Chinese galgame drawing matching reference, not a photo or painting. Pale warm IVORY SOLID background. No shadows, scenery, UI, character names, writing, labels, border, logos or watermark. Wide 3:2 landscape composition. This is an illustrator's model sheet, not a game screenshot. Maintain correct front-side-back rotational consistency.
陈知遥: chestnut HIGH ponytail tied with an ivory scrunchie, wispy bangs and brown eyes. Three thin school magazines with pale mint geometric covers, held together loosely at side. Preserve her ponytail root height and fuller ponytail silhouette from reference; no hair clip, no camera.
```

## tang-expressions.webp

### 初次生成

```text
Use case: illustration-story. Asset type: expression sprite atlas for original character 许棠 in 湿性愈合. Images 1 and 2 are approved v0.1.4 drawing, head/body proportion and uniform references for the SAME GAME, not the new character's identity. Draw a different schoolgirl named 许棠: dark-brown long hair tied in a LOW ponytail at nape with a simple charcoal tie, airy bangs, warm amber-brown anime eyes, thoughtful but direct everyday expression. SAME loose cream and forest-green zip school tracksuit jacket, double ivory sleeve stripes, white round-neck shirt and navy full-length track trousers. A tiny UNBRANDED graphite compact camera hangs from a plain dark strap at chest, two pale mint geometric school-publication proofs held in both hands at waist. Low ponytail is distinct from image 2's HIGH ponytail. Preserve consistent style and uniform construction across all three characters. SQUARE high-resolution transparent PNG. Exactly SIX head-to-knees standing copies in THREE equal-width columns and TWO equal-height rows. Every cell must be registered to the same centered head, same head size, pose, body, hands and prop placement. Clear transparent gutters, no overlap, no text or borders. Row-major expressions: neutral listening, happy open-eyed smile, surprised small open mouth, worried/sad, hurt/frustrated, shy blush with BOTH EYES OPEN. Keep consistent thin anime ink lines, simple nose and mouth, flat color shapes and two-level cel shadows. Match the approved reference drawing rather than painterly or realistic treatment. This is ONE runtime expression sprite atlas. TRUE TRANSPARENT alpha, no background, halo, checkerboard, scene, UI, gradients, shadows, logos, watermark or lettering. Ordinary age-appropriate school clothing.
```

### 采用的边距修正

```text
Use case: precise-object-edit. Edit ONLY THE REGISTRATION AND SPACING of this six-expression character atlas. Keep the same character identity, art style, uniform, props, pose and six expressions exactly. Preserve TRUE TRANSPARENT background.
The current sprites are too close to cell boundaries. Redraw/rearrange the SIX copies into a rigorously registered 3-column, 2-row SQUARE atlas. Each equal cell has aspect 2:3. All six copies must be centered identically in their cell and scaled identically to 82% of cell HEIGHT, including all hair, hands and props. Use the top-of-head anchor at 8% of each cell height and the knee cutoff at 90%; leave clear transparent margins on ALL FOUR SIDES OF EACH CELL. The entire drawn figure and its props must stay within the central 78% of its cell WIDTH. Same face position and head size for every expression. No part of a neighboring figure can enter a cell. Clear generous transparent gutters between columns and rows. No cropping of hair, fingers or magazines at grid borders or the image edge. Keep order: neutral, smile, surprised / worried, hurt, shy. No captions, numbers, cell lines, checkerboard, background glow, UI or extra objects. Strongly preserve the reference character; solve spacing only.
```

## tang-turnaround.webp

```text
Use case: identity-preserve. Asset type: ONE production character turnaround sheet for the original Chinese campus visual novel 湿性愈合. The provided image is the LOCKED character design: preserve face, hair, hair accessories, uniform colors and structure, eye style and thin precise anime outlines. Three full-body views laid out horizontally, left-to-right FRONT, exact LEFT SIDE PROFILE, BACK. Same character, same height and body proportions, head top and soles aligned, all shoes fully inside the canvas with comfortable margins. Neutral standing posture, feet shoulder width, relaxed arms and hands, ordinary age-appropriate everyday high-school clothing. Cream and forest-green zip tracksuit with double pale sleeve stripes, white round-neck shirt, navy long athletic trousers with pale stripes, simple ivory sneakers. Flat cel-color blocks with two-level shadows, clean original 2D Chinese galgame drawing matching reference, not a photo or painting. Pale warm IVORY SOLID background. No shadows, scenery, UI, character names, writing, labels, border, logos or watermark. Wide 3:2 landscape composition. This is an illustrator's model sheet, not a game screenshot. Maintain correct front-side-back rotational consistency.
许棠: the SAME girl repeated in the atlas reference, not six different girls. Dark-brown LONG hair in a LOW ponytail tied at nape with charcoal tie, wispy bangs, amber-brown eyes. Tiny unbranded charcoal compact camera on plain black strap at chest; two mint school-publication layout proofs held loosely at side. In back view the ponytail is low and the camera neck strap is visible, camera itself is in front of body.
```
