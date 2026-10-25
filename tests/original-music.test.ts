import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { scoreInfo } from '../src/game/score';
import type { MusicId } from '../src/game/types';
const manifest = JSON.parse(readFileSync('docs/audio/original-music-20261024.json', 'utf8'));
describe('original music delivery contract', () => {
  it('ships exact complete OGG loops, scores and the sample license', () => {
    expect(manifest.tracks).toHaveLength(2); expect(readFileSync(manifest.soundfontLicense, 'utf8')).toContain('GeneralUser');
    for (const track of manifest.tracks) {
      const bytes = readFileSync(track.runtime); expect(bytes.subarray(0, 4).toString()).toBe('OggS');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(track.sha256); expect(track.vocals).toBe(false);
      expect(track.loopFrames / track.loopSampleRate).toBeCloseTo(track.loopDurationSeconds, 4);
      expect(readFileSync(track.midi).subarray(0, 4).toString()).toBe('MThd'); expect(JSON.parse(readFileSync(track.score, 'utf8'))).toBeTruthy();
    }
  });
  it('maps local originals through the existing saved music identities', () => {
    for (const track of manifest.tracks) for (const id of track.bindings as MusicId[]) { expect(scoreInfo[id].title).toBe(track.title); expect('public/' + scoreInfo[id].file).toBe(track.runtime); }
    expect(Object.keys(scoreInfo).sort()).toEqual(['after-rain','distance','evening','proof-confirmed','rain','window','workshop'].sort());
  });
  it('keeps the event score and procedural alternatives playable', () => { expect(scoreInfo['proof-confirmed'].file).toBe('audio/bgm/proof-confirmed.ogg'); expect(scoreInfo.workshop.melody).not.toHaveLength(0); });
});
