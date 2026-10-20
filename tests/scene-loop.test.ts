import { afterEach, describe, expect, it, vi } from 'vitest';
import { SceneLoop } from '../src/game/sceneLoop';

const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
function setup() {
  const sources: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[] = [];
  const context = {
    state: 'running', currentTime: 0,
    decodeAudioData: vi.fn(async () => ({ duration: 10 })),
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
