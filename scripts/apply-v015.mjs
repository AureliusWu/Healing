import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const read = p => fs.readFileSync(p, 'utf8');
const write = (p, value) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, value);
};
const replace = (file, from, to) => {
  const source = read(file);
  if (!source.includes(from)) throw new Error(`Missing patch anchor in ${file}: ${from.slice(0, 90)}`);
  write(file, source.replace(from, to));
};
const replaceAll = (file, from, to) => {
  const source = read(file);
  if (!source.includes(from)) throw new Error(`Missing patch anchor in ${file}: ${from}`);
  write(file, source.split(from).join(to));
};

for (const file of ['package.json', 'package-lock.json']) {
  const data = JSON.parse(read(file));
  data.version = '0.1.5';
  if (data.packages?.['']) data.packages[''].version = '0.1.5';
  write(file, JSON.stringify(data, null, 2) + '\n');
}

write('src/useDisplayMode.ts', `import { useCallback, useEffect, useState } from 'react';

const portraitQuery = '(orientation: portrait) and (max-width: 900px) and (pointer: coarse)';
const coarseQuery = '(pointer: coarse)';

export function useDisplayMode(notify: (message: string) => void) {
  const [portrait, setPortrait] = useState(() => matchMedia(portraitQuery).matches);
  const [dismissed, setDismissed] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(() => !!document.fullscreenElement);
  const [immersive, setImmersive] = useState(false);
  const [busy, setBusy] = useState(false);
  const fullscreen = nativeFullscreen || immersive;

  useEffect(() => {
    const media = matchMedia(portraitQuery);
    const resize = () => setPortrait(media.matches);
    const change = () => {
      setNativeFullscreen(!!document.fullscreenElement);
      if (document.fullscreenElement) setImmersive(false);
    };
    media.addEventListener('change', resize);
    document.addEventListener('fullscreenchange', change);
    return () => {
      media.removeEventListener('change', resize);
      document.removeEventListener('fullscreenchange', change);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('immersive-reading', immersive);
    return () => document.documentElement.classList.remove('immersive-reading');
  }, [immersive]);

  const toggleFullscreen = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (immersive) {
        setImmersive(false);
        return;
      }
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (matchMedia(coarseQuery).matches) {
        setImmersive(true);
        requestAnimationFrame(() => window.scrollTo(0, 1));
        return;
      }

      if (!document.documentElement.requestFullscreen || document.fullscreenEnabled === false) {
        notify('当前浏览器不支持系统全屏。可以继续使用沉浸阅读；桌面版也可按 F11。');
        return;
      }

      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      window.scrollTo(0, 0);
    } catch {
      notify(document.fullscreenElement ? '暂时无法退出全屏，可按 Esc。' : '暂时无法进入全屏。');
    } finally {
      setBusy(false);
    }
  }, [busy, immersive, notify]);

  return {
    fullscreen,
    busy,
    showRotationHint: portrait && !dismissed,
    dismissRotationHint: () => setDismissed(true),
    toggleFullscreen,
  };
}

export type DisplayMode = ReturnType<typeof useDisplayMode>;
`);

replace("src/game/types.ts",
  "export type Character = 'lin' | 'chen';",
  "export type Character = 'lin' | 'chen' | 'tang';"
);

replace("src/App.tsx",
  "const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}.webp`;",
  "const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}${name === 'tang' ? '.svg' : '.webp'}`;"
);
replace("src/App.tsx",
  "{(['lin', 'chen'] as const).map(id =>",
  "{(['lin', 'chen', 'tang'] as const).map(id =>"
);
replace("src/App.tsx",
  "<p>《湿性愈合》是一部关于青春期、校园与靠近的原创视觉小说。</p>",
  "<p>《湿性愈合》是一部关于青春期、校园与靠近的原创视觉小说。</p><p>角色年龄设定：本作所有登场角色均年满18周岁；学生角色均为18岁或以上。</p>"
);
replace("src/App.tsx",
  "你扮演高二学生程屿",
  "你扮演已满18岁的高二学生程屿"
);

replaceAll('src/story/chapter1.ts', '十七岁的秋天', '十八岁的秋天');
replaceAll('src/story/chapter1.ts', '十七岁的明天很多', '十八岁的明天很多');
replace('src/story/chapter1.ts',
  '旁白｜贺川把一袋还热着的饭团塞给我。他的伞歪了一半，书包拉链上挂着一个掉漆的篮球。',
  '旁白｜贺川和我同岁，十八岁。他把一袋还热着的饭团塞给我，伞歪了一半，书包拉链上挂着一个掉漆的篮球。'
);
replace('src/story/chapter1.ts',
  "id: 'misunderstanding', title: '被翻开的那一页', location: '文学社', time: '周一 · 18:10', background: 'classroom', character: 'lin', next: 'storm',",
  "id: 'misunderstanding', title: '被翻开的那一页', location: '文学社', time: '周一 · 18:10', background: 'classroom', character: 'lin', next: 'tang-interlude',"
);

const tangScene = `  {
    id: 'tang-interlude', title: '版面之外', location: '文学社 · 门口', time: '周一 · 18:17', background: 'classroom', character: 'tang', next: 'storm',
    lines: lines(\`旁白｜见夏和知遥一前一后出了门。我留在原地，把最后两册旧刊塞回柜子，门外忽然传来相机带碰到门框的轻响。
许棠｜我是不是回来得不是时候？
旁白｜许棠是文学社负责排版和摄影的成员，和我们同届，七月刚满十八岁。她夹着几张校刊样张，胸前的小相机还没收进包里。
程屿｜你怎么现在才回来？
许棠｜印刷店把纸样裁错了。我跟老板争了二十分钟，最后发现是我把尺寸写反了。
旁白｜她把样张铺在桌上，没有问刚才发生了什么，只把最中间一页往我这边推。
许棠｜你看，这里我故意没放图。
程屿｜空这么大，不会浪费吗？
许棠｜排版里最难的不是塞满，是知道哪里要留白。留白不是没内容，是给下一句话留位置。
旁白｜我看着那一块没有字的地方，忽然想起见夏的笔记本，也想起知遥刚才折起来的纸条。
许棠｜她们两个都走了？
程屿｜嗯。话没说完。
许棠｜那就别替她们补结论。你能做的，是下次有人开口的时候，别急着把空白填掉。
旁白｜她把样张重新夹好，顺手关掉文学社的灯。走廊尽头的雨声一下子变得很清楚。
许棠｜走吧。再晚一点，门卫真要来赶人了。
旁白｜我背起书包。那句“等一下”还没有说出口，但它已经不再只是一句拖延。\`),
  },
`;

{
  const file = 'src/story/chapter1.ts';
  const source = read(file);
  const marker = "  {\n    id: 'storm', title: '雨檐下'";
  if (!source.includes(marker)) throw new Error('Missing storm scene anchor');
  write(file, source.replace(marker, tangScene + marker));
}

replace('src/story/chapter1.ts',
`export const characterInfo = {
  lin: { name: '林见夏', subtitle: '想写一篇不必证明有用的文章。', role: '靠窗的邻座 · 文学社', quote: '“你还没想好，也可以先留白。”' },
  chen: { name: '陈知遥', subtitle: '习惯把所有人的事情，排在自己前面。', role: '高二（四）班班长', quote: '“如果只是想休息，算不算一个好理由？”' },
};`,
`export const characterInfo = {
  lin: { name: '林见夏', subtitle: '18岁 · 165cm · 49kg · 生日 5月22日。想写一篇不必证明有用的文章。', role: '靠窗的邻座 · 文学社', quote: '“你还没想好，也可以先留白。”' },
  chen: { name: '陈知遥', subtitle: '18岁 · 168cm · 52kg · 生日 2月11日。习惯把所有人的事情，排在自己前面。', role: '高二（四）班班长', quote: '“如果只是想休息，算不算一个好理由？”' },
  tang: { name: '许棠', subtitle: '18岁 · 166cm · 50kg · 生日 7月17日。负责把散乱的稿子排成一页。', role: '文学社 · 排版 / 摄影', quote: '“留白不是没内容，是给下一句话留位置。”' },
};`
);

const tangSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536" role="img" aria-labelledby="title desc">
<title id="title">许棠角色立绘</title>
<desc id="desc">深棕低马尾、琥珀棕眼睛，米白与墨绿运动校服，胸前挂相机并抱着排版样张。</desc>
<defs>
  <linearGradient id="hair" x1="0" x2="1"><stop stop-color="#2b2526"/><stop offset="1" stop-color="#51413a"/></linearGradient>
  <linearGradient id="jacket" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f2efe4"/><stop offset="1" stop-color="#ded9c9"/></linearGradient>
  <linearGradient id="green" x1="0" x2="1"><stop stop-color="#365844"/><stop offset="1" stop-color="#56745d"/></linearGradient>
</defs>
<g stroke="#433a37" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
  <path fill="url(#hair)" d="M270 278c30-137 143-213 266-213 157 0 282 114 277 303-2 91-38 171-83 228-38 48-48 104-36 163l-104 23-239-28-77-129c-59-74-73-222-4-347z"/>
  <path fill="#f4d8c5" d="M346 304c22-94 104-149 196-149 108 0 191 74 191 183 0 106-79 203-184 219-106 17-207-55-222-163-4-31 2-61 19-90z"/>
  <path fill="url(#hair)" d="M319 300c30-118 125-184 229-184 94 0 172 51 207 139-67-26-118-74-151-121-37 73-131 122-285 166z"/>
  <path fill="none" d="M326 298c-17 88 2 187 66 254M730 282c34 101 17 190-45 271"/>
  <ellipse fill="#8b6946" cx="446" cy="374" rx="31" ry="25"/><ellipse fill="#8b6946" cx="625" cy="366" rx="31" ry="25"/>
  <ellipse fill="#fff" stroke="none" cx="456" cy="366" rx="8" ry="7"/><ellipse fill="#fff" stroke="none" cx="635" cy="358" rx="8" ry="7"/>
  <path fill="none" d="M508 460c29 22 58 20 84-3"/>
  <path fill="#e8b9a8" stroke="none" d="M451 427c-38 7-66-2-80-20 22-10 51-11 80 20zm168-3c35 3 61-6 75-22-22-8-48-6-75 22z" opacity=".38"/>
  <path fill="#f4d8c5" d="M485 534l11 112h109l10-119"/>
  <path fill="url(#jacket)" d="M286 733c63-82 140-121 217-123h99c99 5 184 52 230 142 39 77 59 272 68 475H153c9-213 49-410 133-494z"/>
  <path fill="url(#green)" d="M286 733c35-44 78-77 126-97l77 104-81 487H153c9-213 49-410 133-494zm546 19c-34-59-83-96-137-117l-86 105 86 487h205c-9-203-29-398-68-475z"/>
  <path fill="#fff" d="M486 643l55 76 61-76 87 584H402z"/>
  <path fill="none" d="M541 719v505M407 761l-84 122M686 765l89 116"/>
  <rect fill="#3f4647" x="454" y="822" width="185" height="132" rx="25"/>
  <circle fill="#252a2b" cx="548" cy="888" r="49"/><circle fill="#657070" cx="548" cy="888" r="29"/>
  <path fill="none" d="M475 820c-2-76 142-77 145 0"/>
  <path fill="#eee8d9" d="M650 943l164 42-52 205-169-49z"/>
  <path fill="#c7d7c4" d="M677 989l102 26-8 31-102-26z" stroke="none"/>
  <path fill="#93ad96" d="M666 1040l87 22-7 27-87-22zm-13 50l106 27-7 27-106-27z" stroke="none"/>
  <path fill="#f4d8c5" d="M365 960c-45 17-66 72-44 112 23 43 72 42 110 8l75-70-57-65z"/>
  <path fill="#f4d8c5" d="M718 942c54 2 89 47 75 92-13 44-60 54-105 32l-80-44 39-78z"/>
  <path fill="url(#hair)" d="M737 237c91-4 165 58 184 151 15 76-3 162-47 233-28-83-79-137-147-164z"/>
  <path fill="none" d="M770 293c48 36 76 86 85 153"/>
  <circle fill="#c3d8c5" cx="340" cy="253" r="19"/><path fill="none" d="M340 234v38m-19-19h38"/>
</g>
</svg>
`;
write('public/art/tang.svg', tangSvg);

{
  const file = 'src/fullscreen-reading.css';
  let css = read(file);
  const block = `

/* v0.1.5 mobile immersive mode: avoids Android Chrome's native fullscreen education bubble. */
html.immersive-reading,
html.immersive-reading body { width: 100%; height: 100%; overflow: hidden; overscroll-behavior: none; background: #18221c; }
html.immersive-reading .app { position: fixed; inset: 0; width: 100vw; height: 100dvh; overflow: hidden; }

/* Xu Tang is a framed vector cut-in portrait rather than a full-body alpha sprite. */
.game-screen[data-scene='tang-interlude'] .scene-character {
  height: auto;
  width: min(39vw, 470px);
  max-width: 42vw;
  max-height: 66dvh;
  left: auto;
  right: 5vw;
  bottom: 20dvh;
  transform: none;
  object-fit: contain;
  border-radius: 26px;
  filter: drop-shadow(0 18px 36px rgba(21, 34, 25, .24));
}
@media (max-width: 760px) and (orientation: landscape) {
  .game-screen[data-scene='tang-interlude'] .scene-character {
    width: min(35vw, 300px);
    max-height: 58dvh;
    right: 5vw;
    bottom: 27dvh;
  }
}
`;
  if (!css.includes('v0.1.5 mobile immersive mode')) css += block;
  write(file, css);
}

replace('README.md', '当前版本 **v0.1.3**', '当前版本 **v0.1.5**');
replace('README.md',
  '[在线游玩 / 安装 PWA](https://aureliuswu.github.io/Project1/) · [下载 Windows / PWA](https://github.com/AureliusWu/Project1/releases/tag/v0.1.3)',
  '[在线游玩 / 安装 PWA](https://aureliuswu.github.io/Project1/) · [下载 Windows / PWA](https://github.com/AureliusWu/Project1/releases/tag/v0.1.5)'
);
replace('README.md', '与林见夏和陈知遥相遇', '与林见夏、陈知遥和许棠相遇');
replace('README.md',
  '- 两位主要角色的原创二维 AI 立绘、两张重新绘制的二维校园背景。',
  '- 三位主要女角色的二维立绘 / 切入立绘、两张重新绘制的二维校园背景；角色档案包含年龄、生日、身高与体重。'
);
replace('README.md',
  '- 独立的场景与底部阅读区：文字、选择和工具不覆盖画面；隐藏界面可完整欣赏背景与立绘。',
  '- 全窗口场景画面 + 底部一体化半透明阅读层；透明度可调，隐藏界面可完整欣赏背景与立绘。'
);
replace('README.md',
  '- 标题页、阅读界面与设置提供全屏入口，支持的触屏浏览器会尝试横屏锁定；失败时可继续阅读。',
  '- 标题页、阅读界面与设置提供全屏入口；手机网页采用页面内沉浸模式，避免 Android Chrome 无法由页面关闭的系统全屏提示；桌面继续使用系统全屏。'
);

write('docs/STORY.md', `# 第一章：生长痛

## 创作方向

江城七中，高二，九月。玩家视角为程屿。叙事聚焦考试与家庭期待、表达困难、朋友之间的边界，以及克制的初次心动。标题“湿性愈合”作为情感隐喻，不将角色关系写成治病或治疗承诺。

**年龄规则：本作所有登场角色均年满 18 周岁。** 学生角色在故事发生时均为 18 岁或以上；任何后续章节、新角色、立绘与宣传图都必须遵守这一设定。

林见夏：18 岁，5 月 22 日生日，165cm / 49kg。靠窗的邻座，文学社成员，想写一篇不需要证明有用的文章。

陈知遥：18 岁，2 月 11 日生日，168cm / 52kg。班长，习惯替所有人收拾残局，正在学会说自己需要休息。

许棠：18 岁，7 月 17 日生日，166cm / 50kg。文学社排版与摄影成员，习惯从版面、取景和“留白”理解人与人之间的距离。

贺川：18 岁。主角朋友，以具体的小事表达关心。

程屿：18 岁。玩家视角角色。

## 四次选择

| 节点 | 选择数 | 影响 |
| --- | --- | --- |
| 靠窗的空位 | 3 | 是否表达考试焦虑，或主动与知遥建立联系 |
| 午休的十分钟 | 3 | 见夏的写作困惑、知遥的过度承担、独处 |
| 旧刊室的稿纸 | 2 | 是否以第一人称写下真实困扰 |
| 雨檐下 | 3 | 共同表达、陪见夏到车站、陪知遥关窗 |

3 × 3 × 2 × 3 = 54 种组合，所有分支在晚间电话合流，再解析章节结局。属性是隐藏的创作模型：坦诚、见夏联系、知遥联系。界面不显示好感分数，也不把单一对象设为“满分答案”。

v0.1.5 在误会与雨檐选择之间新增线性场景《版面之外》。许棠带回校刊样张，用“排版留白”回应本章主题，但不会增加隐藏属性或改变既有 54 条选择组合，因此旧存档与原结局判定继续兼容。

## 完整结局

- **窗还开着 / 共鸣**：三人愿意表达并调整边界，第二天共同完成投稿。程屿与见夏承认了靠近的瞬间；成长中的困难仍存在。
- **一封没有署名的信 / 靠近**：一次真诚留下了可以继续的关系，两位女生自己澄清误会，主角写下一句属于自己的话。
- **留白**：矛盾暂时被客气地搁置，主角尚未把话说完；贺川仍带来早饭，故事保留再次表达的空间。

章节结局在阅读最后一段后记入回忆手册。剧本当前全部存放于 \`src/story/chapter1.ts\`。

## 后续可扩展

第二章可围绕校刊印刷、运动会与家长会，继续处理“被看见”与“边界”的主题。新增章节应继承第一章选择序列，而非仅继承一个结局标签。
`);

write('docs/prompts/ART-v3.md', `# v0.1.5 · 许棠角色视觉规范

日期：2026-10-07。

## 角色设定

许棠，18 岁，文学社排版 / 摄影成员。166cm / 50kg，生日 7 月 17 日。深棕长发低马尾、琥珀棕眼睛，性格温和但说话直接。校服延续林见夏 / 陈知遥的米白 + 墨绿校园运动服体系；视觉识别物为胸前的小型相机和手里的校刊排版样张。

## 生产提示词基线

\`\`\`text
原创中国校园视觉小说角色许棠，18岁成年女性，高中生。深棕色长发低马尾，琥珀棕色眼睛，温和但清醒的表情。穿与现有角色统一的米白与墨绿拼色宽松校园运动夹克、白色圆领T恤、藏蓝运动长裤。胸前挂一台小型无品牌相机，手中夹几张浅绿色几何排版样张。清晰二维国G视觉小说立绘，纤细轮廓线、平涂色块、两级赛璐璐阴影、简化衣褶、自然成人比例。头顶到膝下，透明alpha背景，无文字、无UI、无环境、无水印。
\`\`\`

本轮 image_gen 多次出现“自动生成完整 VN 截图而非透明单人立绘”的构图漂移，因此正式包先采用同一角色设计的原创透明 SVG 切入立绘 \`public/art/tang.svg\`，确保工程可控、体积小、PWA 离线稳定。后续获得满足上述规范的透明位图后，只替换该资产，不改变角色 ID、剧情数据或存档结构。
`);

{
  const p = 'docs/production/ART-ASSETS.json';
  const data = JSON.parse(read(p));
  data.prompts = 'docs/prompts/ART-v3.md';
  const bytes = Buffer.byteLength(tangSvg);
  const sha256 = crypto.createHash('sha256').update(tangSvg).digest('hex');
  const existing = data.assets.findIndex(a => a.id === 'tang');
  const entry = { id: 'tang', path: 'public/art/tang.svg', kind: 'sprite-vector', width: 1024, height: 1536, bytes, sha256 };
  if (existing >= 0) data.assets[existing] = entry; else data.assets.push(entry);
  write(p, JSON.stringify(data, null, 2) + '\n');
}

write('docs/releases/v0.1.5.md', `# v0.1.5 · 留白之外

本次更新同时修复手机全屏体验、推进第一章剧情，并补齐角色年龄与人物资料。

## 主要变化

- 修复 Android / Chrome 手机网页进入原生 Fullscreen API 后出现系统“如何退出全屏”提示且页面无法主动关闭的问题。触屏网页端改为页面内沉浸模式；桌面端继续使用浏览器原生全屏。安装 PWA 本身已无浏览器地址栏，也不再额外触发该系统提示。
- 第一章在《被翻开的那一页》和《雨檐下》之间新增《版面之外》场景。文学社新角色许棠正式出场，剧情围绕“留白是给下一句话留位置”继续推进。
- 新增许棠角色切入立绘，并保存可复用角色视觉规范。
- 角色面板新增许棠；林见夏、陈知遥、许棠补充年龄、生日、身高、体重等人物资料。
- 世界观规则明确：本作所有登场角色均年满 18 周岁。程屿、贺川及三位主要女角色在第一章发生时均为 18 岁。
- README、故事设定、素材清单与生产提示词同步更新。

## 兼容性

- 存档 schema 保持为 1，\`storyVersion\` 不变。
- 四个关键选择、54 条组合和三种结局判定均保持不变。
- 旧存档可以继续读取；经过新增线性场景时会自然进入新剧情，不需要重开。

## Windows / PWA

Windows 与 PWA 使用同一剧情和角色数据。PWA 新资产进入原子离线缓存；正式发布后继续执行桌面、手机横屏与离线重开验证。

## 验证

发布流水线需通过逻辑测试、生产构建、浏览器 E2E、Windows 源码启动、Windows x64 安装版 / 便携版打包与打包后启动检查，并在 Pages 部署后执行线上与离线 smoke test。
`);
{
  const p = 'docs/releases/README.md';
  let text = read(p);
  const row = '| v0.1.5 | 2026-10-07 | 正式发布 | [留白之外](v0.1.5.md) |';
  if (!text.includes(row)) {
    text = text.replace('| v0.1.4 | 2026-10-07 | 正式发布 | [让画面真正铺满](v0.1.4.md) |', row + '\n| v0.1.4 | 2026-10-07 | 正式发布 | [让画面真正铺满](v0.1.4.md) |');
  }
  write(p, text);
}

{
  const p = 'tests/engine.test.ts';
  let text = read(p);
  const anchor = "  it('every authored scene appears on at least one reachable route', () => {";
  if (!text.includes('keeps the adult cast rule')) {
    const test = `  it('keeps the adult cast rule and the new Xu Tang scene in the authored graph', () => {
    expect(scenes.some(scene => scene.id === 'tang-interlude' && scene.character === 'tang')).toBe(true);
    const source = scenes.flatMap(scene => scene.lines).map(line => line.text).join('\\n');
    expect(source).not.toContain('十七岁的秋天');
  });
`;
    text = text.replace(anchor, test + anchor);
  }
  write(p, text);
}

console.log('v0.1.5 patch applied');
