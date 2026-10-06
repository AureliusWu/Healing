import { replay, sceneMap } from './engine';
import type { Decision, GameState, Save, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = { textSpeed: 32, autoDelay: 2200, music: true, volume: 0.2, reducedMotion: false };
export const KEY = 'moist-healing:v1';
export const slots = ['auto', '1', '2', '3'] as const;
export type Slot = typeof slots[number];

export function encodeSave(state: GameState, date = new Date()): Save {
  return { schema: 1, game: 'moist-healing', savedAt: date.toISOString(), state };
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function decodeSave(raw: string): Save {
  if (raw.length > 2_000_000) throw new Error('存档文件过大');
  const value: unknown = JSON.parse(raw);
  if (!object(value) || value.schema !== 1 || value.game !== 'moist-healing' || typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt))) throw new Error('文件不是《湿性愈合》的存档');
  const state = value.state;
  if (!object(state) || state.schema !== 1 || state.storyVersion !== 'chapter1-v1' || typeof state.sceneId !== 'string' || !sceneMap.has(state.sceneId) || !Number.isInteger(state.line) || typeof state.line !== 'number' || state.line < 0 || state.line >= sceneMap.get(state.sceneId)!.lines.length || !Array.isArray(state.decisions) || state.decisions.length > 10) throw new Error('存档版本或剧情位置不兼容');
  const decisions: Decision[] = state.decisions.map(d => {
    if (!object(d) || typeof d.sceneId !== 'string' || typeof d.choiceId !== 'string') throw new Error('存档路线损坏');
    return { sceneId: d.sceneId, choiceId: d.choiceId };
  });
  return { schema: 1, game: 'moist-healing', savedAt: value.savedAt,
    state: replay(decisions, state.sceneId, state.line) };
}
export function writeSave(slot: Slot, state: GameState): Save {
  const save = encodeSave(state);
  localStorage.setItem(`${KEY}:save:${slot}`, JSON.stringify(save));
  return save;
}
export function readSave(slot: Slot): Save | null {
  try {
    const raw = localStorage.getItem(`${KEY}:save:${slot}`);
    return raw ? decodeSave(raw) : null;
  } catch { return null; }
}
export function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(`${KEY}:settings`);
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (!object(value)) return DEFAULT_SETTINGS;
    const number = (key: string, fallback: number, min: number, max: number) => typeof value[key] === 'number' && Number.isFinite(value[key]) ? Math.max(min, Math.min(max, value[key] as number)) : fallback;
    return { textSpeed: number('textSpeed', 32, 0, 80), autoDelay: number('autoDelay', 2200, 800, 6000), volume: number('volume', 0.2, 0, 1), music: typeof value.music === 'boolean' ? value.music : true, reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : false };
  } catch { return DEFAULT_SETTINGS; }
}
export function readEndings(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`${KEY}:endings`) ?? '[]');
    return Array.isArray(value) ? value.filter((x): x is string => ['together', 'letter', 'quiet'].includes(x)) : [];
  } catch { return []; }
}
