import { test, expect } from '@playwright/test';
import { replay, newGame, getScene, advance, choose, continueStory } from '../../src/game/engine';
import { encodeSave, KEY } from '../../src/game/storage';
import { sceneCues } from '../../src/game/scene-cues';
import type { GameState } from '../../src/game/types';

for (const enabled of [true, false]) test(`authored event respects effects=${enabled} without menu replay`, async ({ page }) => {
  const save = JSON.stringify(encodeSave(replay([], 'arrival', 10)));
  await page.addInitScript(({ save, key, enabled }) => {
    localStorage.setItem(`${key}:save:auto`, save);
    localStorage.setItem(`${key}:settings`, JSON.stringify({ textSpeed: 0, music: false, ambience: false, voiceEnabled: false, soundEffects: enabled }));
    const starts: number[] = [];
    (window as unknown as { __eventStarts: number[] }).__eventStarts = starts;
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const source = create.call(this), start = source.start;
      source.start = function (...args) { starts.push(source.frequency.value); return start.apply(source, args); };
      return source;
    };
  }, { save, key: KEY, enabled });
  await page.goto('/');
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  const count = () => page.evaluate(() => (window as unknown as { __eventStarts: number[] }).__eventStarts.length);
  if (enabled) await expect.poll(count).toBeGreaterThan(0);
  else { await page.waitForTimeout(300); expect(await count()).toBe(0); }
  const before = await count(), position = await page.evaluate(key => localStorage.getItem(`${key}:save:auto`), KEY);
  await page.getByRole('button', { name: '阅读设置', exact: true }).click();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '隐藏界面', exact: true }).click();
  await page.getByRole('button', { name: '恢复阅读界面', exact: true }).click();
  await page.waitForTimeout(300);
  expect(await count()).toBe(before);
  expect(await page.evaluate(key => localStorage.getItem(`${key}:save:auto`), KEY)).toBe(position);
});


function stateAt(sceneId: string, line: number): GameState {
  const queue = [newGame()], seen = new Set<string>();
  for (let at = 0; at < queue.length; at++) {
    let state = queue[at]; const scene = getScene(state);
    if (seen.has(scene.id)) continue; seen.add(scene.id);
    if (scene.id === sceneId) { while (state.line < line) state = advance(state); return state; }
    while (state.line < scene.lines.length - 1) state = advance(state);
    if (scene.choices) queue.push(...scene.choices.map(choice => choose(state, choice.id)));
    else if (scene.continuation) queue.push(continueStory(state));
    else if (!scene.ending && !scene.chapterEnd) queue.push(advance(state));
  }
  throw new Error('No native route to cue ' + sceneId);
}
for (const cue of sceneCues.slice(1)) test(`actual event ${cue.scene}/${cue.line}: ${cue.cue}`, async ({ page }) => {
  const save = JSON.stringify(encodeSave(stateAt(cue.scene, cue.line)));
  await page.addInitScript(({ save, key }) => {
    localStorage.setItem(`${key}:save:auto`, save);
    localStorage.setItem(`${key}:settings`, JSON.stringify({ textSpeed: 0, music: false, ambience: false, voiceEnabled: false, soundEffects: true }));
    const starts: number[] = [];
    (window as unknown as { __eventStarts: number[] }).__eventStarts = starts;
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const source = create.call(this), start = source.start;
      source.start = function (...args) { starts.push(source.frequency.value); return start.apply(source, args); };
      return source;
    };
  }, { save, key: KEY });
  await page.goto('/'); await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', cue.scene);
  await expect(page.locator('.game-screen')).toHaveAttribute('data-line', String(cue.line));
  await expect.poll(() => page.evaluate(() => (window as unknown as { __eventStarts: number[] }).__eventStarts.length)).toBeGreaterThan(0);
});
