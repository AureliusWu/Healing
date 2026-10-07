import { chapters, cgInfo } from '../story';
import { replay, sceneMap } from './engine';
import { decodeSave, encodeSave, KEY, readEndings } from './storage';
import type { CgId, Ending, GameState, MusicId, Save } from './types';
import { scoreInfo } from './score';

function checkpoint(key: string): Save | null {
  try { const raw = localStorage.getItem(`${KEY}:${key}`); return raw ? decodeSave(raw) : null; } catch { return null; }
}
export function readChapter(chapter: 1 | 2 | 3): Save | null {
  const save = checkpoint(`chapter:${chapter}`);
  return save?.state.sceneId === chapters.find(item => item.id === chapter)!.start && save.state.line === 0 ? save : null;
}
export function readEnding(ending: Ending): Save | null {
  const save = checkpoint(`ending:${ending}`);
  return save && sceneMap.get(save.state.sceneId)?.ending === ending && save.state.line === 0 ? save : null;
}
function known<T extends string>(key: string, ids: T[]): T[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(`${KEY}:${key}`) ?? '[]');
    return Array.isArray(raw) ? [...new Set(raw.filter((id): id is T => typeof id === 'string' && ids.includes(id as T)))] : [];
  } catch { return []; }
}
export function readGallery(): CgId[] { return known('gallery', Object.keys(cgInfo) as CgId[]); }
export function readScores(): MusicId[] { return [...new Set<MusicId>(['rain', ...known('scores', Object.keys(scoreInfo) as MusicId[])])]; }
function union<T extends string>(key: string, old: T[], added: T[]) {
  const result = [...new Set([...old, ...added])];
  const raw = JSON.stringify(result);
  if (localStorage.getItem(`${KEY}:${key}`) !== raw) localStorage.setItem(`${KEY}:${key}`, raw);
  return result;
}
// Starts retain the actual preceding decisions, including after validated imports.
// A chapter label or an unlocked ending alone never fabricates a route.
export function rememberProgress(state: GameState, finished: boolean) {
  const scene = sceneMap.get(state.sceneId)!;
  for (const chapter of chapters.filter(item => item.id <= (scene.chapter ?? 1))) {
    if (!readChapter(chapter.id) || (state.sceneId === chapter.start && state.line === 0)) {
      const choices = state.decisions.filter(decision => (sceneMap.get(decision.sceneId)!.chapter ?? 1) < chapter.id);
      localStorage.setItem(`${KEY}:chapter:${chapter.id}`, JSON.stringify(encodeSave(replay(choices, chapter.start, 0))));
    }
  }
  const visited = [...new Set([...state.history.map(line => line.sceneId), state.sceneId])].map(id => sceneMap.get(id)!);
  const gallery = union('gallery', readGallery(), visited.flatMap(item => item.cg ? [item.cg] : []));
  const scores = union('scores', readScores(), visited.map(item => musicFor(item.id)));
  let endings = readEndings();
  if (finished && scene.ending) {
    endings = union('endings', endings, [scene.ending]);
    localStorage.setItem(`${KEY}:ending:${scene.ending}`, JSON.stringify(encodeSave(replay(state.decisions, scene.id, 0))));
  }
  return { gallery, scores, endings };
}
export function musicFor(id: string): MusicId {
  const scene = sceneMap.get(id)!;
  return scene.music ?? (scene.background === 'classroom' ? 'window' : 'rain');
}
