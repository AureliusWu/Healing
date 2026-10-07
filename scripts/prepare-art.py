#!/usr/bin/env python3
"""Convert approved artwork to WebP and reject broken backgrounds/sprite alpha.

This script changes file encoding only. Drawings and style edits belong in the
image-generation workflow documented in docs/PRODUCTION.md.
Requires Pillow: python -m pip install Pillow
"""
import argparse
import hashlib
import json
import tempfile
from pathlib import Path
from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--kind', choices=('background', 'sprite', 'atlas', 'sheet'), required=True)
    parser.add_argument('--replace', action='store_true')
    args = parser.parse_args()
    if args.output.suffix.lower() != '.webp':
        parser.error('The project uses .webp assets')
    if args.output.exists() and not args.replace:
        parser.error('Output exists; review the replacement and pass --replace')
    with Image.open(args.input) as source:
        source.load()
        width, height = source.size
        if min(width, height) < 720:
            parser.error('Asset resolution is too low')
        report = {'kind': args.kind, 'width': width, 'height': height}
        if args.kind in ('sprite', 'atlas'):
            if 'A' not in source.getbands():
                parser.error('Sprite has no alpha channel; request true transparency')
            source = source.convert('RGBA')
            alpha = source.getchannel('A')
            histogram = alpha.histogram()
            transparent = histogram[0] / (width * height)
            if not .15 <= transparent <= .85:
                parser.error('Sprite transparency is missing or the character is too small')
            for corner in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)):
                if alpha.getpixel(corner) > (3 if args.kind == 'atlas' else 0):
                    parser.error('Sprite corners must be fully transparent')
            bounds = alpha.getbbox()
            # A faint antialiasing pixel is not a cropped head or arm. Check
            # the visible drawn body as well as preserving the original alpha.
            solid_bounds = alpha.point(lambda value: 255 if value >= 200 else 0).getbbox()
            if not solid_bounds or (args.kind == 'sprite' and (solid_bounds[0] < 6 or solid_bounds[1] < 6 or solid_bounds[2] > width - 6)):
                parser.error('Character head or arms touch the canvas edge')
            report.update(transparentFraction=round(transparent, 4), alphaBounds=list(bounds), solidAlphaBounds=list(solid_bounds))
            if args.kind == 'atlas':
                if width % 3 or height % 2:
                    parser.error('Atlas must divide into three columns and two rows')
                # Measure the six actual figures instead of assuming the generator
                # obeyed perfect grid spacing. Sampling changes no source pixels.
                bodies = []
                for row in range(2):
                    top = row * height // 2
                    mask = alpha.crop((0, top, width, top + height // 2)).point(lambda value: 255 if value >= 200 else 0)
                    data = list(mask.get_flattened_data())
                    occupied = [x for x in range(width) if sum(data[y * width + x] != 0 for y in range(height // 2)) >= 5]
                    runs = []
                    for x in occupied:
                        if not runs or x - runs[-1][-1] > 12:
                            runs.append([x])
                        else:
                            runs[-1].append(x)
                    runs = [run for run in runs if len(run) > 30]
                    if len(runs) != 3:
                        parser.error('Atlas must contain three clearly separated figures in each row')
                    for run in runs:
                        left, right = max(0, run[0] - 4), min(width, run[-1] + 5)
                        box = mask.crop((left, 0, right, height // 2)).getbbox()
                        if not box:
                            parser.error('Atlas contains an empty figure')
                        bodies.append([left + box[0], top + box[1], left + box[2], top + box[3]])
                frame_width = max(box[2] - box[0] for box in bodies) + 32
                frame_height = max(box[3] - box[1] for box in bodies) + 32
                frames = [[round((box[0] + box[2] - frame_width) / 2), box[1] - 16, frame_width, frame_height] for box in bodies]
                report.update(columns=3, rows=2, expressions=['neutral', 'smile', 'surprised', 'worried', 'hurt', 'shy'], figureBounds=bodies, frames=frames)
        else:
            if args.kind == 'background' and abs(width / height - 16 / 9) > .01:
                parser.error('Background must use the shared 16:9 composition')
            source = source.convert('RGB')
        args.output.parent.mkdir(parents=True, exist_ok=True)
        scratch = Path(__file__).resolve().parents[1] / 'tmp' / 'art'
        scratch.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=scratch, suffix='.webp', delete=False) as file:
            temporary = Path(file.name)
        source.save(temporary, format='WEBP', quality=92, method=6, lossless=args.kind in ('sprite', 'atlas'), exact=True)
        with Image.open(temporary) as encoded:
            encoded.load()
            if args.kind in ('sprite', 'atlas') and encoded.getchannel('A').tobytes() != source.getchannel('A').tobytes():
                temporary.unlink()
                parser.error('Alpha did not survive conversion')
        temporary.replace(args.output)
        data = args.output.read_bytes()
        report.update(path=args.output.as_posix(), bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
