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
    parser.add_argument('--kind', choices=('background', 'sprite'), required=True)
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
        if args.kind == 'sprite':
            if 'A' not in source.getbands():
                parser.error('Sprite has no alpha channel; request true transparency')
            source = source.convert('RGBA')
            alpha = source.getchannel('A')
            histogram = alpha.histogram()
            transparent = histogram[0] / (width * height)
            if not .15 <= transparent <= .85:
                parser.error('Sprite transparency is missing or the character is too small')
            for corner in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)):
                if alpha.getpixel(corner) != 0:
                    parser.error('Sprite corners must be fully transparent')
            bounds = alpha.getbbox()
            # A faint antialiasing pixel is not a cropped head or arm. Check
            # the visible drawn body as well as preserving the original alpha.
            solid_bounds = alpha.point(lambda value: 255 if value >= 200 else 0).getbbox()
            if not solid_bounds or solid_bounds[0] < 6 or solid_bounds[1] < 6 or solid_bounds[2] > width - 6:
                parser.error('Character head or arms touch the canvas edge')
            report.update(transparentFraction=round(transparent, 4), alphaBounds=list(bounds), solidAlphaBounds=list(solid_bounds))
        else:
            if abs(width / height - 16 / 9) > .01:
                parser.error('Background must use the shared 16:9 composition')
            source = source.convert('RGB')
        args.output.parent.mkdir(parents=True, exist_ok=True)
        scratch = Path(__file__).resolve().parents[1] / 'tmp' / 'art'
        scratch.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=scratch, suffix='.webp', delete=False) as file:
            temporary = Path(file.name)
        source.save(temporary, format='WEBP', quality=92, method=6, lossless=args.kind == 'sprite', exact=True)
        with Image.open(temporary) as encoded:
            encoded.load()
            if args.kind == 'sprite' and encoded.getchannel('A').tobytes() != source.getchannel('A').tobytes():
                temporary.unlink()
                parser.error('Alpha did not survive conversion')
        temporary.replace(args.output)
        data = args.output.read_bytes()
        report.update(path=args.output.as_posix(), bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
