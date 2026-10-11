const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const smoke = process.argv.includes('--smoke-test');
const smokeDataArgument = process.argv.indexOf('--smoke-user-data-dir');
const restoring = smoke && smokeDataArgument >= 0;
if (smoke) {
  const smokeDirectory = restoring ? path.resolve(process.argv[smokeDataArgument + 1] || '') : path.join(app.getPath('temp'), `moist-healing-smoke-${process.pid}`);
  if (path.dirname(smokeDirectory).toLowerCase() !== path.resolve(app.getPath('temp')).toLowerCase() || !/^moist-healing-smoke-\d+$/.test(path.basename(smokeDirectory))) throw new Error('Smoke storage must be an isolated temporary game profile');
  app.setPath('userData', smokeDirectory);
}
let window;
function openWindow() {
  const index = path.join(__dirname, '..', 'dist', 'index.html');
  const entry = pathToFileURL(index).href;
  window = new BrowserWindow({
    width: 1360, height: 860, minWidth: 800, minHeight: 560,
    title: '湿性愈合 · 三章完结', backgroundColor: '#f5f3e9',
    icon: path.join(__dirname, '..', 'dist', 'icons', 'icon-512.png'),
    show: false, autoHideMenuBar: true,
    focusable: !smoke, skipTaskbar: smoke,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, backgroundThrottling: !smoke },
  });
  Menu.setApplicationMenu(null);
  if (smoke) window.webContents.setAudioMuted(true);
  // Electron can show a window when native fullscreen is requested, even when
  // created with show:false. Keep automated windows out of the user's desktop.
  if (smoke) window.on('show', () => window.hide());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (url.split('#')[0] !== entry) event.preventDefault();
  });
  const allowFullscreen = (contents, permission, details = {}) => permission === 'fullscreen'
    && contents === window.webContents && contents.getURL().split('#')[0] === entry
    && details.isMainFrame !== false && (!details.requestingUrl || details.requestingUrl.split('#')[0] === entry);
  window.webContents.session.setPermissionRequestHandler((contents, permission, callback, details) => callback(allowFullscreen(contents, permission, details)));
  window.webContents.session.setPermissionCheckHandler((contents, permission, _origin, details) => allowFullscreen(contents, permission, details));
  window.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') { event.preventDefault(); window.setFullScreen(!window.isFullScreen()); }
  });
  if (!smoke) window.once('ready-to-show', () => window.show());
  window.webContents.on('did-fail-load', (_event, code, description) => {
    console.error('Desktop load failed:', code, description);
    if (smoke) app.exit(1);
  });
  if (smoke) window.webContents.once('did-finish-load', async () => {
    try {
      await window.webContents.executeJavaScript(`(async () => {
        for (let i = 0; i < 100; i++) {
          if (document.querySelector('.fullscreen-button')) return;
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        throw new Error('Title controls missing');
      })()`);
      await window.webContents.executeJavaScript(`(async () => {
        document.querySelector('.fullscreen-button').click();
        for (let i = 0; i < 100; i++) {
          if (document.fullscreenElement && document.querySelector('[aria-label="退出全屏"]')) return;
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        throw new Error('Fullscreen button failed to enter fullscreen');
      })()`, true);
      if (restoring) {
        const final = require('./smoke-fixtures.json').final;
        await window.webContents.executeJavaScript(`(async () => {
          const expected = ${JSON.stringify(final)};
          const raw = localStorage.getItem('moist-healing:v1:save:auto');
          const saved = raw && JSON.parse(raw);
          if (!saved || saved.schema !== 1 || saved.game !== 'moist-healing' || saved.state.storyVersion !== expected.storyVersion || saved.state.sceneId !== expected.sceneId || saved.state.line !== expected.line || JSON.stringify(saved.state.decisions) !== JSON.stringify(expected.decisions)) throw new Error('Installed upgrade lost the prior version save');
          const button = name => [...document.querySelectorAll('button')].find(item => item.textContent.trim() === name);
          button('继续上次的故事').click();
          for (let i = 0; i < 200; i++) {
            if (document.querySelector('.game-screen')?.dataset.scene === expected.sceneId && document.querySelector('.ending-card')) break;
            await new Promise(resolve => setTimeout(resolve, 25));
          }
          if (document.querySelector('.game-screen')?.dataset.scene !== expected.sceneId || !document.querySelector('.ending-card')) throw new Error('Installed upgrade cannot resume the prior ending');
          button('回到标题').click();
          localStorage.removeItem('moist-healing:v1:save:auto');
          for (let i = 0; i < 100; i++) {
            if (document.querySelector('.start-button')) return;
            await new Promise(resolve => setTimeout(resolve, 25));
          }
          throw new Error('Upgrade verification did not return to title');
        })()`);
        console.log('DESKTOP_UPGRADE_OK', JSON.stringify({ version: app.getVersion(), saveSchema: 1, legacyCompatible: true, restoredEnding: final.sceneId, sameProfile: true }));
      }
      await window.webContents.executeJavaScript(`(async () => {
        document.querySelector('[aria-label="退出全屏"]').click();
        for (let i = 0; i < 100; i++) {
          if (!document.fullscreenElement && document.querySelector('[aria-label="全屏阅读"]')) return;
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        throw new Error('Fullscreen button failed to exit fullscreen');
      })()`, true);
      window.hide();
      const result = await window.webContents.executeJavaScript(`(async () => {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        await delay(700);
        if (!document.querySelector('h1')?.textContent.includes('湿性愈合')) throw new Error('Title screen missing');
        if (typeof require !== 'undefined' || typeof process !== 'undefined') throw new Error('Renderer has Node access');
        if ([...document.images].some(image => !image.complete || image.naturalWidth === 0)) throw new Error('Artwork missing');
        document.querySelector('.start-button').click();
        await delay(50);
        document.querySelector('.confirm-actions .primary')?.click();
        await delay(250);
        const reader = document.querySelector('.dialogue-text');
        if (!reader || !reader.textContent.includes('十七岁')) throw new Error('Story failed to start');
        reader.click(); await delay(30); reader.click(); await delay(100);
        const raw = localStorage.getItem('moist-healing:v1:save:auto');
        if (!raw || JSON.parse(raw).state.line !== 1) throw new Error('Autosave failed');
        const stage = document.querySelector('.game-stage').getBoundingClientRect();
        const header = document.querySelector('.game-header').getBoundingClientRect();
        const dock = document.querySelector('.reading-panel').getBoundingClientRect();
        if (header.bottom > stage.top + 1 || stage.bottom > dock.top + 1) throw new Error('UI covers artwork');
        const frame = document.querySelector('.scene-frame').getBoundingClientRect();
        if (Math.abs(frame.left) > 1 || Math.abs(frame.top) > 1 || Math.abs(frame.width - innerWidth) > 1 || Math.abs(frame.height - innerHeight) > 1) throw new Error('Artwork does not fill the window');
        const opacity = document.querySelector('.opacity-toggle[aria-expanded="false"]');
        if (!opacity) throw new Error('Reading opacity control missing');
        [...document.querySelectorAll('.game-tools button')].find(button => button.textContent.includes('隐藏界面')).click();
        await delay(100);
        if (document.querySelector('.story-controls').getBoundingClientRect().height !== 0) throw new Error('Picture mode did not hide UI');
        document.querySelector('[aria-label="恢复阅读界面"]').click();
        await delay(100);
        if (document.querySelector('.game-screen').dataset.line !== '1') throw new Error('Restoring UI advanced the story');
        return { title: document.title, story: true, autosave: true, fullscreen: true, stageSeparated: true, fullWindowArtwork: true, opacityControl: true, pictureMode: true, sandbox: true };
      })()`);
      const fixtures = require('./smoke-fixtures.json');
      const edition = await window.webContents.executeJavaScript(`(async () => {
        const fixtures = ${JSON.stringify(fixtures)};
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        const wait = async predicate => { for (let i = 0; i < 200; i++) { if (predicate()) return; await delay(25); } throw new Error('Complete-edition UI timed out'); };
        const button = name => [...document.querySelectorAll('button')].find(item => (item.textContent.trim() === name || item.getAttribute('aria-label') === name) && item.getBoundingClientRect().height > 0);
        const importSave = async state => {
          document.querySelector('[aria-label="返回标题"]')?.click();
          await wait(() => button('存档迁移'));
          button('存档迁移').click(); await delay(50);
          const file = new File([JSON.stringify({ schema: 1, game: 'moist-healing', savedAt: new Date().toISOString(), state })], 'smoke.json', { type: 'application/json' });
          const data = new DataTransfer(); data.items.add(file);
          const input = document.querySelector('input[type="file"]'); input.files = data.files; input.dispatchEvent(new Event('change', { bubbles: true }));
          await wait(() => document.querySelector('.confirm-actions .primary'));
          document.querySelector('.confirm-actions .primary').click();
          await wait(() => document.querySelector('.game-screen')?.dataset.scene === state.sceneId);
        };
        await importSave(fixtures.legacy);
        await wait(() => button('下一章 · 显影'));
        button('下一章 · 显影').click();
        await wait(() => document.querySelector('.game-screen')?.dataset.scene === 'c2-open');
        const migrated = JSON.parse(localStorage.getItem('moist-healing:v1:save:auto')).state;
        if (migrated.storyVersion !== 'moist-healing-v1' || JSON.stringify(migrated.decisions) !== JSON.stringify(fixtures.legacy.decisions)) throw new Error('Legacy route lost during continuation');
        await importSave(fixtures.cg);
        await wait(() => document.querySelector('.scene-event')?.naturalWidth >= 1600);
        if (document.querySelector('.scene-character')) throw new Error('CG duplicates character sprite');
        await importSave(fixtures.final);
        await wait(() => button('制作人员'));
        button('制作人员').click();
        await wait(() => document.querySelector('.credits-copy'));
        button('关闭').click(); button('回到标题').click();
        await wait(() => button('回忆')); button('回忆').click();
        await wait(() => document.querySelector('.cg-card:not(:disabled)'));
        document.querySelector('.cg-card:not(:disabled)').click();
        await wait(() => document.querySelector('.cg-view img')?.naturalWidth >= 1600);
        return { legacyContinuation: true, completeEnding: true, packagedCg: true, credits: true, memory: true };
      })()`);
      window.hide();
      console.log('DESKTOP_SMOKE_OK', JSON.stringify({ ...result, ...edition, hiddenWindow: !window.isVisible() }));
      app.exit(0);
    } catch (error) { console.error(error); app.exit(1); }
  });
  void window.loadFile(index);
}
app.whenReady().then(openWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) openWindow(); });
