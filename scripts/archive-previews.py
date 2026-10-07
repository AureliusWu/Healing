#!/usr/bin/env python3
"""Archive verified CI screenshots without resizing or cropping (requires Pillow)."""
import argparse
import hashlib
import io
import json
import re
from pathlib import Path
from zipfile import ZipFile
from PIL import Image


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--web-zip', type=Path, required=True)
    parser.add_argument('--live-zip', type=Path, required=True)
    parser.add_argument('--version', required=True)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--web-run', type=int, required=True)
    parser.add_argument('--live-run', type=int, required=True)
    parser.add_argument('--web-artifact', type=int, required=True)
    parser.add_argument('--live-artifact', type=int, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'\d+\.\d+\.\d+', args.version) or not re.fullmatch(r'[a-f0-9]{40}', args.commit):
        parser.error('Expected a semver version and full runtime commit SHA')
    root = Path(__file__).resolve().parents[1]
    output = root / 'docs/previews' / f'v{args.version}'
    output.mkdir(parents=True, exist_ok=True)
    events = ['lin-page', 'chen-rest', 'tang-light', 'shared-print']
    web_names = [f'cg-{event}-{screen}.png' for event in events for screen in ['desktop', 'mobile']]
    live_names = [f'{kind}-{screen}.png' for kind in ['title', 'reading', 'choices', 'picture', 'complete-cg'] for screen in ['desktop', 'mobile', 'landscape']]
    jobs = []
    sources = []
    # Validate both archives in full before replacing any current preview.
    for kind, archive, names, run, artifact in [
        ('web', args.web_zip, web_names, args.web_run, args.web_artifact),
        ('live', args.live_zip, live_names, args.live_run, args.live_artifact),
    ]:
        sources.append({'kind': kind, 'run': run, 'artifact': artifact, 'zipSha256': digest(archive.read_bytes())})
        with ZipFile(archive) as zipped:
            for name in names:
                matches = [item for item in zipped.infolist() if item.filename == name]
                if len(matches) != 1 or matches[0].file_size > 25_000_000:
                    raise ValueError(f'Missing, duplicated or oversized screenshot: {name}')
                raw = zipped.read(matches[0])
                with Image.open(io.BytesIO(raw)) as source:
                    source.load()
                    if source.format != 'PNG' or min(source.size) < 300:
                        raise ValueError(f'Invalid screenshot: {name}')
                    encoded = io.BytesIO()
                    source.convert('RGB').save(encoded, format='JPEG', quality=86, optimize=True)
                    data = encoded.getvalue()
                    with Image.open(io.BytesIO(data)) as checked:
                        checked.load()
                        if checked.size != source.size:
                            raise ValueError(f'Screenshot dimensions changed: {name}')
                    target = output / name.replace('.png', '.jpg') if kind == 'web' or name.startswith('complete-cg-') else root / 'docs/previews' / name.replace('.png', '.jpg')
                    jobs.append((target, data, {'source': kind, 'original': name, 'path': target.relative_to(root).as_posix(), 'width': source.width, 'height': source.height, 'pngSha256': digest(raw), 'jpgSha256': digest(data)}))
    for target, data, _ in jobs:
        target.write_bytes(data)
    manifest = {'version': args.version, 'runtimeCommit': args.commit, 'encoding': 'JPEG quality 86; original dimensions; no crop', 'sources': sources, 'screenshots': [item for _, _, item in jobs]}
    (output / 'provenance.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(f'PREVIEW_ARCHIVE_OK v{args.version}: {len(jobs)} screenshots, dimensions preserved')


if __name__ == '__main__':
    main()
