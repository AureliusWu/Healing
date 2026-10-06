// Original, sparse procedural score. No network, recordings, or API keys.
// Audio is unlocked only by a player gesture and suspended while hidden.
export class Music {
  private context?: AudioContext;
  private gain?: GainNode;
  private timer?: ReturnType<typeof setInterval>;
  private cursor = 0;
  private enabled = false;
  private volume = 0.2;
  private notes = [62, 69, 66, 73, 71, 66, 64, 69, 62, 66, 69, 74, 73, 69, 66, 64];

  async unlock() {
    if (!this.enabled || document.hidden) return;
    try {
      this.context ??= new AudioContext();
      this.gain ??= this.context.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(this.context.destination);
      await this.context.resume();
      if (!this.timer) {
        this.tick();
        this.timer = setInterval(() => this.tick(), 1600);
      }
    } catch { /* Reading still works if this browser disables Web Audio. */ }
  }
  configure(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = volume;
    if (this.context && this.gain) this.gain.gain.setTargetAtTime(enabled ? volume : 0, this.context.currentTime, 0.1);
    if (!enabled) this.pause();
  }
  pause() {
    clearInterval(this.timer);
    this.timer = undefined;
    void this.context?.suspend();
  }
  private tick() {
    if (!this.context || !this.gain || !this.enabled) return;
    const note = this.notes[this.cursor++ % this.notes.length];
    const start = this.context.currentTime;
    for (const [pitch, strength] of [[note, 0.2], [note - 12, 0.055]] as const) {
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 440 * Math.pow(2, (pitch - 69) / 12);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(strength, start + 0.015);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + 3.8);
      oscillator.connect(envelope);
      envelope.connect(this.gain);
      oscillator.start(start);
      oscillator.stop(start + 4);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    }
  }
}
export const music = new Music();
