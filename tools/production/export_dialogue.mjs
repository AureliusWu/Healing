import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';

const root=process.cwd(), project=path.basename(root), require=createRequire(import.meta.url);
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const config=read('docs/production/full-media/cast.json');
const sources=[];
function source(file){const raw=fs.readFileSync(path.join(root,file));sources.push({path:file,sha256:hash(raw)});return JSON.parse(raw);}
function loadTypescript(file){
  const ts=require('typescript');
  require.extensions['.ts']=(module,filename)=>{
    const raw=fs.readFileSync(filename,'utf8');
    if(filename.startsWith(root+path.sep))sources.push({path:path.relative(root,filename).replaceAll(path.sep,'/'),sha256:hash(raw)});
    module._compile(ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
  };
  return require(path.join(root,file));
}
let scenes=[],rows=[],excluded=[];
const add=(sceneId,lineId,index,line,extra={})=>{
  const base={sceneId,lineId,lineIndex:index,speaker:line.speaker,text:line.text,...extra};
  if(['旁白','系统','n'].includes(line.speaker)){excluded.push({...base,reason:'narration_or_system'});return;}
  const actorId=config.aliases[line.speaker]??line.speaker,actor=config.actors[actorId];
  if(!actor)throw Error('Unmapped dialogue speaker: '+line.speaker);
  const id=(project.toLowerCase()+'-'+lineId).replaceAll('_','-');
  rows.push({id,...base,actorId,voice:actor.voice,instruct:actor.instruct,
    seed:parseInt(hash(project+'\0'+lineId+'\0'+line.text).slice(0,8),16)%2000000000,
    textSha256:hash(line.text),medium:line.medium??'spoken'});
};
if(project==='NetLove'){
  const story=source('src/story/story.json');scenes=story.scenes;
  for(const scene of scenes)scene.lines.forEach((line,i)=>add(scene.id,line.id,i,line));
}else if(project==='Healing'){
  scenes=loadTypescript('src/story/index.ts').scenes;
  for(const scene of scenes)scene.lines.forEach((line,i)=>add(scene.id,`${scene.id}--${String(i+1).padStart(3,'0')}`,i,line));
}else if(project==='Rain'){
  const story=source('game/data/story.json');scenes=story.nodes;
  for(const scene of scenes){
    (scene.lines??[]).forEach((line,i)=>add(scene.id,line.id,i,line));
    for(const choice of scene.choices??[])(choice.response??[]).forEach((line,i)=>add(scene.id,line.id,i,line,{choiceId:choice.id}));
  }
}else if(project==='Circuit'){
  const chapters=Object.values(loadTypescript('src/story/engine.ts').CHAPTERS);
  scenes=chapters;
  const review=source('docs/production/full-media/dialogue-segments.json');
  for(const chapter of chapters)for(const[nodeId,node]of Object.entries(chapter.nodes)){
    const identity=chapter.id+'/'+nodeId,quotes=[...node.text.matchAll(/“([^”]+)”/g)];
    const decisions=review[identity]??[];
    if(decisions.length!==quotes.length)throw Error('Unreviewed quoted span: '+identity);
    quotes.forEach((match,i)=>{
      const decision=decisions[i];
      if(decision==='citation'){excluded.push({sceneId:chapter.id,nodeId,quoteIndex:i,text:match[1],reason:'quoted_label_or_document'});return;}
      if(!config.actors[decision])throw Error('Unresolved quoted speaker: '+identity+'/'+i);
      add(chapter.id,`${chapter.id}--${nodeId}--${String(i+1).padStart(2,'0')}`,i,{speaker:decision,text:match[1]},{nodeId,quoteIndex:i,start:match.index,end:match.index+match[0].length});
    });
  }
}else throw Error('Unsupported project '+project);
const ids=rows.map(row=>row.id);
if(new Set(ids).size!==ids.length)throw Error('Duplicate dialogue recording identity');
const semantic=rows.map(({id,sceneId,lineId,lineIndex,speaker,text,medium,nodeId,quoteIndex,choiceId})=>({id,sceneId,lineId,lineIndex,speaker,text,medium,...(nodeId?{nodeId,quoteIndex}:{}),...(choiceId?{choiceId}:{})}));
const output={schema:1,project,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  sourceFiles:[...new Map(sources.map(s=>[s.path,s])).values()],semanticSha256:hash(JSON.stringify(semantic)),
  scope:{allBranches:true,writtenDialogue:true,narration:false,excludedCount:excluded.length},
  sceneCount:scenes.length,model:config.model,actors:config.actors,lines:rows,excluded};
const target=process.argv[2]??'docs/production/full-media/dialogue-plan.json';
fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({project,lines:rows.length,scenes:scenes.length,semanticSha256:output.semanticSha256,target}));
