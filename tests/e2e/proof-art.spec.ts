import {test,expect} from '@playwright/test';
import {replay} from '../../src/game/engine';
import {encodeSave} from '../../src/game/storage';
import {mkdir} from 'node:fs/promises';
test('proof image restores from a mid-story save, unlocks and loads offline',async({page,context},info)=>{
  const save=encodeSave(replay([{sceneId:'desk',choiceId:'honest'},{sceneId:'lunch',choiceId:'lin'},{sceneId:'club',choiceId:'plain'},{sceneId:'storm',choiceId:'both'},{sceneId:'c2-task',choiceId:'read'}],'c2-proof',5));
  await page.addInitScript(raw=>{if(!localStorage.getItem('moist-healing:v1:save:auto'))localStorage.setItem('moist-healing:v1:save:auto',raw);localStorage.setItem('moist-healing:v1:settings',JSON.stringify({textSpeed:0,music:false,reducedMotion:true}));},JSON.stringify(save));
  await page.goto('/');await page.getByRole('button',{name:'继续上次的故事',exact:true}).click();
  await expect(page.locator('.scene-event')).toHaveAttribute('data-cg','proof');await expect(page.locator('.scene-character')).toHaveCount(0);await expect(page.locator('.scene-event')).toHaveJSProperty('naturalWidth',1672);await expect(page.locator('.game-screen')).toHaveAttribute('data-line','5');
  await expect(page.locator('.toast.visible')).toHaveCount(0);await mkdir('test-results/previews',{recursive:true});await page.screenshot({path:`test-results/previews/cg-proof-${info.project.name}.png`});
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'继续上次的故事',exact:true}).click();await expect(page.locator('.scene-event')).toHaveJSProperty('naturalWidth',1672);
  await page.getByRole('button',{name:'返回标题',exact:true}).click();await page.getByRole('button',{name:'回忆',exact:true}).click();const card=page.locator('.cg-card').filter({hasText:'纸上少了一句'});await expect(card).toBeEnabled();await card.click();await expect(page.getByRole('img',{name:/两版样张并排/})).toBeVisible();
});
