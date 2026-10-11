import { describe, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import { fingerprintFiles, renderWorker } from '../scripts/pwa-build.mjs';

const scope = 'https://example.test/Healing/';
const prefix = `moist-healing-v2:${encodeURIComponent(scope)}:`;
function workerHarness(options: { keys?: string[]; addAll?: (requests: Request[]) => Promise<void> } = {}) {
  const handlers = new Map<string, (event: unknown) => void>();
  const cache = { addAll: vi.fn(options.addAll || (async (_requests: Request[]) => {})), match: vi.fn(async (_request: Request | URL | string, _options?: CacheQueryOptions) => undefined as Response | undefined) };
  const caches = { open: vi.fn(async (_key: string) => cache), keys: vi.fn(async () => options.keys || []), delete: vi.fn(async (_key: string) => true) };
  const claim = vi.fn(async () => {});
  const fetch = vi.fn(async () => new Response('network'));
  runInNewContext(renderWorker({ namespace: 'moist-healing', version: 'new', urls: ['./index.html', './art/a%20b.webp'] }), { self: { registration: { scope }, location: { origin: 'https://example.test' }, clients: { claim }, addEventListener: (name: string, callback: (event: unknown) => void) => handlers.set(name, callback) }, caches, Request, Response, URL, fetch });
  async function lifecycle(name: string) {
    let result: Promise<unknown> | undefined;
    handlers.get(name)!({ waitUntil: (promise: Promise<unknown>) => { result = promise; } });
    return await result;
  }
  return { handlers, cache, caches, claim, fetch, lifecycle };
}

describe('PWA output identity and scoped lifecycle', () => {
  it('invalidates renamed assets even when their contents are unchanged', () => {
    const bytes = Buffer.from('same');
    expect(fingerprintFiles([{ name: 'a.webp', bytes }])).not.toBe(fingerprintFiles([{ name: 'b.webp', bytes }]));
  });
  it('frames file boundaries and sorts paths deterministically', () => {
    const a = { name: 'a', bytes: Buffer.from('ab') }, b = { name: 'b', bytes: Buffer.from('c') };
    expect(fingerprintFiles([a, b])).toBe(fingerprintFiles([b, a]));
    expect(fingerprintFiles([a, b])).not.toBe(fingerprintFiles([{ ...a, bytes: Buffer.from('a') }, { ...b, bytes: Buffer.from('bc') }]));
  });
  it('preloads absolute URLs in its own subpath and rejects an incomplete batch', async () => {
    const harness = workerHarness(); await harness.lifecycle('install');
    expect(harness.cache.addAll.mock.calls[0][0].map(request => request.url)).toEqual([scope + 'index.html', scope + 'art/a%20b.webp']);
    const failed = workerHarness({ addAll: async () => { throw new Error('asset missing'); } });
    await expect(failed.lifecycle('install')).rejects.toThrow('asset missing');
    expect(failed.claim).not.toHaveBeenCalled();
  });
  it('cleans only older caches in its exact scope, preserving sibling and legacy caches', async () => {
    const sibling = `moist-healing-v2:${encodeURIComponent('https://example.test/OtherHealing/')}:old`;
    const harness = workerHarness({ keys: [prefix + 'old', prefix + 'new', sibling, 'moist-healing-legacy', 'rain-v2:old'] });
    await harness.lifecycle('activate');
    expect(harness.caches.delete.mock.calls.map(call => call[0])).toEqual([prefix + 'old']);
    expect(harness.claim).toHaveBeenCalledOnce();
  });
  it('does not intercept another origin, sibling scope, or non-GET request', () => {
    const harness = workerHarness();
    for (const [url, method] of [['https://foreign.test/Healing/index.html', 'GET'], ['https://example.test/OtherHealing/index.html', 'GET'], [scope + 'index.html', 'POST']]) {
      const respondWith = vi.fn(); harness.handlers.get('fetch')!({ request: { url, method }, respondWith });
      expect(respondWith).not.toHaveBeenCalled();
    }
  });
  it('serves navigation from its cached scoped shell with Vary compatibility', async () => {
    const harness = workerHarness(); const response = new Response('offline shell'); harness.cache.match.mockResolvedValue(response);
    let result: Promise<Response> | undefined;
    harness.handlers.get('fetch')!({ request: { url: scope, method: 'GET', mode: 'navigate' }, respondWith: (promise: Promise<Response>) => { result = promise; } });
    expect(await (await result)!.text()).toBe('offline shell');
    expect(String(harness.cache.match.mock.calls[0][0])).toBe(scope + 'index.html');
    expect(harness.fetch).not.toHaveBeenCalled();
  });
});
