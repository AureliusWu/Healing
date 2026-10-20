"""Decode immutable generated sources and prepare reviewable authoring assets."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
from PIL import Image
ROOT = Path.cwd().resolve()
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def local(name):
    path = (ROOT / name).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise ValueError('Missing or unsafe source/reference: ' + name)
    return path
def main():
    spec = json.loads(local('docs/production/full-media/visual-sources.json').read_text())
    if spec['project'] != ROOT.name:
        raise ValueError('Source manifest belongs to another project')
    seen, prepared = set(), []
    for asset in spec['assets']:
        if not re.fullmatch('[a-z0-9][a-z0-9-]*', asset['id']) or asset['id'] in seen:
            raise ValueError('Invalid/duplicate source identity')
        seen.add(asset['id'])
        source = local(asset['source'])
        data = source.read_bytes()
        blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        if len(data) != asset['sourceBytes'] or blob != asset['gitBlobSha']:
            raise ValueError('Original generated PNG bytes changed: ' + asset['id'])
        with Image.open(source) as image:
            image.load()
            if image.format != 'PNG':
                raise ValueError('Original source must be a complete PNG')
        references = [{'path': name, 'sha256': sha(local(name))} for name in asset['references']]
        if not asset['active']:
            continue
        kind = {'atlas': 'atlas', 'portrait': 'sprite', 'cg': 'background', 'background': 'background'}[asset['kind']]
        output = ROOT / 'assets_source/full-media-prepared' / (('cg-' if asset['kind'] == 'cg' else '') + asset['id'] + ('-expressions' if kind == 'atlas' else '') + '.webp')
        output.parent.mkdir(parents=True, exist_ok=True)
        result = subprocess.run(['python', 'tools/production/prepare_art.py', str(source), str(output),
            '--kind', kind, '--replace'], capture_output=True, text=True)
        if result.returncode:
            raise ValueError(asset['id'] + ': ' + result.stderr)
        qa = json.loads(result.stdout)
        if asset['kind'] == 'portrait':
            with Image.open(output) as image:
                scaled = image.convert('RGBA').resize((640, 960), Image.Resampling.LANCZOS)
                scaled.save(output, 'WEBP', lossless=True, method=6, exact=True)
            with Image.open(output) as image:
                image.load()
                if image.getchannel('A').tobytes() != scaled.getchannel('A').tobytes():
                    raise ValueError('Portrait alpha changed during encoding')
            qa.update(width=640, height=960, bytes=output.stat().st_size, sha256=sha(output))
        qa['path'] = output.relative_to(ROOT).as_posix()
        prepared.append({**{k: v for k, v in asset.items() if k not in ('status', 'references')},
            'sourceSha256': sha(source), 'referenceHashes': references, 'qa': qa,
            'status': 'decoded_and_alpha_or_scene_checked', 'runtimeIntegration': 'pending'})
    result = {'schema': 1, 'project': spec['project'], 'status': 'all_active_images_decoded_and_checked',
        'count': len(prepared), 'assets': prepared, 'humanVisualApproval': False,
        'runtimeIntegration': 'pending', 'release': 'not_published'}
    target = ROOT / 'docs/production/full-media/prepared-art.json'
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'project': spec['project'], 'prepared': len(prepared),
        'runtimeIntegration': 'pending', 'release': 'not_published'}))
if __name__ == '__main__':
    main()
