"""Render an original, sample-free scene score from an inspectable note recipe.

Run from the repository root: python tools/audio/render_scene_score.py SPEC.json
Requires NumPy and FFmpeg. Source WAV and runtime OGG remain separate.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import wave

import numpy as np


def render(spec, rate=24000):
    beat = 60 / spec['bpm']
    duration = spec['bars'] * 4 * beat
    count = round(duration * rate)
    signal = np.zeros((count, 2), dtype=np.float64)

    def note(pitch, start, length, level, pan=0, pad=False):
        if not pitch:
            return
        frames = min(count, round(length * rate))
        t = np.arange(frames) / rate
        f = 440 * 2 ** ((pitch - 69) / 12)
        if pad:
            env = np.sin(np.pi * t / length) ** 2
            tone = (np.sin(2 * np.pi * f * t) + .22 * np.sin(2 * np.pi * f * 2 * t)) * env
        else:
            env = (1 - np.exp(-t * 110)) * np.exp(-t / (1.25 if spec['mood'] != 'suspense' else 2.3))
            env *= np.minimum(1, np.maximum(0, length - t) / .18)
            tone = (np.sin(2 * np.pi * f * t) + .26 * np.sin(4 * np.pi * f * t) * np.exp(-t * 1.8)
                    + .07 * np.sin(6 * np.pi * f * t) * np.exp(-t * 3)) * env
        for delay, wet, side in [(0, 1, pan), (.173, .16, -pan), (.359, .09, pan), (.571, .045, -pan)]:
            index = (np.arange(frames) + round((start + delay) * rate)) % count
            signal[index, 0] += tone * level * wet * math.sqrt((1 - side) / 2)
            signal[index, 1] += tone * level * wet * math.sqrt((1 + side) / 2)

    melody = spec['melody']
    chords = spec['chords']
    for bar in range(spec['bars']):
        chord = chords[bar % len(chords)]
        start = bar * 4 * beat
        for i, pitch in enumerate(chord):
            note(pitch, start + i * .025, beat * 5.6, .024, (i - 1.5) * .22, True)
        note(chord[0] - 12, start, beat * 3.4, .055, -.12)
        if spec['mood'] != 'suspense':
            for i in range(4):
                note(chord[(i + bar) % len(chord)] + 12, start + (i + .5) * beat, beat * 2.4, .018, .4)
        for i in range(4):
            pitch = melody[(bar * 4 + i) % len(melody)]
            note(pitch, start + i * beat, beat * 4.5, .074 if spec['mood'] != 'suspense' else .045, -.25 if i % 2 else .25)
    signal -= signal.mean(axis=0)
    rms = float(np.sqrt(np.mean(signal ** 2)))
    signal *= min(10 ** (-24 / 20) / max(rms, 1e-9), .55 / max(float(np.max(np.abs(signal))), 1e-9))
    if not np.isfinite(signal).all():
        raise ValueError('Non-finite audio')
    return signal, rate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('spec', type=Path)
    args = parser.parse_args()
    spec = json.loads(args.spec.read_text(encoding='utf-8'))
    root = Path.cwd().resolve()
    paths = [root / spec[key] for key in ('source', 'output')]
    if any(not path.resolve().is_relative_to(root) for path in paths):
        raise ValueError('Output outside repository')
    signal, rate = render(spec)
    source, output = paths
    source.parent.mkdir(parents=True, exist_ok=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(source), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes((np.clip(signal, -1, 1) * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(source), '-c:a', 'libvorbis', '-q:a', '5', str(output)], check=True)
    decoded = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(output), '-f', 'f32le', '-'], capture_output=True, check=True)
    samples = np.frombuffer(decoded.stdout, dtype='<f4').reshape(-1, 2)
    report = {
        'id': spec['id'], 'title': spec['title'], 'generator': 'original composition and additive program synthesis; no samples or music model',
        'recipe': str(args.spec), 'recipe_sha256': hashlib.sha256(args.spec.read_bytes()).hexdigest(),
        'source': spec['source'], 'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'output': spec['output'], 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
        'duration_seconds': round(len(samples) / rate, 6), 'sample_rate': rate, 'channels': 2,
        'peak': round(float(np.max(np.abs(samples))), 6), 'rms_dbfs': round(20 * math.log10(float(np.sqrt(np.mean(samples ** 2)))) , 3),
        'loop_boundary_delta': round(float(np.max(np.abs(samples[0] - samples[-1]))), 6),
        'human_listening_review': 'pending', 'license': 'Project-original composition, MIT code; no external recordings',
    }
    if report['peak'] >= .9 or report['loop_boundary_delta'] > .025:
        raise ValueError('Audio headroom or loop join failed')
    report_path = args.spec.with_name(args.spec.stem + '-manifest.json')
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
