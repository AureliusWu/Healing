import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { applyProgressImport, createReadingBackup, decodeProgressFile } from '../src/game/backup';
import { advance, choose, continueStory, getScene, newGame, replay } from '../src/game/engine';
import { rememberProgress } from '../src/game/progress';
import { decodeSave, encodeSave, KEY, readSave, slots, writeSave } from '../src/game/storage';
import type { GameState } from '../src/game/types';
const fixture = JSON.parse(readFileSync('electron/smoke-fixtures.json', 'utf8'));
const final = decodeSave(JSON.stringify(encodeSave(fixture.final))).state;
let values: Map<string, string>;
const memory = () => ({getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, raw: string) => { values.set(key, raw); }, removeItem: (key: string) => { values.delete(key); }});
beforeEach(() => { values = new Map(); vi.stubGlobal('localStorage', memory()); });
afterEach(() => vi.unstubAllGlobals());
function allFinals(state = newGame(), found = new Map<string, GameState>()): Map<string, GameState> {
  for (let step = 0; step < 4000; step++) {
    const scene = getScene(state);
    if (state.line === scene.lines.length - 1) {
      if (scene.ending && !scene.continuation) { found.set(scene.ending, state); return found; }
      if (scene.choices) { for (const option of scene.choices) { allFinals(choose(state, option.id), found); if (found.size === 4) break; } return found; }
      if (scene.continuation) { state = continueStory(state); continue; }
    }
    state = advance(state);
  }
  throw Error('unterminated');
}
it('round-trips every slot, three chapter starts, four final endings and all six illustrations', () => {
  const finals = [...allFinals().values()]; expect(finals).toHaveLength(4);
  for (const state of finals) rememberProgress(state, true);
  for (const [index, slot] of slots.entries()) writeSave(slot, finals[index]);
  const backup = createReadingBackup();
  expect(Object.keys(backup.slots)).toHaveLength(4); expect(Object.keys(backup.chapters)).toHaveLength(3);
  expect(backup.memories.endings).toHaveLength(4); expect(backup.memories.gallery).toHaveLength(6);
  const imported = decodeProgressFile(JSON.stringify(backup)); values.clear(); applyProgressImport(imported);
  for (const [index, slot] of slots.entries()) expect(readSave(slot)?.state).toEqual(finals[index]);
  expect(createReadingBackup().memories).toEqual(backup.memories);
});
it('retains reached illustration proofs after all four slots have moved elsewhere', () => {
  const cg = decodeSave(JSON.stringify(encodeSave(fixture.cg))).state;
  rememberProgress(cg, false);
  for (const slot of slots) writeSave(slot, newGame());
  const backup = createReadingBackup(); expect(backup.proofs['gallery:lin-page']).toBeDefined();
  expect(backup.memories.gallery).toContain('lin-page');
  values.clear(); applyProgressImport(decodeProgressFile(JSON.stringify(backup)));
  expect(createReadingBackup().memories.gallery).toContain('lin-page');
});
it('merges only present slots and preserves unrelated local progress and settings', () => {
  writeSave('1', final); rememberProgress(final, true); const backup = createReadingBackup(); delete backup.slots.auto;
  const initial = encodeSave(newGame()); localStorage.setItem(`${KEY}:save:3`, JSON.stringify(initial));
  localStorage.setItem(`${KEY}:settings`, '{"volume":0.1}');
  applyProgressImport(decodeProgressFile(JSON.stringify(backup)));
  expect(readSave('3')).toEqual(initial); expect(localStorage.getItem(`${KEY}:settings`)).toBe('{"volume":0.1}');
});
it('accepts old first-chapter single saves without accepting another game identity', () => {
  const old = { ...encodeSave(newGame()), state: { ...newGame(), storyVersion: 'chapter1-v1' } };
  const imported = decodeProgressFile(JSON.stringify(old)); expect(imported.kind).toBe('single'); applyProgressImport(imported);
  expect(readSave('auto')?.state.storyVersion).toBe('moist-healing-v1');
  expect(() => decodeProgressFile(JSON.stringify({...old, game:'netlove'}))).toThrow();
});
it('rejects invented route, chapter, ending and gallery claims', () => {
  rememberProgress(final, true); const valid = createReadingBackup(final);
  const corrupt = (change: (backup: typeof valid) => void) => { const b=structuredClone(valid);change(b);expect(() => decodeProgressFile(JSON.stringify(b))).toThrow(); };
  corrupt(b => { b.slots.auto!.state.decisions = []; });
  corrupt(b => { b.chapters[2] = b.slots.auto; });
  corrupt(b => { b.endings['chen-final'] = b.slots.auto; });
  corrupt(b => { b.memories.gallery.push('tang-light'); });
  corrupt(b => { b.proofs['gallery:tang-light'] = b.slots.auto; });
});
it('refuses to silently omit unsupported legacy unlock flags from a full export', () => {
  localStorage.setItem(`${KEY}:gallery`, '["tang-light"]');
  expect(() => createReadingBackup(newGame())).toThrow(/路线证明/);
  expect(localStorage.getItem(`${KEY}:gallery`)).toBe('["tang-light"]');
});
it('rolls back all writes when storage quota fails midway through import', () => {
  rememberProgress(final, true); for (const slot of slots) writeSave(slot, final);
  const imported = decodeProgressFile(JSON.stringify(createReadingBackup()));
  values.clear(); writeSave('auto', newGame()); writeSave('1', newGame());
  const before = new Map(values); let writes = 0; const storage = memory();
  expect(() => applyProgressImport(imported, { ...storage, setItem(key, raw) { if (++writes === 3) throw Error('quota'); storage.setItem(key,raw); } })).toThrow(/原有进度已保留/);
  expect(values).toEqual(before);
});
it('reconstructs history and scores rather than trusting serialized ones', () => {
  const save = encodeSave(final); save.state = {...save.state, stats:{honesty:999,lin:999,chen:999},history:[]};
  const imported = decodeProgressFile(JSON.stringify(save)); expect(imported.kind).toBe('single');
  if (imported.kind === 'single') expect(imported.save.state).toEqual(replay(final.decisions, final.sceneId, final.line));
});
