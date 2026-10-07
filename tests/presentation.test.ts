import { describe, expect, it } from 'vitest';
import { presentationAt, expressionIds } from '../src/game/presentation';
import { decodeSave, encodeSave } from '../src/game/storage';
import { newGame, replay } from '../src/game/engine';
import { scenes } from '../src/story/chapter1';

describe('authored character emotions and save compatibility', () => {
  it('holds an emotional beat through narration and reproduces it after loading an old-style save', () => {
    const scene = scenes.find(scene => scene.id === 'misunderstanding')!;
    const line = scene.lines.findIndex(line => line.speaker === '林见夏' && line.text === '别翻那个。');
    expect(presentationAt(scene, line)).toEqual({ character: 'lin', expression: 'hurt' });
    expect(presentationAt(scene, line + 1)).toEqual({ character: 'lin', expression: 'hurt' });
    expect(presentationAt(scene, line + 2)).toEqual({ character: 'chen', expression: 'surprised' });
    const decisions = [{ sceneId: 'desk', choiceId: 'honest' }, { sceneId: 'lunch', choiceId: 'lin' }, { sceneId: 'club', choiceId: 'plain' }];
    const state = replay(decisions, scene.id, line + 1);
    const save = encodeSave(state);
    save.state.history = save.state.history.map(({ expression: _expression, ...entry }) => entry);
    const loaded = decodeSave(JSON.stringify(save)).state;
    expect(loaded.line).toBe(line + 1);
    expect(loaded.decisions).toEqual(decisions);
    expect(presentationAt(scene, loaded.line)).toEqual(presentationAt(scene, line));
  });
  it('keeps all six emotions available and annotations out of player-visible text', () => {
    const lines = scenes.flatMap(scene => scene.lines);
    expect(new Set(lines.map(line => line.expression).filter(Boolean))).toEqual(new Set(expressionIds));
    expect(lines.every(line => !/[\[\]]/.test(line.speaker))).toBe(true);
    expect(lines.every(line => !/\[(neutral|smile|surprised|worried|hurt|shy)\]/.test(line.text))).toBe(true);
  });
  it('keeps v0.1.5 interlude positions importable with the same sixteen paragraph slots', () => {
    const scene = scenes.find(scene => scene.id === 'tang-interlude')!;
    expect(scene.lines).toHaveLength(16);
    const decisions = [{ sceneId: 'desk', choiceId: 'honest' }, { sceneId: 'lunch', choiceId: 'lin' }, { sceneId: 'club', choiceId: 'plain' }];
    for (let line = 0; line < 16; line++) {
      const save = encodeSave({ ...newGame(), sceneId: scene.id, line, decisions });
      const loaded = decodeSave(JSON.stringify(save)).state;
      expect(loaded.sceneId).toBe(scene.id);
      expect(loaded.line).toBe(line);
      expect(loaded.decisions).toEqual(decisions);
    }
  });
});
