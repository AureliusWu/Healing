import { test, expect } from '@playwright/test';
import { replay } from '../../src/game/engine';
import { encodeSave, KEY } from '../../src/game/storage';

const state = replay([
  { sceneId: 'desk', choiceId: 'honest' }, { sceneId: 'lunch', choiceId: 'lin' },
  { sceneId: 'club', choiceId: 'plain' }, { sceneId: 'storm', choiceId: 'both' },
  { sceneId: 'c2-task', choiceId: 'read' }, { sceneId: 'c2-permission', choiceId: 'ask' },
], 'c2-confirm', 0);

test('actual scene music stops on exit and reuses its decoded buffer on re-entry', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ key, save }) => {
    localStorage.setItem(`${key}:save:auto`, save);
    localStorage.setItem(`${key}:settings`, JSON.stringify({ textSpeed: 0, music: true, volume: .1, ambience: false, soundEffects: false, voiceEnabled: false }));
    const counts = { starts: 0, stops: 0, decodes: 0 };
    (window as unknown as { __sceneAudio: typeof counts }).__sceneAudio = counts;
    const start = AudioBufferSourceNode.prototype.start, stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.loop && (this.buffer?.duration ?? 0) > 20) counts.starts++;
      return start.apply(this, args);
    };
    AudioBufferSourceNode.prototype.stop = function (...args) {
      if (this.loop && (this.buffer?.duration ?? 0) > 20) counts.stops++;
      return stop.apply(this, args);
    };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function (bytes) {
      return decode.call(this, bytes).then(buffer => { if (buffer.duration > 20) counts.decodes++; return buffer; });
    };
  }, { key: KEY, save: JSON.stringify(encodeSave(state)) });
  await page.goto('/');
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  const counts = () => page.evaluate(() => (window as unknown as { __sceneAudio: { starts: number; stops: number; decodes: number } }).__sceneAudio);
  await expect.poll(async () => (await counts()).starts).toBe(1);
  await page.getByRole('button', { name: '返回标题', exact: true }).click();
  await expect.poll(async () => (await counts()).stops).toBe(1);
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
  await expect.poll(async () => (await counts()).starts).toBe(2);
  expect((await counts()).decodes).toBe(1);
  expect(errors).toEqual([]);
});
