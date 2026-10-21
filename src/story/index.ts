import { scenes as first, endingInfo as firstEndings } from './chapter1';
import { scenes as second } from './chapter2';
import { scenes as third } from './chapter3';
import type { Ending, Scene } from '../game/types';

const firstPictures: Record<string, { cg: Scene['cg']; cgFrom: number }> = {
  'end-together': { cg: 'window-open', cgFrom: 9 },
  'end-letter': { cg: 'unsigned-letter', cgFrom: 11 },
  'end-quiet': { cg: 'blank-page', cgFrom: 11 },
};
const firstRooms: Partial<Record<string, Scene['background']>> = {
  corridor: 'corridor', storm: 'rain-eaves', 'rain-both': 'rain-eaves',
  'rain-lin': 'rain-eaves', evening: 'bus-stop', club: 'clubroom',
  'draft-plain': 'clubroom', 'draft-safe': 'clubroom', misunderstanding: 'clubroom',
  'tang-interlude': 'clubroom', 'rain-chen': 'clubroom', 'end-together': 'clubroom',
};
export const scenes: Scene[] = [...first.map(scene => ({ ...scene, chapter: 1 as const,
  ...(firstRooms[scene.id] ? { background: firstRooms[scene.id] } : {}),
  ...firstPictures[scene.id], ...(scene.ending ? { continuation: 'c2-open' } : {}) })), ...second, ...third];
export const chapters = [
  { id: 1 as const, title: '生长痛', subtitle: '一张成绩单，一本笔记，三个没说完的下午。', background: 'campus', start: 'arrival' },
  { id: 2 as const, title: '显影', subtitle: '校刊试印，纸上的人也要拥有自己的声音。', background: 'clubroom', start: 'c2-open' },
  { id: 3 as const, title: '雨停以后', subtitle: '完成答应的事，再决定放学后想去的地方。', background: 'riverbank', start: 'c3-open' },
];
export const endingInfo: Record<Ending, { label: string; subtitle: string; badge: string }> = {
  ...firstEndings,
  'lin-final': { label: '写在页边', subtitle: '稿纸有了署名，明天靠窗的位置仍然留给你。', badge: '林见夏 · 最终结局' },
  'chen-final': { label: '轮到你休息', subtitle: '事情有人接手，陪伴终于没有待办事项。', badge: '陈知遥 · 最终结局' },
  'tang-final': { label: '留住这一束光', subtitle: '一张经过同意的照片，一个可以一起等待的黄昏。', badge: '许棠 · 最终结局' },
  'friends-final': { label: '我们这一页', subtitle: '把名字写在同一页，学会给彼此留下空间。', badge: '共同篇 · 最终结局' },
};
export const finalEndingIds: Ending[] = ['lin-final', 'chen-final', 'tang-final', 'friends-final'];
export const cgInfo = {
  'window-open': { title: '窗还开着', scene: 'end-together', description: '稿纸推到中间，撤开的手碰到袖口，谁也没有装作没发生。' },
  'unsigned-letter': { title: '一封没有署名的信', scene: 'end-letter', description: '折好的纸推到桌子中间，一句自己的话终于留下来。' },
  'blank-page': { title: '留白', scene: 'end-quiet', description: '暖饭团放在稿纸旁，空白没有被揉掉。' },
  'confirmed-proof': { title: '七点四十', scene: 'c2-confirm', description: '清单逐项看过，U盘和确认后的样张一起装袋。' },
  'proof': { title: '纸上少了一句', scene: 'c2-proof', description: '两版样张并排，漏掉的那一行被铅笔圈出。' },
  'lin-page': { title: '写在页边', scene: 'c3-lin-page', description: '见夏递来稿纸，笔记和钢笔留在窗边。' },
  'chen-rest': { title: '轮到你休息', scene: 'c3-chen-rest', description: '长椅上的知遥，终于没有待办清单。' },
  'tang-light': { title: '留住这一束光', scene: 'c3-tang-light', description: '许棠在江边，确认过同意才留下照片。' },
  'shared-print': { title: '我们这一页', scene: 'c3-shared-print', description: '校刊摊在长桌上，每个人都有自己的署名。' },
} as const;
