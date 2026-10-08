#!/usr/bin/env python3
"""Build the self-hosted 400-weight Story Serif from a licensed Noto Serif SC TTF.

Requires fonttools[woff] and brotli. The source TTF stays outside the repository.
"""
import argparse
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, default=Path('src/assets/story-serif.woff2'))
    args = parser.parse_args()
    text = ''.join(p.read_text() for p in Path('src').rglob('*') if p.suffix in ('.ts', '.tsx', '.css', '.json'))
    with TTFont(args.source) as font:
        if 'fvar' in font:
            instantiateVariableFont(font, {'wght': 400}, inplace=True)
        options = subset.Options()
        options.flavor = 'woff2'
        builder = subset.Subsetter(options=options)
        builder.populate(text=text)
        builder.subset(font)
        font.flavor = 'woff2'
        args.output.parent.mkdir(parents=True, exist_ok=True)
        font.save(args.output)
    with TTFont(args.output) as output:
        missing = sorted({ord(c) for c in text if '\u3400' <= c <= '\u9fff'} - set(output.getBestCmap()))
        if missing:
            raise SystemExit('Missing CJK glyphs: ' + ''.join(chr(c) for c in missing))
    print(f'FONT_SUBSET_OK {args.output}: {args.output.stat().st_size} bytes, source CJK coverage complete')


if __name__ == '__main__':
    main()
