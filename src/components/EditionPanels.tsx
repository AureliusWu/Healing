import { useState } from 'react';
import { Icon } from './Icon';
import { chapters, cgInfo, endingInfo, finalEndingIds } from '../story';
import { readChapter, readEnding } from '../game/progress';
import { scoreInfo } from '../game/score';
import type { CgId, Ending, MusicId, Save } from '../game/types';

const art = (id: string) => `${import.meta.env.BASE_URL}art/${id}.webp`;
export function ChapterMenu({ begin, load }: { begin: () => void; load: (save: Save) => void }) {
  return <><div className="chapter-list">{chapters.map(chapter => {
    const save = readChapter(chapter.id), available = chapter.id === 1 || !!save;
    return <button className="chapter-card" key={chapter.id} disabled={!available} onClick={() => chapter.id === 1 ? begin() : save && load(save)}><img src={art(chapter.background)} alt="" /><div><span className="eyebrow">CHAPTER 0{chapter.id} · {available ? '可阅读' : '读完前章后开启'}</span><h3>{chapter.title}</h3><p>{chapter.subtitle}</p><small>{chapter.id === 1 ? '四次选择 · 三个章节结局' : chapter.id === 2 ? '承接第一章的真实选择' : '四个最终结局 · 四张事件画面'}</small></div><Icon name="arrow" /></button>;
  })}</div><p className="soft-note">三章故事已完整收录。后续章节从实际到达过的章首重读，保留之前的选择。旧存档也能继续。</p></>;
}

export function MemoryBook({ endings, gallery, scores, load, audition, onAudition }: {
  endings: string[]; gallery: CgId[]; scores: MusicId[]; load: (save: Save) => void;
  audition: MusicId | null; onAudition: (id: MusicId | null) => void;
}) {
  const [picture, setPicture] = useState<CgId | null>(null);
  if (picture) return <div className="cg-view"><button className="secondary" onClick={() => setPicture(null)}>返回回忆手册</button><figure><img src={art(`cg-${picture}`)} alt={cgInfo[picture].description} /><figcaption><strong>{cgInfo[picture].title}</strong><span>{cgInfo[picture].description}</span></figcaption></figure><p className="soft-note">横屏可以看见完整画面。</p></div>;
  const cards = (ids: Ending[]) => <div className="memory-list">{ids.map((id, index) => {
    const info = endingInfo[id], unlocked = endings.includes(id), save = unlocked ? readEnding(id) : null;
    return <article key={id} className={unlocked ? 'memory unlocked' : 'memory'}><span>0{index + 1}</span><div><small>{unlocked ? info.badge : '尚未相遇'}</small><h3>{unlocked ? info.label : '未翻开的那一页'}</h3><p>{unlocked ? info.subtitle : '继续阅读，在放学路口留下自己的选择。'}</p>{save && <button className="memory-replay" onClick={() => load(save)}>重读这段结局 <Icon name="arrow" size={14} /></button>}</div><Icon name={unlocked ? 'check' : 'book'} /></article>;
  })}</div>;
  return <div className="edition-memories"><p className="soft-note">最终结局 {finalEndingIds.filter(id => endings.includes(id)).length} / 4 · 事件画面 {gallery.length} / 4。回忆留在当前设备，也可从存档恢复沿途画面。</p>
    <h3 className="memory-heading">雨停以后</h3>{cards(finalEndingIds)}<h3 className="memory-heading">第一章的停顿</h3>{cards(['together', 'letter', 'quiet'])}
    <h3 className="memory-heading">留在这一页的画面</h3><div className="cg-grid">{(Object.keys(cgInfo) as CgId[]).map(id => <button className="cg-card" key={id} disabled={!gallery.includes(id)} onClick={() => setPicture(id)}>{gallery.includes(id) ? <img src={art(`cg-${id}`)} alt={cgInfo[id].description} /> : <span className="cg-placeholder"><Icon name="book" size={32} /></span>}<strong>{gallery.includes(id) ? cgInfo[id].title : '尚未翻开的画面'}</strong></button>)}</div>
    <h3 className="memory-heading">音乐鉴赏</h3><p className="soft-note">到达对应场景后开启。试听临时开启音乐，离开手册后恢复阅读设置。</p><div className="score-list">{(Object.entries(scoreInfo) as [MusicId, (typeof scoreInfo)[MusicId]][]).map(([id, score]) => <button className={audition === id ? 'score-card active' : 'score-card'} key={id} disabled={!scores.includes(id)} aria-pressed={audition === id} onClick={() => onAudition(audition === id ? null : id)}><Icon name={audition === id ? 'pause' : 'play'} size={19} /><span><strong>{scores.includes(id) ? score.title : '尚未听见的音符'}</strong><small>{scores.includes(id) ? score.description : '继续阅读后开启。'}</small></span></button>)}</div>
  </div>;
}
export function Credits() {
  return <div className="credits-copy"><span className="eyebrow">MOIST HEALING · COMPLETE EDITION</span><h2>谢谢你读到这里。</h2><p>从九月的成绩单到十月印出的这一页，故事中的人留下可以继续说的话，也学会给彼此一些时间。</p><dl><div><dt>创作与制作</dt><dd>AureliusWu 与 AI 协作</dd></div><div><dt>剧情</dt><dd>《生长痛》《显影》《雨停以后》</dd></div><div><dt>角色与场景美术</dt><dd>AI 生成原创素材 · v0.1.4 美术规范</dd></div><div><dt>音乐与声音</dt><dd>六首原创程序配乐 · 雨声与操作提示</dd></div><div><dt>字体</dt><dd>Story Serif，基于 Noto Serif SC · SIL Open Font License</dd></div><div><dt>阅读与进度</dt><dd>离线 PWA / Windows · 本地存档与 JSON 迁移</dd></div></dl><p>感谢把纸接出机器的人、等在车站的人，以及愿意让一段话慢一点被听懂的人。</p><p className="soft-note">《湿性愈合》v{__APP_VERSION__}<br />原创校园视觉小说 · 三章完结</p></div>;
}
