import { test, expect } from '@playwright/test';
import { newGame, getScene, choose, advance, continueStory } from '../../src/game/engine';
import { encodeSave } from '../../src/game/storage';
import { musicFor } from '../../src/game/progress';
import type { MusicId } from '../../src/game/types';
function saveFor(track: MusicId) {
  let state = newGame();
  for (let step = 0; step < 10000; step++) {
    if (musicFor(state.sceneId) === track) return encodeSave(state);
    const scene = getScene(state);
    if (state.line === scene.lines.length - 1 && scene.choices) state = choose(state, scene.choices[0].id);
    else if (state.line === scene.lines.length - 1 && scene.continuation) state = continueStory(state);
    else { const next = advance(state); if (next.sceneId === state.sceneId && next.line === state.line) throw new Error('No authored route to score ' + track); state = next; }
  }
  throw new Error('No score reached');
}
declare global { interface Window { __originalMusicQA: { contexts: AudioContext[]; loops: { duration: number; loop: boolean }[] } } }
for (const [track, file, duration] of [['window','audio/bgm/healing-desks.ogg',81.702667],['distance','audio/bgm/healing-developed.ogg',96]] as [MusicId, string, number][]) {
  test(`original loop ${file} plays, pauses for help and restores offline`, async ({ page, context }) => {
    const save = saveFor(track);
    await page.addInitScript(({ save, key }) => {
      if (!localStorage.getItem(key + ':save:auto')) localStorage.setItem(key + ':save:auto', JSON.stringify(save));
      localStorage.setItem(key + ':settings', JSON.stringify({ textSpeed: 0, autoDelay: 800, music: true, volume: .15, ambience: false, soundEffects: false, voiceEnabled: false, reducedMotion: true }));
      const qa = window.__originalMusicQA = { contexts: [] as AudioContext[], loops: [] as {duration:number;loop:boolean}[] };
      const Native = window.AudioContext;
      window.AudioContext = class extends Native {
        constructor(options?: AudioContextOptions) { super(options); qa.contexts.push(this); }
        createBufferSource() { const source = super.createBufferSource(), start = source.start.bind(source); source.start = (...args: Parameters<typeof source.start>) => { if (source.buffer && source.loop) qa.loops.push({ duration: source.buffer.duration, loop: source.loop }); start(...args); }; return source; }
      };
    }, { save, key: 'moist-healing:v1' });
    await page.goto('/'); await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
    await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', save.state.sceneId);
    const played = () => page.evaluate(d => window.__originalMusicQA.loops.some(x => x.loop && Math.abs(x.duration - d) < .1), duration);
    await expect.poll(played, { timeout: 20000 }).toBe(true);
    const before = await page.locator('.game-screen').getAttribute('data-line');
    await page.getByRole('button', { name: '帮助', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__originalMusicQA.contexts.every(x => x.state === 'suspended'))).toBe(true);
    await page.getByRole('dialog').getByRole('heading', { level: 2 }).click();
    await expect.poll(() => page.evaluate(() => window.__originalMusicQA.contexts.every(x => x.state === 'suspended'))).toBe(true);
    await page.getByRole('button', { name: '关闭', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__originalMusicQA.contexts.some(x => x.state === 'running'))).toBe(true);
    await expect(page.locator('.game-screen')).toHaveAttribute('data-line', before!);
    await expect.poll(() => page.evaluate(async file => { if (!navigator.serviceWorker.controller) return false; for (const key of await caches.keys()) { const cache = await caches.open(key); if (await cache.match(new URL(file, document.baseURI).href)) return true; } return false; }, file), { timeout: 30000 }).toBe(true);
    await context.setOffline(true); await page.reload(); await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
    await expect.poll(played, { timeout: 20000 }).toBe(true); await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', save.state.sceneId);
  });
}
