import { test, expect, type Page } from '@playwright/test';
import { advance, choose, continueStory, getScene, newGame, replay } from '../../src/game/engine';
import { encodeSave } from '../../src/game/storage';
import { mkdir } from 'node:fs/promises';

let state = newGame();
while (!(getScene(state).ending && state.line === getScene(state).lines.length - 1)) {
  const scene = getScene(state);
  state = scene.choices && state.line === scene.lines.length - 1 ? choose(state, scene.choices[0].id) : advance(state);
}
const legacyEnding = { ...state, storyVersion: 'chapter1-v1' as const };
state = continueStory(state);
while (state.sceneId !== 'c3-after-school') {
  const scene = getScene(state);
  state = scene.choices && state.line === scene.lines.length - 1 ? choose(state, scene.choices[0].id)
    : scene.continuation && state.line === scene.lines.length - 1 ? continueStory(state) : advance(state);
}
const finalChoices = getScene(state).choices!;
const earlierChoices = state.decisions;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('moist-healing:v1:settings', JSON.stringify({ textSpeed: 0, music: false, soundEffects: false, ambience: false, reducedMotion: true })));
});
async function seed(page: Page, saved: typeof state) {
  await page.goto('/');
  await page.evaluate(raw => localStorage.setItem('moist-healing:v1:save:auto', raw), JSON.stringify(encodeSave(saved)));
  await page.reload();
  await page.getByRole('button', { name: '继续上次的故事', exact: true }).click();
}

test('legacy chapter ending stops and explicitly continues with the same choices', async ({ page }) => {
  await seed(page, legacyEnding);
  await expect(page.locator('.ending-card')).toContainText('窗还开着');
  await expect(page.getByRole('button', { name: '快进', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: /下一章 · 显影/ }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', 'c2-open');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('moist-healing:v1:save:auto')!).state);
  expect(saved.decisions).toEqual(legacyEnding.decisions);
  expect(saved.stats).toEqual(legacyEnding.stats);
  expect(saved.storyVersion).toBe('moist-healing-v1');
  await page.getByRole('button', { name: '返回标题', exact: true }).click();
  await page.getByRole('button', { name: '章节', exact: true }).click();
  await expect(page.locator('.chapter-card').nth(1)).toBeEnabled();
  await expect(page.locator('.chapter-card').nth(2)).toBeDisabled();
  await page.locator('.chapter-card').nth(1).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', 'c2-open');
});

test('all four final illustrations, ending rereads and offline memories retain actual routes', async ({ page, context }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  for (const choice of finalChoices) {
    const route = [...earlierChoices, { sceneId: 'c3-after-school', choiceId: choice.id }];
    const talk = getScene({ ...state, sceneId: choice.next });
    const cg = getScene({ ...state, sceneId: talk.next! });
    await seed(page, replay(route, cg.id, 0));
    await expect(page.locator('.scene-event')).toHaveAttribute('data-cg', cg.cg!);
    await expect(page.locator('.scene-character')).toHaveCount(0);
    await expect.poll(() => page.locator('.scene-event').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth >= 1600)).toBe(true);
    await expect(page.locator('.toast.visible')).toHaveCount(0);
    await mkdir('test-results/previews', { recursive: true });
    await page.screenshot({ path: `test-results/previews/cg-${cg.cg}-${info.project.name}.png` });
    await seed(page, replay(route, cg.next!, getScene({ ...state, sceneId: cg.next! }).lines.length - 1));
    await page.getByRole('button', { name: '制作人员', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('谢谢你读到这里');
    await page.getByRole('button', { name: '关闭', exact: true }).click();
    await page.getByRole('button', { name: '回到标题', exact: true }).click();
  }
  await page.getByRole('button', { name: '回忆', exact: true }).click();
  await expect(page.locator('.edition-memories')).toContainText('最终结局 4 / 4');
  await expect(page.locator('.cg-card:enabled')).toHaveCount(4);
  await page.locator('.cg-card').first().click();
  await expect.poll(() => page.locator('.cg-view img').evaluate((image: HTMLImageElement) => image.naturalWidth >= 1600)).toBe(true);
  await page.getByRole('button', { name: '返回回忆手册' }).click();
  await page.locator('.memory-replay').first().click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', 'end-lin-final');
  expect(errors).toEqual([]);
});

test('fresh devices keep chapters, final memories and pictures locked', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '章节', exact: true }).click();
  await expect(page.locator('.chapter-card:disabled')).toHaveCount(2);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '回忆', exact: true }).click();
  await expect(page.locator('.cg-card:disabled')).toHaveCount(4);
  await expect(page.locator('.memory-replay')).toHaveCount(0);
  await expect(page.locator('.score-card:enabled')).toHaveCount(1);
});

test('portrait and short landscape ending controls fit and hiding UI never advances', async ({ page }) => {
  await seed(page, legacyEnding);
  const button = page.getByRole('button', { name: /下一章 · 显影/ });
  for (const [width, height] of [[568, 320], [844, 390], [412, 915]]) {
    await page.setViewportSize({ width, height });
    await expect(button).toBeInViewport({ ratio: .99 });
    await expect(page.getByRole('button', { name: '回到标题', exact: true })).toBeInViewport({ ratio: .99 });
    expect(await page.locator('.ending-card h2').evaluate(element => element.getBoundingClientRect().height)).toBeLessThan(60);
    expect(await page.locator('.ending-actions').evaluate(element => element.getBoundingClientRect().right <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: '隐藏界面', exact: true }).click();
  await page.getByRole('button', { name: '恢复阅读界面', exact: true }).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene', legacyEnding.sceneId);
  await expect(button).toBeInViewport();
});

test('six scores produce bounded audible output in one context and audition restores settings', async ({ page }) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    const contexts: AudioContext[] = [], meters: AnalyserNode[] = [];
    Object.assign(window, { editionAudio: { contexts, meters } });
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options); contexts.push(this);
        const create = this.createGain.bind(this); let first = true;
        this.createGain = () => {
          const gain = create();
          if (first) { first = false; const meter = this.createAnalyser(); meter.fftSize = 2048; gain.connect(meter); meters.push(meter); }
          return gain;
        };
      }
    };
  });
  await seed(page, replay([...earlierChoices, { sceneId: 'c3-after-school', choiceId: 'chen' }], 'end-chen-final', 0));
  await page.getByRole('button', { name: '返回标题', exact: true }).click();
  await page.getByRole('button', { name: '回忆', exact: true }).click();
  await expect(page.locator('.score-card:enabled')).toHaveCount(6);
  for (const button of await page.locator('.score-card').all()) {
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => {
      const { contexts, meters } = (window as unknown as { editionAudio: { contexts: AudioContext[]; meters: AnalyserNode[] } }).editionAudio;
      if (contexts.length !== 1 || contexts[0].state !== 'running') return false;
      const data = new Float32Array(2048); meters[0].getFloatTimeDomainData(data);
      const peak = Math.max(...data.map(Math.abs));
      return peak > .0001 && peak < .5;
    })).toBe(true);
  }
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { editionAudio: { contexts: AudioContext[] } }).editionAudio.contexts[0].state)).toBe('suspended');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('moist-healing:v1:settings')!).music)).toBe(false);
});
