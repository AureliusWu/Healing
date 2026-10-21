import type { Background, CgId, Scene } from './types';

export const cgAt = (scene: Scene, line: number): CgId | undefined =>
  scene.cg && line >= (scene.cgFrom ?? 0) ? scene.cg : undefined;
export const backgroundAt = (scene: Scene, line: number): Background =>
  scene.id === 'evening' && line >= 13 ? 'bus-interior' : scene.background;

// Reconstruct exactly what the imported/replayed route has actually reached.
export function reachedCg(scene: Scene, history: readonly { sceneId: string; line: number }[], current?: number) {
  const reached = Math.max(current ?? -1, ...history.filter(item => item.sceneId === scene.id).map(item => item.line));
  return cgAt(scene, reached);
}
