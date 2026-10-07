import type { Background, Expression, Line, Scene } from '../game/types';

export function lines(text: string): Line[] {
  return text.trim().split('\n').map(line => {
    const divider = line.indexOf('｜');
    const speaker = divider < 0 ? '旁白' : line.slice(0, divider);
    const match = speaker.match(/^(.*)\[(neutral|smile|surprised|worried|hurt|shy)\]$/);
    return { speaker: match?.[1] ?? speaker, text: divider < 0 ? line : line.slice(divider + 1), ...(match ? { expression: match[2] as Expression } : {}) };
  });
}
const locations: Record<Background, string> = { classroom: '高二（3）班', campus: '江城七中', clubroom: '旧刊室', home: '程屿家', printshop: '文印室', riverbank: '江边步道' };
export function scene(chapter: 2 | 3, id: string, title: string, background: Background, text: string, details: Partial<Omit<Scene, 'id' | 'lines' | 'chapter'>>): Scene {
  return { id, chapter, title, background, location: locations[background], time: chapter === 2 ? '九月下旬 · 放学后' : '十月 · 放学后', lines: lines(text), ...details };
}
