const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const smoke = process.argv.includes('--smoke-test');
if (smoke) app.setPath('userData', path.join(app.getPath('temp'), `moist-healing-smoke-${process.pid}`));
let window;
function openWindow() {
  const index = path.join(__dirname, '..', 'dist', 'index.html');
  const entry = pathToFileURL(index).href;
  window = new BrowserWindow({
    width: 1360, height: 860, minWidth: 800, minHeight: 560,
    title: '湿性愈合 · 生长痛', backgroundColor: '#f5f3e9',
    icon: path.join(__dirname, '..', 'dist', 'icons', 'icon-512.png'),
    show: false, autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true },
  });
  Menu.setApplicationMenu(null);
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
  window.once('ready-to-show', () => window.show());
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
      await window.webContents.executeJavaScript(`(async () => {
        document.querySelector('[aria-label="退出全屏"]').click();
        for (let i = 0; i < 100; i++) {
          if (!document.fullscreenElement && document.querySelector('[aria-label="全屏阅读"]')) return;
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        throw new Error('Fullscreen button failed to exit fullscreen');
      })()`, true);
      const result = await window.webContents.executeJavaScript(`(async () => {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        await delay(700);
        if (!document.querySelector('h1')?.textContent.includes('湿性愈合')) throw new Error('Title screen missing');
        if (typeof require !== 'undefined' || typeof process !== 'undefined') throw new Error('Renderer has Node access');
        if ([...document.images].some(image => !image.complete || image.naturalWidth === 0)) throw new Error('Artwork missing');
        document.querySelector('.start-button').click();
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
        [...document.querySelectorAll('.game-tools button')].find(button => button.textContent.includes('隐藏界面')).click();
        await delay(100);
        if (document.querySelector('.story-controls').getBoundingClientRect().height !== 0) throw new Error('Picture mode did not hide UI');
        document.querySelector('[aria-label="恢复阅读界面"]').click();
        await delay(100);
        if (document.querySelector('.game-screen').dataset.line !== '1') throw new Error('Restoring UI advanced the story');
        return { title: document.title, story: true, autosave: true, fullscreen: true, stageSeparated: true, pictureMode: true, sandbox: true };
      })()`);
      console.log('DESKTOP_SMOKE_OK', JSON.stringify(result));
      app.exit(0);
    } catch (error) { console.error(error); app.exit(1); }
  });
  void window.loadFile(index);
}
app.whenReady().then(openWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) openWindow(); });
