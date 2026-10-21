import { afterEach, describe, expect, it, vi } from 'vitest';
import { SceneLoop } from '../src/game/sceneLoop';

const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function setup() {
  const sources: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[] = [];
  const context = {
    state: 'running', currentTime: 0,
    decodeAudioData: vi.fn(async () => ({ duration: 10, length: 441000, numberOfChannels: 2 })),
    createBufferSource: () => {
      const source = { start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(), connect: vi.fn(), loop: false };
      sources.push(source); return source;
    },
    createGain: () => ({ connect: vi.fn(), disconnect: vi.fn(), gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn(), setTargetAtTime: vi.fn() } }),
  };
  // Web Audio connect returns the destination, including when chained.
  const create = context.createBufferSource;
  context.createBufferSource = () => { const source = create(); source.connect.mockImplementation(destination => destination); return source; };
  return { context, sources, loop: new SceneLoop(context as unknown as AudioContext, {} as GainNode) };
}
afterEach(() => vi.unstubAllGlobals());
describe('scene music lifecycle', () => {
  it('aborts the previous download and does not decode its late response', async () => {
    const requests: { signal: AbortSignal; resolve: (response: unknown) => void }[] = [];
    vi.stubGlobal('fetch', vi.fn((_url: string, options: RequestInit) => new Promise(resolve => {
      requests.push({ signal: options?.signal as AbortSignal, resolve });
    })));
    const { loop, context, sources } = setup();
    loop.select('/old.ogg'); loop.select('/new.ogg');
    expect(requests[0].signal?.aborted).toBe(true);
    requests[0].resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) });
    await tick(); expect(context.decodeAudioData).not.toHaveBeenCalled();
    requests[1].resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) });
    await tick(); expect(sources).toHaveLength(1);
    loop.dispose();
  });
  it('keeps only two recently used decoded tracks and reloads an evicted one', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }));
    vi.stubGlobal('fetch', fetcher);
    const { loop, context } = setup();
    context.decodeAudioData.mockResolvedValue({ duration: 10, length: 441000, numberOfChannels: 2 });
    for (const url of ['/a.ogg', '/b.ogg', '/c.ogg', '/b.ogg']) { loop.select(url); await tick(); }
    expect(fetcher.mock.calls).toHaveLength(3);
    loop.select('/a.ogg'); await tick(); expect(fetcher.mock.calls).toHaveLength(4);
    loop.dispose();
  });
  it('does not retain a decoded track larger than the 32 MiB cache budget', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }));
    vi.stubGlobal('fetch', fetcher);
    const { loop, context, sources } = setup();
    context.decodeAudioData.mockResolvedValue({ duration: 1000, length: 9 * 1024 * 1024, numberOfChannels: 1 });
    loop.select('/large.ogg'); await tick(); expect(sources).toHaveLength(1);
    loop.select(undefined); loop.select('/large.ogg'); await tick();
    expect(fetcher.mock.calls).toHaveLength(2);
    loop.dispose();
  });
  it('limits combined PCM bytes even when both individual tracks fit', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }));
    vi.stubGlobal('fetch', fetcher);
    const { loop, context } = setup();
    context.decodeAudioData.mockResolvedValue({ duration: 100, length: 5 * 1024 * 1024, numberOfChannels: 1 });
    for (const url of ['/a.ogg', '/b.ogg', '/a.ogg']) { loop.select(url); await tick(); }
    expect(fetcher.mock.calls).toHaveLength(3);
    loop.dispose();
  });
  it('a cancelled decode cannot populate the cache or clear a replacement request', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }));
    vi.stubGlobal('fetch', fetcher);
    const { loop, context, sources } = setup();
    let finish!: (buffer: { duration: number; length: number; numberOfChannels: number }) => void;
    context.decodeAudioData.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    loop.select('/old.ogg'); await tick();
    loop.select('/new.ogg'); await tick();
    finish({ duration: 10, length: 441000, numberOfChannels: 2 }); await tick();
    expect(sources).toHaveLength(1);
    loop.select('/old.ogg'); await tick(); expect(fetcher.mock.calls).toHaveLength(3);
    loop.dispose();
  });
  it('does not start a previous scene after its download finishes late', async () => {
    let complete!: (response: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { complete = resolve; })));
    const { loop, sources } = setup();
    loop.select('/old.ogg'); loop.select(undefined);
    complete({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }); await tick();
    expect(sources).toHaveLength(0);
  });
  it('starts once, preserves playback across repeated configuration and fades on scene exit', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }));
    vi.stubGlobal('fetch', fetcher);
    const { loop, sources, context } = setup();
    loop.select('/current.ogg'); loop.select('/current.ogg'); await tick();
    expect(sources).toHaveLength(1); expect(sources[0].start).toHaveBeenCalledTimes(1);
    context.state = 'suspended'; await loop.ensure(); context.state = 'running'; await loop.ensure();
    expect(sources).toHaveLength(1); expect(fetcher).toHaveBeenCalledTimes(1);
    loop.select(undefined); expect(sources[0].stop).toHaveBeenCalledTimes(1);
  });
  it('retries a missing file and disposal prevents an in-flight decode from starting', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    const { loop, sources } = setup(); loop.select('/retry.ogg'); await tick();
    expect(sources).toHaveLength(0);
    let complete!: (response: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { complete = resolve; })));
    void loop.ensure(); loop.dispose();
    complete({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }); await tick();
    expect(sources).toHaveLength(0);
  });
});
