import type { MusicId } from './types';

// Six original MIDI motifs and harmonic progressions; no external recordings.
export const scoreInfo: Record<MusicId, { title: string; description: string; beat: number; melody: number[]; chords: number[][] }> = {
  rain: { title: '九月的雨', description: '慢一点，让没说完的话停在窗边。', beat: .8, melody: [62,69,66,73,71,66,64,69,62,66,69,74,73,69,66,64], chords: [[50,57,62,66],[47,54,59,62],[43,50,55,59],[45,52,57,61]] },
  window: { title: '靠窗的空位', description: '钢笔、书页，与邻座小声的回应。', beat: .68, melody: [67,71,74,0,76,74,71,69,67,0,69,71,74,71,69,0], chords: [[43,55,59,62],[40,52,55,59],[48,55,60,64],[50,57,62,66]] },
  workshop: { title: '一起把纸折好', description: '一段轻快节拍，留给旧刊室的下午。', beat: .48, melody: [72,76,79,76,74,0,71,74,69,72,76,0,67,71,74,0], chords: [[48,55,60,64],[43,55,59,62],[45,57,60,64],[41,53,57,60]] },
  distance: { title: '迟一点的答复', description: '悬着的和声，为等待保留呼吸。', beat: .92, melody: [64,0,67,71,69,0,66,64,62,0,66,69,67,66,64,0], chords: [[40,52,55,59],[48,55,59,62],[45,52,57,62],[47,54,59,64]] },
  evening: { title: '黄昏有空', description: '放学后，暂时不赶下一件事。', beat: .78, melody: [69,73,76,0,78,76,73,71,69,66,64,0,66,69,71,0], chords: [[45,57,61,64],[42,54,57,61],[50,57,62,66],[52,59,64,68]] },
  'after-rain': { title: '下一行', description: '雨停以后，继续写自己的那一页。', beat: .64, melody: [62,66,69,74,73,69,66,0,67,71,74,76,74,69,66,62], chords: [[50,57,62,66],[43,55,59,62],[47,54,59,62],[45,57,61,64]] },
};
