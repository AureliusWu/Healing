import {describe,expect,it} from 'vitest';
import baseline from '../docs/production/CREATIVE-BASELINE-v1.json';
import frames from '../src/game/character-frames.json';
import {auditRevision,validateFrames} from '../scripts/vn-creative.mjs';
import {scenes,cgInfo} from '../src/story';
describe('creative revision and mid-story illustration',()=>{
  it('keeps native positions/routes and attaches the proof event',()=>{
    expect(auditRevision(baseline,{scenes}).revisedParagraphs).toBe(23);
    expect(scenes.find(s=>s.id==='c2-proof')?.cg).toBe('proof');
    expect(cgInfo.proof.scene).toBe('c2-proof');expect(validateFrames(frames)).toBe(12);
  });
});
