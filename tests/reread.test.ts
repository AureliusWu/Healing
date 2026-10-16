import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { choose, getScene, newGame, recordLine, replay, sceneMap } from '../src/game/engine';
import { rereadFrom } from '../src/game/reread';
import { decodeSave, encodeSave } from '../src/game/storage';
import { presentationAt } from '../src/game/presentation';
import type { GameState } from '../src/game/types';

const fixtures = JSON.parse(readFileSync('electron/smoke-fixtures.json', 'utf8'));
const final = decodeSave(JSON.stringify(encodeSave(fixtures.final))).state;
const target = (sceneId: string, line = 0) => ({ sceneId, line });

describe('rereading the native read path', () => {
  it('returns the first paragraph without carrying any later choices', () => {
    expect(rereadFrom(final, target('arrival'))).toEqual(newGame());
  });
  it('keeps the choices preceding a branch paragraph', () => {
    const restored = rereadFrom(final, target('desk-honest', 2));
    expect(restored).toEqual(replay(final.decisions.slice(0, 1), 'desk-honest', 2));
  });
  it('removes a target choice and every decision after it', () => {
    const lastLine = sceneMap.get('lunch')!.lines.length - 1;
    const restored = rereadFrom(final, target('lunch', lastLine));
    expect(restored.decisions).toEqual(final.decisions.slice(0, 1));
    expect(getScene(restored).choices).toBeDefined();
  });
  it('can make a different choice after returning to the same choice paragraph', () => {
    const restored = rereadFrom(final, target('lunch', sceneMap.get('lunch')!.lines.length - 1));
    const changed = choose(restored, 'chen');
    expect(changed.sceneId).toBe('lunch-chen');
    expect(changed.decisions).toEqual([final.decisions[0], { sceneId: 'lunch', choiceId: 'chen' }]);
    expect(changed.stats).toEqual({ honesty: 2, lin: 2, chen: 2 });
  });
  it('restores chapter two across an explicit old-ending bridge', () => {
    const restored = rereadFrom(final, target('c2-open', 1));
    expect(restored.decisions).toEqual(final.decisions.slice(0, 4));
    expect(restored).toEqual(replay(restored.decisions, 'c2-open', 1));
  });
  it('restores chapter three before its final route choice', () => {
    const restored = rereadFrom(final, target('c3-open', 1));
    expect(restored.decisions).toEqual(final.decisions.slice(0, 6));
    expect(restored.history.some(entry => entry.sceneId === 'c2-finish')).toBe(true);
  });
  it('restores a read illustration using its current native presentation', () => {
    const restored = rereadFrom(final, target('c3-lin-page'));
    expect(getScene(restored).cg).toBe('lin-page');
    expect(restored.decisions).toEqual(final.decisions);
    expect(presentationAt(getScene(restored), restored.line)).toEqual(presentationAt(sceneMap.get('c3-lin-page')!, 0));
  });
  it('returns to the current paragraph without adding it to saved history', () => {
    expect(rereadFrom(final, target(final.sceneId, final.line))).toEqual(final);
    expect(rereadFrom(final, target(final.sceneId, final.line)).history).toEqual(final.history);
  });
  it('ignores fabricated history, scores and display text', () => {
    const tampered = { ...final, stats: { honesty: 999, lin: 999, chen: 999 }, history: [{ sceneId: 'arrival', line: 0, speaker: '伪造', text: '伪造' }] };
    const restored = rereadFrom(tampered, target('desk-honest', 2));
    expect(restored).toEqual(replay(final.decisions.slice(0, 1), 'desk-honest', 2));
    expect(restored.history.some(entry => entry.text === '伪造')).toBe(false);
  });
  it('rejects an unread sibling route even when untrusted history claims it was read', () => {
    const tampered: GameState = { ...final, history: [...final.history, { ...sceneMap.get('desk-help')!.lines[0], sceneId: 'desk-help', line: 0 }] };
    expect(() => rereadFrom(tampered, target('desk-help'))).toThrow('已经到达');
  });
  it('rejects later paragraphs and future chapters', () => {
    expect(() => rereadFrom(newGame(), target('arrival', 1))).toThrow('已经到达');
    expect(() => rereadFrom(newGame(), target('c3-open'))).toThrow('已经到达');
  });
  it('rejects impossible current paths before considering the requested target', () => {
    expect(() => rereadFrom({ ...newGame(), sceneId: 'c3-open' }, target('arrival'))).toThrow();
    expect(() => rereadFrom({ ...final, decisions: [...final.decisions, final.decisions[0]] }, target('arrival'))).toThrow();
  });
  it('rejects missing, out-of-range and fractional targets', () => {
    for (const entry of [target('missing'), target('arrival', -1), target('arrival', 1000), target('arrival', 0.5)]) {
      expect(() => rereadFrom(final, entry)).toThrow('已经到达');
    }
  });
  it('rebuilds every recorded paragraph and round-trips the resulting compatible save', () => {
    for (const entry of recordLine(final).history) {
      const restored = rereadFrom(final, entry);
      expect(restored.sceneId).toBe(entry.sceneId);
      expect(restored.line).toBe(entry.line);
      expect(decodeSave(JSON.stringify(encodeSave(restored))).state).toEqual(restored);
      expect(restored.decisions).toEqual(final.decisions.slice(0, restored.decisions.length));
    }
  });
  it('rereads a validated old chapter without changing save identity or paragraph offsets', () => {
    const legacy = decodeSave(JSON.stringify(encodeSave(fixtures.legacy))).state;
    const restored = rereadFrom(legacy, target('end-together', 2));
    const save = encodeSave(restored);
    expect(save.schema).toBe(1);
    expect(save.game).toBe('moist-healing');
    expect(save.state.decisions).toEqual(fixtures.legacy.decisions);
    expect(restored.line).toBe(2);
    expect(decodeSave(JSON.stringify(save)).state).toEqual(restored);
  });
});
