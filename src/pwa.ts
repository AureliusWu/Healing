type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type PwaState = {
  status: 'desktop' | 'unsupported' | 'downloading' | 'ready' | 'error';
  online: boolean;
  installed: boolean;
  canInstall: boolean;
  updateReady: boolean;
  checking: boolean;
  message: string;
};

const desktop = location.protocol === 'file:';
const supported = !desktop && import.meta.env.PROD && isSecureContext && 'serviceWorker' in navigator;
const displayMode = window.matchMedia('(display-mode: standalone)');
let state: PwaState = {
  status: desktop ? 'desktop' : supported ? 'downloading' : 'unsupported',
  online: navigator.onLine,
  installed: displayMode.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone,
  canInstall: false,
  updateReady: false,
  checking: false,
  message: '',
};
const listeners = new Set<() => void>();
let installEvent: InstallEvent | null = null;
let registration: ServiceWorkerRegistration | null = null;
let started = false;
let registering: Promise<void> | null = null;

function change(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  listeners.forEach(listener => listener());
}

function watchWorker(worker: ServiceWorker, owner: ServiceWorkerRegistration) {
  const changed = () => {
    if (worker.state === 'installed' && owner.active) {
      change({ updateReady: true, checking: false, message: '新版本已下载。关闭所有游戏窗口，再次打开即可更新。' });
    }
    if (worker.state === 'redundant') {
      change({ checking: false, ...(!owner.active ? { status: 'error' as const } : {}), message: '下载未完成，请联网后重试。当前阅读进度会保留。' });
    }
  };
  worker.addEventListener('statechange', changed);
  changed();
}

async function register() {
  if (!supported || registering) return registering;
  change({ status: registration?.active ? 'ready' : 'downloading', message: '' });
  registering = (async () => {
    try {
      registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' });
      const owner = registration;
      owner.addEventListener('updatefound', () => {
        if (owner.installing) watchWorker(owner.installing, owner);
      });
      if (owner.installing) watchWorker(owner.installing, owner);
      if (owner.waiting) change({ updateReady: true, message: '新版本已下载。关闭所有游戏窗口，再次打开即可更新。' });
      // ready resolves only after the atomically cached worker has activated.
      void navigator.serviceWorker.ready.then(() => change({ status: 'ready' }));
    } catch {
      change({ status: registration?.active ? 'ready' : 'error', checking: false, message: '离线下载未完成，请联网后重试。' });
    }
  })().finally(() => { registering = null; });
  return registering;
}

export const pwa = {
  getState: () => state,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  start() {
    if (started) return;
    started = true;
    window.addEventListener('online', () => change({ online: true }));
    window.addEventListener('offline', () => change({ online: false }));
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      installEvent = event as InstallEvent;
      change({ canInstall: !state.installed });
    });
    window.addEventListener('appinstalled', () => {
      installEvent = null;
      change({ installed: true, canInstall: false, message: '已安装，可以从桌面或主屏幕打开。' });
    });
    displayMode.addEventListener('change', () => change({ installed: displayMode.matches, canInstall: !displayMode.matches && !!installEvent }));
    void register();
  },
  retry: register,
  async install() {
    const event = installEvent;
    if (!event) return;
    installEvent = null;
    change({ canInstall: false, message: '' });
    try {
      await event.prompt();
      const choice = await event.userChoice;
      change({ message: choice.outcome === 'accepted' ? '安装已确认。完成后可从桌面或主屏幕打开。' : '可以稍后通过浏览器菜单安装。' });
    } catch { change({ message: '请使用浏览器菜单中的“安装应用”或“添加到主屏幕”。' }); }
  },
  async checkUpdate() {
    if (!registration || state.checking) return;
    if (!navigator.onLine) { change({ message: '当前处于离线状态，联网后可以检查更新。' }); return; }
    change({ checking: true, message: '正在检查版本…' });
    try {
      await registration.update();
      if (registration.waiting || state.updateReady) change({ updateReady: true, message: '新版本已下载。关闭所有游戏窗口，再次打开即可更新。' });
      else change({ message: registration.installing ? '正在下载新版本，可以继续阅读。' : '已经是最新版本。' });
    } catch { change({ message: '暂时无法检查更新。请联网后重试。' }); }
    finally { change({ checking: false }); }
  },
};
