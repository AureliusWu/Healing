import { afterEach, expect, it, vi } from 'vitest';
import { Music } from '../src/game/music';
afterEach(() => vi.unstubAllGlobals());
const options = { music: true, volume: .15, ambience: false, soundEffects: false };
function audio() {
  let finish!: () => void;
  const gain = () => ({ connect: (node: unknown) => node, gain: { value: 0, setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() } });
  const context = {
    state: 'suspended', sampleRate: 8, currentTime: 0, destination: {}, createGain: gain,
    createBuffer: () => ({ getChannelData: () => new Float32Array(32) }),
    createBufferSource: () => ({ connect: (node: unknown) => node, start: vi.fn(), loop: false, buffer: null }),
    createBiquadFilter: () => ({ connect: (node: unknown) => node, frequency: { value: 0 }, type: 'lowpass' }),
    resume: vi.fn(() => new Promise<void>(resolve => { finish = () => { context.state = 'running'; resolve(); }; })),
    suspend: vi.fn(async () => { context.state = 'suspended'; }),
  };
  const factory = vi.fn(function AudioContext() { return context; });
  vi.stubGlobal('document', { hidden: false }); vi.stubGlobal('AudioContext', factory);
  return { context, factory, finish: () => finish() };
}
it('a gesture inside a paused panel cannot create or resume the music graph', async () => {
  const { factory } = audio(); const music = new Music();
  music.setPaused(true); music.configure(options); music.setScene('window'); await music.unlock(); await music.unlock();
  expect(factory).not.toHaveBeenCalled(); music.pause();
});
it('a late AudioContext resume cannot undo a panel pause', async () => {
  const { context, finish } = audio(); const music = new Music(); music.configure(options); music.setScene('window');
  const pending = music.unlock(); music.setPaused(true); finish(); await pending;
  expect(context.state).toBe('suspended'); expect(context.suspend).toHaveBeenCalledTimes(2); music.pause();
});
