import { describe, expect, it } from 'vitest';
import { advance, choose, endingFor, getScene, newGame, replay, sceneMap } from '../src/game/engine';
import { decodeSave, encodeSave } from '../src/game/storage';
import { scenes } from '../src/story/chapter1';
import type { GameState } from '../src/game/types';

function routes(state: GameState = newGame()): GameState[] {
  let cursor = state;
  for (let step = 0; step < 1000; step++) {
    const scene = getScene(cursor);
    if (cursor.line === scene.lines.length - 1) {
      if (scene.ending) return [cursor];
      if (scene.choices) return scene.choices.flatMap(choice => routes(choose(cursor, choice.id)));
    }
    cursor = advance(cursor);
  }
  throw new Error('Route never terminated');
}
const allRoutes = routes();

describe('complete chapter graph', () => {
  it('has unique scenes, valid destinations, and readable paragraphs', () => {
    expect(sceneMap.size).toBe(scenes.length);
    for (const scene of scenes) {
      expect(scene.lines.length).toBeGreaterThan(0);
      expect(scene.lines.every(line => !!line.speaker && !!line.text)).toBe(true);
      expect(Number(!!scene.next) + Number(!!scene.choices) + Number(!!scene.resolve) + Number(!!scene.ending)).toBe(1);
      if (scene.next) expect(sceneMap.has(scene.next)).toBe(true);
      for (const choice of scene.choices ?? []) expect(sceneMap.has(choice.next)).toBe(true);
    }
  });
  it('every one of the 54 choice combinations terminates; all three endings are reachable', () => {
    expect(allRoutes).toHaveLength(54);
    expect(new Set(allRoutes.map(route => getScene(route).ending))).toEqual(new Set(['together', 'letter', 'quiet']));
    expect(allRoutes.every(route => route.decisions.length === 4)).toBe(true);
  });
  it('restores the original high-school autumn while keeping Xu Tang on a reachable route', () => {
    expect(scenes.some(scene => scene.id === 'tang-interlude' && scene.character === 'tang')).toBe(true);
    const source = scenes.flatMap(scene => scene.lines).map(line => line.text).join('\n');
    expect(source).toContain('十七岁的秋天');
    expect(source).not.toContain('十八岁');
  });
  it('every authored scene appears on at least one reachable route', () => {
    const visited = new Set(allRoutes.flatMap(route => [...route.history.map(entry => entry.sceneId), route.sceneId]));
    expect(visited).toEqual(new Set(scenes.map(scene => scene.id)));
  });
  it('does not change the original state and refuses choices before they appear', () => {
    const state = newGame();
    const copy = structuredClone(state);
    advance(state);
    expect(state).toEqual(copy);
    expect(() => choose(state, 'honest')).toThrow();
  });
  it('stops at choices and endings instead of silently selecting a route', () => {
    const state = { ...newGame(), sceneId: 'desk', line: sceneMap.get('desk')!.lines.length - 1 };
    expect(advance(state).sceneId).toBe('desk');
    for (const end of allRoutes) expect(advance(end).sceneId).toBe(end.sceneId);
  });
  it('shared ending requires openness and a connection with both characters', () => {
    expect(endingFor({ honesty: 5, lin: 4, chen: 4 })).toBe('together');
    expect(endingFor({ honesty: 5, lin: 4, chen: 0 })).toBe('letter');
    expect(endingFor({ honesty: 0, lin: 0, chen: 1 })).toBe('quiet');
  });
});

describe('portable and validated save files', () => {
  it('round-trips all 54 routes and reconstructs every stat from choices', () => {
    for (const route of allRoutes) {
      const loaded = decodeSave(JSON.stringify(encodeSave(route))).state;
      expect(loaded.sceneId).toBe(route.sceneId);
      expect(loaded.line).toBe(route.line);
      expect(loaded.stats).toEqual(route.stats);
      expect(loaded.decisions).toEqual(route.decisions);
    }
  });
  it('resumes faithfully at every paragraph along a representative route', () => {
    let cursor = newGame();
    for (let step = 0; step < 500; step++) {
      const loaded = decodeSave(JSON.stringify(encodeSave(cursor))).state;
      expect(loaded).toEqual(cursor);
      const scene = getScene(cursor);
      if (cursor.line === scene.lines.length - 1 && scene.ending) break;
      cursor = cursor.line === scene.lines.length - 1 && scene.choices ? choose(cursor, scene.choices[0].id) : advance(cursor);
    }
  });
  it('does not trust imported stats or untrusted dialogue history', () => {
    const save = encodeSave(allRoutes[0]);
    save.state = { ...save.state, stats: { honesty: 999, lin: 999, chen: 999 }, history: [{ sceneId: 'desk', line: 0, speaker: '<script>', text: '<script>bad</script>' }] };
    const loaded = decodeSave(JSON.stringify(save)).state;
    expect(loaded.stats.honesty).toBeLessThan(999);
    expect(loaded.history.some(line => line.speaker === '<script>')).toBe(false);
  });
  it.each([null, [], {}, { schema: 2 }, { schema: 1, game: 'other', savedAt: 'yesterday' }])('rejects incompatible input %j', value => {
    expect(() => decodeSave(JSON.stringify(value))).toThrow();
  });
  it('rejects nonexistent paragraphs and impossible routes', () => {
    const save = encodeSave(newGame());
    expect(() => decodeSave(JSON.stringify({ ...save, state: { ...save.state, line: 999 } }))).toThrow();
    expect(() => decodeSave(JSON.stringify({ ...save, state: { ...save.state, sceneId: 'end-together' } }))).toThrow();
    expect(() => replay([{ sceneId: 'desk', choiceId: 'invalid' }], 'evening', 0)).toThrow();
  });
  it('rejects oversized files before parsing', () => {
    expect(() => decodeSave(' '.repeat(2_000_001))).toThrow('过大');
  });
});
