import { useEffect, useRef } from 'react';
import { music } from './game/music';
import { sceneCueAt } from './game/scene-cues';

/** A sound belongs to a reading visit, never to typing or a menu render. */
export function useSceneCue(scene: string, line: number, session: number, reading: boolean) {
  const played = useRef<string | undefined>(undefined);
  useEffect(() => {
    const cue = sceneCueAt(scene, line), visit = `${scene}/${line}/${session}`;
    if (!reading || !cue || played.current === visit) return;
    let active = true;
    void music.unlock().then(() => {
      if (!active || document.hidden) return;
      music.event(cue); played.current = visit;
    });
    return () => { active = false; };
  }, [scene, line, session, reading]);
}
