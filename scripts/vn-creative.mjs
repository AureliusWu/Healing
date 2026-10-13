import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export const CREATIVE_VERSION = '1.0.0';
const digest = text => createHash('sha256').update(text).digest('hex');
const stable = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const selected = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]]));
const routingKeys = ['next','continuation','ending','resolve','bridge','chapterEnd','routes'];
export function snapshotStory(story) {
  const scenes = story.scenes ?? story.nodes;
  if (!Array.isArray(scenes) || !scenes.length) throw new Error('Expected authored scenes/nodes');
  const ids = new Set();
  const lineRecord = (line,index) => {
    if (typeof line.text !== 'string' || !line.text.trim() || typeof line.speaker !== 'string' || !line.speaker) throw new Error('Empty authored dialogue');
    return {id:line.id ?? String(index),speaker:line.speaker,textSha256:digest(line.text),voice:line.voice ?? null};
  };
  return {schema:1,engineContract:selected(story,['entry','initial_state','stats','expected_routes']),scenes:scenes.map(scene=>{
    if (!scene.id || ids.has(scene.id)) throw new Error(`Duplicate/empty scene ID: ${scene.id}`);
    ids.add(scene.id);
    return {id:scene.id,routing:selected(scene,routingKeys),lines:(scene.lines??[]).map(lineRecord),choices:(scene.choices??[]).map(choice=>({...selected(choice,['id','next','effect','effects']),response:(choice.response??[]).map(lineRecord)}))};
  })};
}
export function auditRevision(baseline,story) {
  if (baseline?.schema !== 1 || !Array.isArray(baseline.scenes)) throw new Error('Invalid review baseline');
  const current = snapshotStory(story);
  if (stable(baseline.engineContract)!==stable(current.engineContract)) throw new Error('Engine contract changed');
  if (stable(baseline.scenes.map(s=>s.id))!==stable(current.scenes.map(s=>s.id))) throw new Error('Scene order/IDs changed');
  const changes=[];let protectedVoices=0;
  const compare=(a,b,scene,section)=>{
    if(a.length!==b.length)throw new Error(`${scene}: paragraph count changed`);
    a.forEach((before,i)=>{const after=b[i];
      if(before.id!==after.id||before.speaker!==after.speaker||before.voice!==after.voice)throw new Error(`${scene}: dialogue identity changed at ${section} ${i}`);
      if(before.voice){protectedVoices++;if(before.textSha256!==after.textSha256)throw new Error(`${scene}: recorded sentence changed (${before.id}); regenerate and review voice first`);}
      if(before.textSha256!==after.textSha256)changes.push({scene,section,index:i,id:before.id});
    });
  };
  baseline.scenes.forEach((before,i)=>{const after=current.scenes[i];
    if(stable(before.routing)!==stable(after.routing))throw new Error(`${before.id}: route changed`);
    const contract=choices=>choices.map(({response,...choice})=>choice);
    if(stable(contract(before.choices))!==stable(contract(after.choices)))throw new Error(`${before.id}: choice effect/destination changed`);
    compare(before.lines,after.lines,before.id,'lines');
    before.choices.forEach((choice,j)=>compare(choice.response,after.choices[j].response,before.id,`choice:${j}`));
  });
  return {creativeVersion:CREATIVE_VERSION,scenes:current.scenes.length,revisedParagraphs:changes.length,protectedVoices,savePositionsPreserved:true,routeContractPreserved:true,changes};
}
export function validateFrames(catalog) {
  for(const [character,atlas]of Object.entries(catalog)){
    if(!Number.isInteger(atlas.width)||!Number.isInteger(atlas.height)||atlas.width<=0||atlas.height<=0||atlas.frames?.length!==6)throw new Error(`${character}: invalid six-expression atlas`);
    atlas.frames.forEach((frame,i)=>{const [x,y,w,h]=frame;
      if(frame.length!==4||!frame.every(Number.isInteger)||x<0||y<0||w<=0||h<=0||x+w>atlas.width||y+h>atlas.height)throw new Error(`${character}: frame ${i} leaves the actual atlas canvas`);
    });
  }
  return Object.keys(catalog).length;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{const [baseline,story]=process.argv.slice(2);console.log(JSON.stringify(auditRevision(JSON.parse(readFileSync(baseline,'utf8')),JSON.parse(readFileSync(story,'utf8'))),null,2));}
  catch(e){console.error(e.message);process.exitCode=1;}
}
