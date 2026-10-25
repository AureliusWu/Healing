import { expect, it } from 'vitest';
import { scenes } from '../src/story';
import { sceneCues, sceneCueAt } from '../src/game/scene-cues';
it('binds every event to its authored action without duplicate triggers', () => {
  const seen = new Set<string>();
  for (const cue of sceneCues) {
    const key = `${cue.scene}/${cue.line}`;
    expect(seen.has(key)).toBe(false); seen.add(key);
    expect(scenes.find(scene => scene.id === cue.scene)?.lines[cue.line]?.text, key).toContain(cue.anchor);
    expect(sceneCueAt(cue.scene, cue.line)).toBe(cue.cue);
  }
  expect(sceneCueAt('not-an-event', 0)).toBeUndefined();
});

