"""Rebuild shipping art from preserved sources; no synthesis or inference."""
import hashlib
import json
from pathlib import Path
import shutil
import sys
from PIL import Image, ImageOps

def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def write(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def atomic_image(image, destination, **options):
    temporary = destination.with_name(destination.stem + '.writing' + destination.suffix)
    image.save(temporary, **options)
    with Image.open(temporary) as checked: checked.load()
    temporary.replace(destination)

def main(root):
    project = root.name
    prepared = json.loads((root / 'docs/production/full-media/prepared-art.json').read_text())
    outputs = []
    frames_path = root / 'src/game/character-frames.json'
    frames = json.loads(frames_path.read_text()) if frames_path.exists() else {}
    rain = None
    if project == 'Rain':
        sys.path.insert(0, str(root))
        from tools.display_spec import SPRITE_CANVAS
        from tools.image_process.metadata import image_metadata
        rain = json.loads((root / 'game/data/asset_manifest.json').read_text())
    for item in prepared['assets']:
        if not item.get('active'):
            continue
        source = root / item['qa']['path']
        assert digest(source) == item['qa']['sha256'], 'Prepared image changed'
        identity, kind = item['id'], item['kind']
        if project == 'Rain':
            atlas = Image.open(source).convert('RGBA')
            for expression, frame in zip(item['qa']['expressions'], item['qa']['frames']):
                x, y, w, h = frame
                figure = atlas.crop((x, y, x+w, y+h))
                figure.thumbnail((SPRITE_CANVAS[0]-80, SPRITE_CANVAS[1]-60), Image.Resampling.LANCZOS)
                # Upscale proportionately; keep broad transparent margins.
                scale = min((SPRITE_CANVAS[0]-80)/w, (SPRITE_CANVAS[1]-60)/h)
                figure = figure.resize((round(w*scale), round(h*scale)), Image.Resampling.LANCZOS)
                canvas = Image.new('RGBA', SPRITE_CANVAS)
                canvas.alpha_composite(figure, ((canvas.width-figure.width)//2, canvas.height-figure.height-15))
                rel = f'characters/player_{expression}.png'
                dest = root / 'game' / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                atomic_image(canvas, dest, optimize=True)
                asset = {'id': f'player_{expression}', 'type': 'sprite', 'character': 'player',
                         'expression': expression, 'file': rel, 'version': 1, 'approved': True,
                         'status': 'candidate_user_review', 'source': 'Original image_gen character atlas; complete request in visual-sources.json',
                         'license': 'Project-only original generated character art', 'sha256': digest(dest),
                         'source_file': item['source'], 'source_sha256': digest(root / item['source']),
                         'image': image_metadata(Image.open(dest)),
                         'approval_scope': 'Agent integration review; human final visual choice pending'}
                rain['assets'] = [a for a in rain['assets'] if a['id'] != asset['id']] + [asset]
                outputs.append({'id': asset['id'], 'output': 'game/'+rel, 'sha256': asset['sha256']})
        else:
            if project == 'Circuit': rel = f'public/art/portraits/{identity}.webp'
            elif kind == 'atlas':
                rel = f'public/art/{identity}-expressions.webp'
                frames[identity] = {k: item['qa'][k] for k in ('width','height','frames')}
            else: rel = f"public/art/{'cg-' if kind == 'cg' else ''}{identity.removeprefix('cg-')}.webp"
            dest = root / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, dest)
            outputs.append({'id': identity, 'output': rel, 'sha256': digest(dest)})
    recovered_path = root / 'docs/production/full-media/recovered-cg.json'
    if recovered_path.exists():
        recovered = json.loads(recovered_path.read_text())
        for item in recovered['assets']:
            source = root / item['source']
            assert digest(source) == item['sourceSha256'], 'Recovered CG changed'
            im = Image.open(source).convert('RGB')
            dest = root / item['output']
            dest.parent.mkdir(parents=True, exist_ok=True)
            if project == 'Rain':
                im = ImageOps.fit(im, (1920,1080), method=Image.Resampling.LANCZOS)
                atomic_image(im, dest, optimize=True)
                asset = {'id': item['id'].replace('-','_'), 'type': 'cg',
                         'file': item['output'].removeprefix('game/'), 'source': 'Recovered original image_gen scene; recovered-cg.json',
                         'license': 'Project-only original generated scene', 'version': 1, 'approved': True,
                         'status': 'candidate_user_review', 'sha256': digest(dest),
                         'source_file': item['source'], 'source_sha256': digest(source),
                         'image': image_metadata(Image.open(dest)),
                         'approval_scope': 'Agent integration review; original generation prompt unavailable'}
                rain['assets'] = [a for a in rain['assets'] if a['id'] != asset['id']] + [asset]
            else:
                atomic_image(im, dest, quality=92, method=6)
            assert digest(dest) == item['sha256'], 'CG rebuild changed pixels or encoding'
            outputs.append({'id': item['id'], 'output': item['output'], 'sha256': digest(dest)})
    if frames_path.exists(): write(frames_path, frames)
    if rain is not None: write(root / 'game/data/asset_manifest.json', rain)
    write(root / 'docs/production/full-media/runtime-art.json',
          {'schema': 1, 'project': project, 'outputs': outputs, 'humanVisualApproval': False,
           'release': 'not_published', 'status': 'runtime_files_prepared'})
    print(project, 'shipping art files prepared:', len(outputs))

if __name__ == '__main__':
    main(Path.cwd())
