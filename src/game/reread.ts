import { recordLine, replay } from './engine';
import type { GameState, HistoryEntry } from './types';

// Only native replay proves that a paragraph belongs to the current route.
// Imported history, scores and the displayed entry text are never authorities.
export function rereadFrom(state: GameState, target: Pick<HistoryEntry, 'sceneId' | 'line'>): GameState {
  const current = replay(state.decisions, state.sceneId, state.line);
  const wasRead = recordLine(current).history.some(entry => entry.sceneId === target.sceneId && entry.line === target.line);
  if (!wasRead) throw new Error('只能重读当前路线已经到达的段落');
  // The first reachable prefix retains every choice before the target and none
  // of the choices the reader has yet to make again, including chapter bridges.
  for (let count = 0; count <= current.decisions.length; count++) {
    try { return replay(current.decisions.slice(0, count), target.sceneId, target.line); }
    catch { /* A later native choice may be required to reach this paragraph. */ }
  }
  throw new Error('无法恢复这段已读文字');
}
