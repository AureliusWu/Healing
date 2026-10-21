import manifest from './full-voice-manifest.json';
import type { Line } from './types';
import type { VoiceClip } from './voice';
export type BoundVoiceClip = VoiceClip & { sceneId: string; lineIndex: number };
export const voiceClips = manifest.clips as BoundVoiceClip[];
export function voiceFor(sceneId: string, lineIndex: number, line: Line): BoundVoiceClip | undefined {
  return voiceClips.find(clip => clip.sceneId === sceneId && clip.lineIndex === lineIndex
    && clip.speaker === line.speaker && clip.text === line.text);
}
