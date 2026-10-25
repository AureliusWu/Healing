/* Offline sample-accurate rendering; no WebAudio or network in the render step. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const Fluid = require('js-synthesizer/libfluidsynth');
const JSSynth = require('js-synthesizer');
JSSynth.Synthesizer.initializeWithFluidSynthModule(Fluid);

async function render(scorePath, fontPath, mode, output) {
  await JSSynth.waitForReady();
  const score = JSON.parse(fs.readFileSync(scorePath, 'utf8'));
  const sampleRate = score.sampleRate;
  const beatFrames = sampleRate * 60 / score.bpm;
  const loopBeats = score.loopEndBeat - score.loopStartBeat;
  // Align repeated cycles to FluidSynth's internal render quantum. The sub-ms
  // adjustment is retained as an exact frame count in the delivered manifest.
  const cycleFrames = Math.round(loopBeats * beatFrames / 64) * 64;
  const repeat = mode === 'loop' ? 3 : 1;
  const events = [];
  // Keep anticipations belonging to the first loop bar. Selecting on a
  // humanized timestamp alone could drop an entire downbeat played 5 ms early.
  const sourceNotes = mode === 'loop' ? score.notes.filter(n => (n.gridBeat ?? n.beat) >= score.loopStartBeat && (n.gridBeat ?? n.beat) < score.loopEndBeat) : score.notes;
  const sourceControls = mode === 'loop' ? score.controls.filter(n => n.beat >= score.loopStartBeat && n.beat < score.loopEndBeat) : score.controls;
  for (let cycle = 0; cycle < repeat; cycle++) {
    const origin = mode === 'loop' ? cycle * cycleFrames : 0;
    const offset = mode === 'loop' ? score.loopStartBeat : 0;
    for (const n of sourceNotes) {
      const on = origin + Math.round((n.beat - offset) * beatFrames);
      const off = on + Math.round(n.length * beatFrames);
      events.push({frame: on, priority: 2, kind: 'on', n});
      events.push({frame: off, priority: 0, kind: 'off', n});
    }
    for (const c of sourceControls) events.push({frame: origin + Math.round((c.beat - offset) * beatFrames), priority: 1, kind: 'control', n: c});
  }
  events.sort((a,b) => a.frame-b.frame || a.priority-b.priority);
  const synth = new JSSynth.Synthesizer();
  synth.init(sampleRate, { initialGain: .55, polyphony: 256, chorusActive: false,
    reverbActive: true, reverbRoomSize: score.project === 'Circuit' ? .72 : .58,
    reverbDamp: .58, reverbLevel: score.project === 'Circuit' ? .26 : .19, reverbWidth: 72 });
  synth.setInterpolation(4);
  const bytes = fs.readFileSync(fontPath);
  const sfid = await synth.loadSFont(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  for (const c of score.channels) {
    synth.midiSetChannelType(c.channel, c.channel === 9);
    synth.midiProgramSelect(c.channel, sfid, c.channel === 9 ? 128 : 0, c.program);
    synth.midiControl(c.channel,7,c.volume);
    synth.midiControl(c.channel,10,c.pan);
    synth.midiControl(c.channel,91,48);
  }
  const total = mode === 'loop' ? 3*cycleFrames : Math.round(score.beats*beatFrames + score.tailSeconds*sampleRate);
  const captureStart = mode === 'loop' ? cycleFrames : 0;
  const captureEnd = mode === 'loop' ? 2*cycleFrames : total;
  const fd = fs.openSync(output,'w');
  let cursor=0,index=0,written=0;
  try {
    while (cursor < total) {
      while(index < events.length && events[index].frame <= cursor) {
        const e=events[index++],n=e.n;
        if(e.kind==='on')synth.midiNoteOn(n.channel,n.pitch,n.velocity);
        else if(e.kind==='off')synth.midiNoteOff(n.channel,n.pitch);
        else synth.midiControl(n.channel,n.control,n.value);
      }
      const next=index<events.length?events[index].frame:total;
      const frames=Math.min(2048,total-cursor,Math.max(1,next-cursor));
      const left=new Float32Array(frames),right=new Float32Array(frames);
      synth.render([left,right]);
      const start=Math.max(0,captureStart-cursor),end=Math.min(frames,captureEnd-cursor);
      if(end>start){
        const pcm=Buffer.allocUnsafe((end-start)*8);
        for(let i=start;i<end;i++){
          if(!Number.isFinite(left[i])||!Number.isFinite(right[i]))throw Error('Non-finite rendered audio');
          pcm.writeFloatLE(left[i],(i-start)*8);pcm.writeFloatLE(right[i],(i-start)*8+4);
        }
        fs.writeSync(fd,pcm);written+=end-start;
      }
      cursor+=frames;
    }
  } finally {fs.closeSync(fd);synth.close();}
  const expected=captureEnd-captureStart;
  if(written!==expected)throw Error('Wrong frame count');
  console.log(JSON.stringify({id:score.id,mode,frames:written,seconds:written/sampleRate,output}));
}
const [score,font,mode,output]=process.argv.slice(2);
if(!score||!font||!['master','loop'].includes(mode)||!output)throw Error('Usage: node render.cjs SCORE FONT master|loop OUTPUT.f32');
render(score,font,mode,output).catch(error=>{console.error(error);process.exitCode=1;});
