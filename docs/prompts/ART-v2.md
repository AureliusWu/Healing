# v0.1.3 · 二维重绘

日期：2026-10-07。使用内置 image_gen 编辑工具。输入均为 `ddbfb907914415b849562bf2649be9e318dc7fef` 对应的原有 `public/art/*.webp`，保留构图与人物识别特征。两张背景与两位角色分别调用，最终采用的完整提示词如下。资源编码与实际尺寸见 `docs/production/ART-ASSETS.json`。

### campus.webp

```text
Use case: style-transfer. Redraw the edit target from scratch as a polished original Chinese campus visual novel asset. Strongly reduce realism: crisp fine anime ink outlines, broad flat color shapes, two or three cel-shading tones, deliberately simplified details. Clearly hand-drawn 2D animation / galgame art, warm and emotionally restrained. No photorealistic textures, no oil painting, no watercolor grain, no 3D rendering, no photographic depth of field, no microdetail, no text, logo, watermark or UI. Input image 1 is the edit target and composition reference only. Preserve the same campus geography: red athletics track curving on the left, old three-storey cream school building with green window frames on the right, camphor trees, bench on the lower right, wet walkway after early autumn rain, distant Jiangcheng skyline. Landscape 16:9 background, empty, no people. Use cel-painted stylized canopy clusters rather than individual realistic leaves, clean geometry and subtle blue-green broad puddle reflections rather than mirror photography. Muted mint greens, soft ivory, dusty coral track and pale sky blue, gently brighter than the original. Quiet September afternoon. Keep the horizon and visual interest in the upper and middle portions; retain open central walkway for foreground characters. The entire frame is artwork; add no blank dialogue strip.
```

### classroom.webp

```text
Use case: style-transfer. Redraw the edit target from scratch as a polished original Chinese campus visual novel asset. Strongly reduce realism: crisp fine anime ink outlines, broad flat color shapes, two or three cel-shading tones, deliberately simplified details. Clearly hand-drawn 2D animation / galgame art, warm and emotionally restrained. No photorealistic textures, no oil painting, no watercolor grain, no 3D rendering, no photographic depth of field, no microdetail, no text, logo, watermark or UI. Input image 1 is the edit target and composition reference only. Preserve the layout: empty Chinese high-school classroom, tall windows on the left, green trees outside, billowing light ivory curtain, rows of wooden desks and muted blue chairs, green blank blackboard on the right back wall, pothos and a closed notebook on the front left desk, ceiling tube lights and fans. Landscape 16:9. Simplify the furniture, foliage, reflected light and ceiling into readable drawn shapes with calm thin outlines. Flat cel-painted surfaces, two-tone sun patches, no realistic wood grain or glossy floor reflections. Soft mint, warm cream, dusty blue, light amber afternoon. Clean, intimate, nostalgic but definitely animated. Keep the upper-middle region clear for a character. The whole frame is background artwork; no people, no text and no UI.
```

### lin.webp

```text
将输入图片中的原创角色林见夏重新绘制为清晰的二维动画立绘。保持人物身份与姿势：深棕色齐肩短发、轻薄刘海、左侧一枚薄荷绿矩形发夹、棕色眼睛、安静的微笑，双手在腰前抱着米色笔记本，略微侧身，脸朝向观众。保持宽松的米白与墨绿拼色中国校园运动夹克、白色圆领T恤、藏蓝运动长裤。新的美术风格使用干净纤细的轮廓线、明显的平涂色块、两级赛璐璐阴影、简化的鼻子和嘴、稍大而有神的动画眼睛，头发为成组的色块与大块高光，衣褶简洁利落。温柔清新的国风校园视觉小说角色质感。不要沿用原图的水彩笔触和写实细节。竖版2:3画幅，画出完整头顶到膝盖下方，双手完整自然，四周保留少量透明边距。真正透明的alpha背景，不要环境、不画投影、不画渐变底、不画棋盘格、不添加文字或界面。
```

### chen.webp

```text
将输入图片中的原创角色陈知遥重新绘制为清晰的二维动画立绘。保持人物身份与姿势：栗棕色高马尾、米白色发圈、轻薄刘海、棕色眼睛、自信而友好的微笑，左臂抱着三本旧校刊，右手轻轻放在最上面的刊物上，略微侧身，脸朝向观众。保持宽松的米白与墨绿拼色中国校园运动夹克、白色圆领T恤、藏蓝运动长裤。校刊封面采用浅绿几何图形，没有文字。新的美术风格使用干净纤细的轮廓线、明显的平涂色块、两级赛璐璐阴影、简化的鼻子和嘴、稍大而有神的动画眼睛，头发为成组的色块与大块高光，衣褶简洁利落。与短发角色林见夏属于同一款清新校园视觉小说的统一画风。不要沿用原图的水彩笔触和写实细节。竖版2:3画幅，画出完整头顶到膝盖下方，双手完整自然，四周保留少量透明边距。真正透明的alpha背景，不要环境、不画投影、不画渐变底、不画棋盘格、不添加文字或界面。
```

### 立绘透明边缘清理

使用上面得到的两位角色作为编辑目标，分别调用内置工具，保留透明背景。第二步最终提示词：

```text
undefined
```

对应流程：原有角色 → 二维重绘 → 透明边缘清理 → 人工验收 → `scripts/prepare-art.py` → 项目资源。
