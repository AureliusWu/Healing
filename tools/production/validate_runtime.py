"""Check shipped media against the complete retained production evidence."""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess
from PIL import Image

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def require(ok, message):
    if not ok: raise ValueError(message)

def validate(root, complete=False, decode=False):
    docs=root/'docs/production/full-media'
    plan=json.loads((docs/'dialogue-plan.json').read_text())
    archive=root/'assets_source/voice/continued-20261020'
    manifest=json.loads((archive/'manifest.json').read_text())
    report=json.loads((docs/'runtime-voice.json').read_text())
    runtime=json.loads((root/('game/data/full_voice_manifest.json' if plan['project']=='Rain' else 'src/game/full-voice-manifest.json')).read_text())
    rows={row['id']:row for row in plan['lines']}
    records={r['id']:r for r in manifest['records']}
    require(set(rows)==set(records) and len(records)==len(manifest['records']), 'Incomplete source archive')
    require(report['semanticSha256']==manifest['semanticSha256']==plan['semanticSha256'], 'Stale source identity')
    accepted={id:r for id,r in records.items() if r['status']=='accepted'}
    require(len(accepted)==report['accepted']==runtime['accepted'], 'Accepted count mismatch')
    shipped={c.get('productionId',c['id']) for c in runtime['clips']}
    require(shipped==set(accepted) and len(shipped)==len(runtime['clips']), 'Missing or duplicated runtime binding')
    require(not complete or len(accepted)==len(rows), 'Unresolved dialogue: release is blocked')
    require(runtime['target']==report['target']==len(rows) and runtime['complete']==(len(accepted)==len(rows)), 'Stale runtime totals')
    clips={c.get('productionId',c['id']):c for c in runtime['clips']}
    checked=[]
    bindings={b['id']:b for b in report['bindings']}
    for id,record in accepted.items():
        row=rows[id]
        payload=json.dumps({'project':plan['project'],'model':plan['model'],'request':row},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
        require(hashlib.sha256(payload).hexdigest()==record['requestSha256']==bindings[id]['requestSha256'], 'Changed recording request: '+id)
        require(record['asr']['passed'] is True, 'Rejected recording shipped')
        for file in record['files'].values():
            path=(archive/file['path']).resolve()
            require(path.is_relative_to(archive.resolve()) and path.is_file() and not path.is_symlink(), 'Unsafe recording path')
            require(path.stat().st_size==file['bytes'] and digest(path)==file['sha256'], 'Changed source audio: '+id)
        clip=clips[id]
        player='game/' if plan['project']=='Rain' else 'public/'
        require(player+clip['src'].lstrip('/')==bindings[id]['runtime'], 'Runtime catalog points to another recording: '+id)
        if plan['project']!='Circuit':
            require((clip['sceneId'],clip['lineIndex'],clip['speaker'],clip['text'])==(row['sceneId'],row['lineIndex'],row.get('sourceSpeaker',row['speaker']),row.get('sourceText',row['text'])), 'Runtime dialogue identity changed: '+id)
        require(bindings[id]['recordedSha256']==record['files']['runtime']['sha256'], 'Stale recording proof: '+id)
        if row.get('replayOf'):
            require(record['files']['runtime']['sha256']==accepted[row['replayOf']]['files']['runtime']['sha256'], 'Replay changed the original performance')
        path=root/bindings[id]['runtime']
        require(digest(path)==bindings[id]['sha256'], 'Changed runtime audio: '+id)
        checked.append(path)
    images=json.loads((docs/'runtime-art.json').read_text())['outputs']
    for item in images:
        path=root/item['output']
        require(digest(path)==item['sha256'], 'Changed runtime image: '+item['id'])
        with Image.open(path) as im: im.load()
    if decode:
        def decode_one(path):
            subprocess.run(['ffmpeg','-nostdin','-v','error','-xerror','-i',str(path),'-f','null','-'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(decode_one,sorted(set(checked))))
    return dict(project=plan['project'],target=len(rows),accepted=len(accepted),images=len(images),
                decoded=bool(decode),complete=len(accepted)==len(rows),humanListening=False,
                release='not_published',status='passed' if len(accepted)==len(rows) else 'author_preview_incomplete')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--require-complete',action='store_true')
    parser.add_argument('--decode',action='store_true')
    parser.add_argument('--report',type=Path)
    args=parser.parse_args()
    report=validate(Path.cwd(),args.require_complete,args.decode)
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False))
