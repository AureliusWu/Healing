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
  window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  window.webContents.session.setPermissionCheckHandler(() => false);
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
        return { title: document.title, story: true, autosave: true, sandbox: true };
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
