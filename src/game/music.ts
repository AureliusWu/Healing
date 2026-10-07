import { scoreInfo } from './score';
import type { MusicId, Settings } from './types';

// One audio graph and one scheduler, unlocked by a gesture, suspended when hidden.
export class Music {
  private context?: AudioContext;
  private musicBus?: GainNode;
  private rainBus?: GainNode;
  private effectsBus?: GainNode;
  private timer?: ReturnType<typeof setInterval>;
  private pending?: Promise<void>;
  private allowed = false;
  private options: Pick<Settings, 'music' | 'volume' | 'soundEffects' | 'ambience'> = { music: true, volume: .2, soundEffects: true, ambience: true };
  private track: MusicId = 'rain';
  private raining = false;
  private cursor = 0;
  private nextBeat = 0;
  private voices = new Set<GainNode>();

  configure(options: Pick<Settings, 'music' | 'volume' | 'soundEffects' | 'ambience'>) {
    this.options = options; this.levels();
    if (!options.music) { clearInterval(this.timer); this.timer = undefined; this.fade(); }
    if (!options.music && !options.soundEffects && !options.ambience) this.pause();
    else if (this.allowed && !document.hidden) void this.resume();
  }
  setScene(track: MusicId, rain = false) {
    this.raining = rain;
    if (this.track !== track) { this.track = track; this.cursor = 0; this.fade(); this.nextBeat = this.context?.currentTime ?? 0; }
    this.levels();
    if (this.allowed && !document.hidden) void this.resume();
  }
  async unlock() { this.allowed = true; await this.resume(); }
  private async resume() {
    if (document.hidden || (!this.options.music && !this.options.soundEffects && !this.options.ambience)) return;
    if (this.pending) return this.pending;
    this.pending = this.start();
    try { await this.pending; } finally { this.pending = undefined; }
  }
  private async start() {
    try {
      if (!this.context) {
        const context = new AudioContext(); this.context = context;
        const master = context.createGain(); master.gain.value = .75; master.connect(context.destination);
        this.musicBus = context.createGain(); this.musicBus.gain.value = 0; this.musicBus.connect(master);
        this.rainBus = context.createGain(); this.rainBus.gain.value = 0; this.rainBus.connect(master);
        this.effectsBus = context.createGain(); this.effectsBus.gain.value = 0; this.effectsBus.connect(master);
        const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
        const samples = buffer.getChannelData(0); let seed = 714;
        for (let i = 0; i < samples.length; i++) { seed = (1664525 * seed + 1013904223) >>> 0; samples[i] = (seed / 4294967296 * 2 - 1) * .35; }
        const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
        const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 2400;
        source.connect(filter); filter.connect(this.rainBus); source.start();
      }
      await this.context.resume();
      if (document.hidden) { this.pause(); return; }
      this.levels();
      if (this.options.music && !this.timer) {
        this.nextBeat = this.context.currentTime; this.schedule(); this.timer = setInterval(() => this.schedule(), 100);
      }
    } catch { /* Reading also works without Web Audio. */ }
  }
  private levels() {
    if (!this.context) return;
    const t = this.context.currentTime;
    this.musicBus?.gain.setTargetAtTime(this.options.music ? this.options.volume : 0, t, .2);
    this.rainBus?.gain.setTargetAtTime(this.raining && this.options.ambience ? this.options.volume * .24 : 0, t, .3);
    this.effectsBus?.gain.setTargetAtTime(this.options.soundEffects ? this.options.volume : 0, t, .05);
  }
  pause() { clearInterval(this.timer); this.timer = undefined; this.fade(); void this.context?.suspend(); }
  effect(kind: 'page' | 'choice') {
    if (!this.allowed || !this.options.soundEffects || document.hidden || !this.context || this.context.state !== 'running' || !this.effectsBus) return;
    const t = this.context.currentTime, oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.frequency.setValueAtTime(kind === 'choice' ? 660 : 370, t);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'choice' ? 440 : 210, t + .07);
    gain.gain.setValueAtTime(.045, t); gain.gain.exponentialRampToValueAtTime(.0001, t + .1);
    oscillator.connect(gain); gain.connect(this.effectsBus); oscillator.start(t); oscillator.stop(t + .12);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  private fade() {
    if (!this.context) return;
    for (const gain of this.voices) { gain.gain.cancelScheduledValues(this.context.currentTime); gain.gain.setTargetAtTime(0, this.context.currentTime, .08); }
  }
  private note(pitch: number, t: number, duration: number, strength: number) {
    if (!pitch || !this.context || !this.musicBus) return;
    const oscillator = this.context.createOscillator(), gain = this.context.createGain(); this.voices.add(gain);
    oscillator.frequency.value = 440 * 2 ** ((pitch - 69) / 12);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(strength, t + .035);
    gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    oscillator.connect(gain); gain.connect(this.musicBus); oscillator.start(t); oscillator.stop(t + duration + .05);
    oscillator.onended = () => { this.voices.delete(gain); oscillator.disconnect(); gain.disconnect(); };
  }
  private schedule() {
    if (!this.context || !this.options.music || this.context.state !== 'running') return;
    const score = scoreInfo[this.track];
    if (this.nextBeat < this.context.currentTime - .5) this.nextBeat = this.context.currentTime;
    while (this.nextBeat < this.context.currentTime + .18) {
      const beat = this.cursor++; this.note(score.melody[beat % 16], this.nextBeat, score.beat * 2.8, .19);
      if (beat % 4 === 0) score.chords[Math.floor(beat / 4) % 4].forEach((pitch, i) => this.note(pitch, this.nextBeat + i * .025, score.beat * 5, .022));
      this.nextBeat += score.beat;
    }
  }
}
export const music = new Music();
