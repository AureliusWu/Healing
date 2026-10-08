import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { advance, choose, continueStory, getScene, newGame, replay, sceneMap } from '../src/game/engine';
import { decodeSave, encodeSave, KEY } from '../src/game/storage';
import { readChapter, readEnding, readGallery, rememberProgress } from '../src/game/progress';
import { scenes, finalEndingIds } from '../src/story';
import { scoreInfo } from '../src/game/score';
import type { GameState } from '../src/game/types';

function routes(state = newGame(), stopAtFirst = false): GameState[] {
  let cursor = state;
  for (let step = 0; step < 4000; step++) {
    const scene = getScene(cursor);
    if (cursor.line === scene.lines.length - 1) {
      if (scene.ending && (!scene.continuation || stopAtFirst)) return [cursor];
      if (scene.choices) return scene.choices.flatMap(choice => routes(choose(cursor, choice.id), stopAtFirst));
      if (scene.continuation) { cursor = continueStory(cursor); continue; }
    }
    cursor = advance(cursor);
  }
  throw new Error('Unterminated complete route');
}
const complete = routes();
const legacy = routes(newGame(), true);
afterEach(() => vi.unstubAllGlobals());

describe('three-chapter complete edition', () => {
  it('uses reachable smoke fixtures matching the current engine contract for release metadata', () => {
    const fixtures = JSON.parse(readFileSync('electron/smoke-fixtures.json', 'utf8'));
    const contract = newGame();
    for (const fixture of [fixtures.cg, fixtures.final]) {
      expect(fixture.schema).toBe(contract.schema);
      expect(fixture.storyVersion).toBe(contract.storyVersion);
      const restored = decodeSave(JSON.stringify(encodeSave(fixture))).state;
      expect(restored.sceneId).toBe(fixture.sceneId);
      expect(restored.line).toBe(fixture.line);
      expect(restored.decisions).toEqual(fixture.decisions);
      expect(restored.stats).toEqual(fixture.stats);
    }
    expect(getScene(fixtures.cg).cg).toBe('lin-page');
    expect(getScene(fixtures.final).ending).toBe('lin-final');
    expect(fixtures.legacy.schema).toBe(contract.schema);
    expect(decodeSave(JSON.stringify(encodeSave(fixtures.legacy))).state.sceneId).toBe(fixtures.legacy.sceneId);
  });
  it('preserves every v0.1.6 first-chapter paragraph, choice and destination', () => {
    const baseline = JSON.parse(readFileSync('tests/fixtures/chapter1-v016.json', 'utf8'));
    const actual = scenes.filter(scene => scene.chapter === 1).map(({ id, lines, choices, next, ending }) => ({ id, lines: lines.map(({ speaker, text }) => ({ speaker, text })), choices: choices ?? null, next: next ?? null, ending: ending ?? null }));
    expect(actual).toEqual(baseline);
  });
  it('has unique IDs and valid scene, music and local illustration references', () => {
    expect(sceneMap.size).toBe(scenes.length);
    expect(scenes).toHaveLength(65);
    for (const scene of scenes) {
      expect(scene.lines.every(line => line.speaker && line.text)).toBe(true);
      for (const id of [scene.next, scene.continuation, ...scene.choices?.map(choice => choice.next) ?? []].filter(Boolean)) expect(sceneMap.has(id!)).toBe(true);
      expect(existsSync(`public/art/${scene.background}.webp`)).toBe(true);
      if (scene.cg) expect(existsSync(`public/art/cg-${scene.cg}.webp`)).toBe(true);
      if (scene.music) expect(scene.music in scoreInfo).toBe(true);
    }
  });
  it('terminates all 1296 combinations, reaches all four final endings and every scene', () => {
    expect(complete).toHaveLength(1296);
    expect(new Set(complete.map(state => getScene(state).ending))).toEqual(new Set(finalEndingIds));
    expect(complete.every(state => state.decisions.length === 7)).toBe(true);
    expect(new Set(complete.flatMap(state => [...state.history.map(line => line.sceneId), state.sceneId]))).toEqual(new Set(scenes.map(scene => scene.id)));
  });
  it('round-trips all complete routes with reconstructed stats and history', () => {
    for (const state of complete) expect(decodeSave(JSON.stringify(encodeSave(state))).state).toEqual(state);
  });
  it('migrates all 54 legacy endings without moving a paragraph or losing choices', () => {
    for (const state of legacy) {
      const save = encodeSave({ ...state, storyVersion: 'chapter1-v1' });
      const loaded = decodeSave(JSON.stringify(save)).state;
      expect(loaded).toEqual(state);
      expect(advance(loaded).sceneId).toBe(state.sceneId);
      const next = continueStory(loaded);
      expect(next.sceneId).toBe('c2-open');
      expect(next.decisions).toEqual(state.decisions);
      expect(next.stats).toEqual(state.stats);
      expect(next.storyVersion).toBe('moist-healing-v1');
      let bridge = next;
      while (bridge.sceneId === 'c2-open') bridge = advance(bridge);
      expect(bridge.sceneId).toBe(`c2-from-${getScene(state).ending}`);
    }
  });
  it('requires explicit chapter continuation and rejects invented routes and legacy future targets', () => {
    expect(() => continueStory(newGame())).toThrow();
    const state = replay(complete[0].decisions.slice(0, 6), 'c2-finish', getScene({ ...newGame(), sceneId: 'c2-finish' }).lines.length - 1);
    expect(advance(state).sceneId).toBe('c2-finish');
    expect(continueStory(state).sceneId).toBe('c3-open');
    expect(() => decodeSave(JSON.stringify(encodeSave({ ...complete[0], storyVersion: 'chapter1-v1' })))).toThrow();
    expect(() => replay([], 'c3-open', 0)).toThrow();
    expect(() => replay([...complete[0].decisions, { sceneId: 'c3-after-school', choiceId: 'lin' }], complete[0].sceneId, 0)).toThrow();
  });
  it('restores every paragraph across chapter boundaries and a final illustration', () => {
    let cursor = newGame(); let paragraphs = 0;
    for (let step = 0; step < 4000; step++) {
      expect(decodeSave(JSON.stringify(encodeSave(cursor))).state).toEqual(cursor);
      paragraphs++;
      const scene = getScene(cursor);
      if (cursor.line === scene.lines.length - 1) {
        if (scene.ending && !scene.continuation) break;
        if (scene.choices) { cursor = choose(cursor, scene.choices[0].id); continue; }
        if (scene.continuation) { cursor = continueStory(cursor); continue; }
      }
      cursor = advance(cursor);
    }
    expect(paragraphs).toBeGreaterThan(250);
    expect(getScene(cursor).ending).toBe('lin-final');
  });
});

describe('validated chapter and memory checkpoints', () => {
  function storage() {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
    return values;
  }
  it('reconstructs chapter starts from imported actual decisions and rereads the same ending', () => {
    storage(); const state = complete[0];
    rememberProgress(state, false);
    expect(readChapter(2)?.state.decisions).toEqual(state.decisions.slice(0, 4));
    expect(readChapter(3)?.state.decisions).toEqual(state.decisions.slice(0, 6));
    expect(readEnding('lin-final')).toBeNull();
    rememberProgress(state, true);
    expect(readEnding('lin-final')?.state.decisions).toEqual(state.decisions);
    expect(readGallery()).toEqual(['lin-page']);
  });
  it('never unlocks future chapters from labels, fabricated targets or malformed checkpoints', () => {
    const values = storage();
    values.set(`${KEY}:endings`, '["lin-final"]');
    values.set(`${KEY}:chapter:3`, JSON.stringify(encodeSave({ ...newGame(), sceneId: 'c3-open' })));
    expect(readChapter(3)).toBeNull();
    rememberProgress(newGame(), false);
    expect(readChapter(1)).not.toBeNull();
    expect(readChapter(2)).toBeNull();
    expect(readChapter(3)).toBeNull();
    expect(readGallery()).toEqual([]);
  });
});
