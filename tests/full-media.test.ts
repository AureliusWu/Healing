import { expect, it } from 'vitest';
import { scenes } from '../src/story';
import { voiceFor, voiceClips } from '../src/game/voice-catalog';
import { cgAt, reachedCg, backgroundAt } from '../src/game/scene-media';
import { presentationAt } from '../src/game/presentation';
it('binds every authored human line and leaves narration silent', () => {
  let count=0;
  for(const scene of scenes) scene.lines.forEach((line,index) => {
    const clip=voiceFor(scene.id,index,line);
    if(['旁白','系统'].includes(line.speaker)) expect(clip).toBeUndefined();
    else { expect(clip,scene.id+'/'+index).toBeDefined(); expect(clip!.text).toBe(line.text); count++; }
  });
  expect(count).toBe(427); expect(voiceClips).toHaveLength(427);
});
it('shows ending art only at the reached paragraph and restores it from history', () => {
  const scene=scenes.find(s=>s.id==='end-letter')!;
  expect(cgAt(scene,scene.cgFrom!-1)).toBeUndefined();
  expect(cgAt(scene,scene.cgFrom!)).toBe('unsigned-letter');
  expect(reachedCg(scene,[],0)).toBeUndefined();
  expect(reachedCg(scene,[{sceneId:scene.id,line:scene.cgFrom!}])).toBe('unsigned-letter');
  const evening=scenes.find(s=>s.id==='evening')!;
  expect(backgroundAt(evening,0)).toBe('bus-stop'); expect(backgroundAt(evening,13)).toBe('bus-interior');
});
it('keeps remote family speech out of the current physical scene', () => {
  const scene=scenes.find(s=>s.id==='c2-home-plan')!;
  const index=scene.lines.findIndex(l=>l.speaker==='陈知遥');
  expect(index).toBeGreaterThanOrEqual(0); expect(presentationAt(scene,index).character).not.toBe('chen');
});
