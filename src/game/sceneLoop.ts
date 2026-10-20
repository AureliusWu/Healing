/** Local loop on the existing music bus; a late decode cannot revive an old scene. */
export class SceneLoop {
  private wanted?: string;
  private source?: AudioBufferSourceNode;
  private level?: GainNode;
  private generation = 0;
  private disposed = false;
  private buffers = new Map<string, Promise<AudioBuffer>>();

  constructor(private context: AudioContext, private bus: GainNode) {}

  select(url?: string) {
    if (this.disposed) return;
    if (url !== this.wanted) {
      this.generation++;
      this.release();
      this.wanted = url;
    }
    void this.ensure();
  }

  async ensure() {
    const url = this.wanted, generation = this.generation;
    if (!url || this.source || this.disposed || this.context.state !== 'running') return;
    try {
      let pending = this.buffers.get(url);
      if (!pending) {
        pending = fetch(url).then(response => {
          if (!response.ok) throw new Error('Scene music unavailable');
          return response.arrayBuffer();
        }).then(bytes => this.context.decodeAudioData(bytes));
        this.buffers.set(url, pending);
      }
      const buffer = await pending;
      if (generation !== this.generation || url !== this.wanted || this.source || this.disposed || this.context.state !== 'running') return;
      const source = this.context.createBufferSource(), level = this.context.createGain();
      source.buffer = buffer;
      source.loop = true;
      level.gain.setValueAtTime(0, this.context.currentTime);
      level.gain.linearRampToValueAtTime(1, this.context.currentTime + .5);
      source.connect(level).connect(this.bus);
      source.onended = () => { source.disconnect(); level.disconnect(); };
      this.source = source;
      this.level = level;
      source.start();
    } catch {
      this.buffers.delete(url);
      // A missing file does not block dialogue, saves or later playback retries.
    }
  }

  private release() {
    if (!this.source) return;
    const now = this.context.currentTime;
    this.level?.gain.cancelScheduledValues(now);
    this.level?.gain.setTargetAtTime(0, now, .08);
    try { this.source.stop(now + .4); } catch { /* Already ended. */ }
    this.source = undefined;
    this.level = undefined;
  }

  dispose() {
    this.disposed = true;
    this.generation++;
    this.wanted = undefined;
    this.release();
    this.buffers.clear();
  }
}
