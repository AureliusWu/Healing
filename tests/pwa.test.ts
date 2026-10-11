import { afterEach, describe, expect, it, vi } from 'vitest';

class Worker extends EventTarget {
  constructor(public state: ServiceWorkerState) { super(); }
  transition(state: ServiceWorkerState) { this.state = state; this.dispatchEvent(new Event('statechange')); }
}
class Registration extends EventTarget {
  active: Worker | null = null;
  installing: Worker | null = null;
  waiting: Worker | null = null;
  update = vi.fn(async () => this);
}

async function setup(owner: Registration) {
  vi.resetModules();
  const windowEvents = new EventTarget();
  const media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('window', Object.assign(windowEvents, { matchMedia: () => media }));
  vi.stubGlobal('location', { protocol: 'https:' });
  vi.stubGlobal('isSecureContext', true);
  // An unrelated parent worker is already ready. It must not prove our download.
  const register = vi.fn(async () => owner);
  vi.stubGlobal('navigator', { onLine: true, serviceWorker: { register, ready: Promise.resolve(new Registration()) } });
  vi.stubEnv('PROD', true);
  vi.stubEnv('BASE_URL', './');
  const { pwa } = await import('../src/pwa');
  return { pwa, register };
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('PWA readiness belongs to the game registration', () => {
  it('does not mark ready from an unrelated ready registration', async () => {
    const owner = new Registration(); owner.installing = new Worker('installing');
    const { pwa, register } = await setup(owner);
    await pwa.retry();
    await Promise.resolve();
    expect(register).toHaveBeenCalledWith('./sw.js', { updateViaCache: 'none' });
    expect(pwa.getState().status).toBe('downloading');
    const worker = owner.installing;
    owner.active = worker; owner.installing = null;
    worker.transition('activated');
    expect(pwa.getState().status).toBe('ready');
  });

  it('recognizes its existing activated worker on an offline reopen', async () => {
    const owner = new Registration(); owner.active = new Worker('activated');
    const { pwa } = await setup(owner);
    await pwa.retry();
    expect(pwa.getState().status).toBe('ready');
  });

  it('does not report an activating worker as ready before activation completes', async () => {
    const owner = new Registration(); owner.active = new Worker('activating');
    const { pwa } = await setup(owner);
    await pwa.retry();
    expect(pwa.getState().status).toBe('downloading');
    owner.active.transition('activated');
    expect(pwa.getState().status).toBe('ready');
  });

  it('shows failed first download and lets a subsequent registration recover', async () => {
    const owner = new Registration(); owner.installing = new Worker('installing');
    const { pwa, register } = await setup(owner);
    await pwa.retry(); owner.installing.transition('redundant');
    expect(pwa.getState().status).toBe('error');
    const replacement = new Registration(); replacement.active = new Worker('activated');
    register.mockResolvedValue(replacement);
    await pwa.retry();
    expect(pwa.getState().status).toBe('ready');
    expect(pwa.getState().message).toBe('');
    owner.installing.transition('redundant');
    expect(pwa.getState().status).toBe('ready');
  });

  it('keeps the current cache usable when an update fails', async () => {
    const owner = new Registration(); owner.active = new Worker('activated');
    owner.installing = new Worker('installing');
    const { pwa } = await setup(owner); await pwa.retry();
    owner.installing.transition('redundant');
    expect(pwa.getState().status).toBe('ready');
    expect(pwa.getState().message).toContain('下载未完成');
  });

  it('waits for window closure on a downloaded update instead of activating it', async () => {
    const owner = new Registration(); owner.active = new Worker('activated');
    owner.installing = new Worker('installing');
    const { pwa } = await setup(owner); await pwa.retry();
    owner.waiting = owner.installing; owner.waiting.transition('installed');
    expect(pwa.getState().status).toBe('ready');
    expect(pwa.getState().updateReady).toBe(true);
    expect(pwa.getState().message).toContain('关闭所有游戏窗口');
  });

  it('a registration exception can be retried without a stuck pending promise', async () => {
    const owner = new Registration(); owner.active = new Worker('activated');
    const { pwa, register } = await setup(owner);
    register.mockRejectedValueOnce(new Error('Network unavailable'));
    await pwa.retry(); expect(pwa.getState().status).toBe('error');
    await pwa.retry(); expect(pwa.getState().status).toBe('ready');
    expect(register).toHaveBeenCalledTimes(2);
  });
});
