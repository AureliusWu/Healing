import {test,expect,type Page} from '@playwright/test';
import { readFileSync } from 'node:fs';
import { encodeSave, KEY } from '../../src/game/storage';
import { newGame, getScene, sceneMap } from '../../src/game/engine';
const fixture = JSON.parse(readFileSync('electron/smoke-fixtures.json','utf8'));
async function seed(page:Page, slow=false) {
  await page.addInitScript(({key,save,slow}) => { if(localStorage.getItem('backup-seeded'))return;localStorage.setItem(`${key}:save:auto`,JSON.stringify(save));localStorage.setItem(`${key}:settings`,JSON.stringify({textSpeed:slow?4:0,music:false,ambience:false,soundEffects:false,reducedMotion:false}));localStorage.setItem('backup-seeded','yes'); },{key:KEY,save:encodeSave(fixture.final),slow});
  await page.goto('/');await page.getByRole('button',{name:'继续上次的故事',exact:true}).click();
}
const snapshot=(page:Page)=>page.evaluate(key=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith(key)&&!k.endsWith(':settings')).sort().map(k=>[k,localStorage.getItem(k)])),KEY);
test('temporary rereading changes choices without writing progress, confirms manual save, and returns to the original route',async({page})=>{
  await seed(page);await expect(page.locator('.ending-card')).toBeVisible();const before=await snapshot(page);
  await page.getByRole('button',{name:'回看',exact:true}).click();
  const history=page.getByRole('dialog',{name:'已读文字',exact:true});
  const lunch=sceneMap.get('lunch')!;
  await history.locator('article').filter({hasText:lunch.lines.at(-1)!.text}).getByRole('button',{name:'临时重读',exact:true}).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-rereading','true');
  await expect(page.locator('.choice-panel')).toBeVisible();
  await page.getByRole('button',{name:new RegExp(lunch.choices!.find(c=>c.id==='chen')!.text)}).click();
  await expect(page.locator('.game-screen')).not.toHaveAttribute('data-scene','lunch');
  expect(await snapshot(page)).toEqual(before);
  await page.getByRole('button',{name:'存档',exact:true}).click();await page.getByRole('button',{name:'存入',exact:true}).first().click();
  await expect(page.locator('.confirm-text')).toContainText('重读内容');
  await page.getByRole('button',{name:'再想一下',exact:true}).click();expect(await snapshot(page)).toEqual(before);
  await page.getByRole('button',{name:'关闭',exact:true}).click();await page.getByRole('button',{name:'返回原进度',exact:true}).click();
  await expect(page.locator('.game-screen')).toHaveAttribute('data-scene',fixture.final.sceneId);
  await expect(page.locator('.ending-card')).toBeVisible();expect(await snapshot(page)).toEqual(before);
});
test('downloads a real full backup, previews and cancels import, then preserves omitted manual slots',async({page,browser})=>{
  await seed(page);await expect(page.locator('.ending-card')).toBeVisible();
  await page.getByRole('button',{name:'存档',exact:true}).click();await page.getByRole('button',{name:'存入',exact:true}).first().click();
  const wait=page.waitForEvent('download');await page.getByRole('button',{name:'导出阅读备份',exact:true}).click();
  const download=await wait;expect(download.suggestedFilename()).toMatch(/^MoistHealing-reading-backup-/);
  const stream=await download.createReadStream();const chunks:Buffer[]=[];for await(const c of stream!)chunks.push(Buffer.from(c));const raw=Buffer.concat(chunks);
  const targetContext=await browser.newContext();try{
    const target=await targetContext.newPage();await target.goto('/');await target.bringToFront();
    await target.evaluate(({key,raw})=>localStorage.setItem(`${key}:save:3`,raw),{key:KEY,raw:JSON.stringify(encodeSave(newGame()))});
    await target.getByRole('button',{name:'存档迁移',exact:true}).click();const before=await snapshot(target);
    const input=target.getByLabel('选择存档文件');await input.setInputFiles({name:'backup.json',mimeType:'application/json',buffer:raw});
    await expect(target.locator('.confirm-text')).toContainText('2 份存档、3 个章首和 1 段结局');
    await expect(target.locator('.confirm-text')).toContainText('合并结局、画面与音乐回忆');
    await target.getByRole('button',{name:'再想一下',exact:true}).click();expect(await snapshot(target)).toEqual(before);
    await input.setInputFiles({name:'backup.json',mimeType:'application/json',buffer:raw});await target.locator('.confirm-actions .primary').click();
    await expect(target.locator('.game-screen')).toHaveAttribute('data-scene',fixture.final.sceneId);
    expect(await target.evaluate(key=>localStorage.getItem(`${key}:save:3`),KEY)).toBe(before[`${KEY}:save:3`]);
    await expect.poll(()=>target.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);await targetContext.setOffline(true);await target.reload();
    await target.getByRole('button',{name:'继续上次的故事',exact:true}).click();await expect(target.locator('.game-screen')).toHaveAttribute('data-scene',fixture.final.sceneId);
  }finally{await targetContext.close();}
});
test('returns from temporary reread with the original incomplete character count',async({page})=>{
  await page.addInitScript(key=>localStorage.setItem(`${key}:settings`,JSON.stringify({textSpeed:4,music:false,reducedMotion:false})),KEY);
  await page.clock.install({time:new Date('2026-10-18T00:00:00Z')});await page.goto('/');await page.clock.pauseAt(new Date('2026-10-18T00:00:10Z'));
  await page.getByRole('button',{name:'开始阅读',exact:true}).click();await page.locator('.dialogue-text').click();await page.locator('.dialogue-text').click();await page.clock.runFor(500);
  const visible=page.locator('.dialogue-text > span[aria-hidden="true"]');const partial=await visible.textContent();expect(partial).toBe(getScene(newGame()).lines[1].text.slice(0,2));
  await page.getByRole('button',{name:'回看',exact:true}).click();await page.getByRole('button',{name:'临时重读',exact:true}).first().click();await page.clock.runFor(1500);
  await page.getByRole('button',{name:'返回原进度',exact:true}).click();expect(await visible.textContent()).toBe(partial);await page.clock.runFor(250);expect(await visible.textContent()).not.toBe(partial);
});
