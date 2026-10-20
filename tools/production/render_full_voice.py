"""Resumable offline dialogue production. No model code enters the player.

Preparation downloads pinned models separately. Rendering denies network system
calls before importing either TTS or ASR. A clip is accepted only after signal,
byte-binding and independent transcript checks; failed takes remain reviewable.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

sys.path.insert(0, str(Path(__file__).resolve().parent))
from offline_runtime import enforce_offline


def require(ok, message):
    if not ok:
        raise ValueError(message)


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def validate_plan(plan):
    require(plan.get('schema') == 1 and plan.get('project') in ('Circuit', 'NetLove', 'Healing', 'Rain'), 'Unknown production plan')
    require(re.fullmatch('[0-9a-f]{40}', plan.get('sourceCommit', '')) is not None, 'Missing source commit')
    require(re.fullmatch('[0-9a-f]{64}', plan.get('semanticSha256', '')) is not None, 'Missing dialogue snapshot')
    require(plan.get('scope', {}).get('allBranches') is True, 'All branches must be included')
    model = plan.get('model', {})
    require(model.get('id') == 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice'
            and model.get('revision') == '0c0e3051f131929182e2c023b9537f8b1c68adfe'
            and model.get('sampleRate') == 24000, 'Unpinned speech model')
    ids = set()
    for row in plan.get('lines', []):
        name = row.get('id', '')
        require(isinstance(name, str) and re.fullmatch('[a-z0-9][a-z0-9-]*', name) and name not in ids, 'Unsafe or duplicate clip identity')
        ids.add(name)
        text = row.get('text')
        require(isinstance(text, str) and text.strip() and hashlib.sha256(text.encode()).hexdigest() == row.get('textSha256'), 'Stale or empty dialogue text')
        actor = plan.get('actors', {}).get(row.get('actorId'))
        require(actor and actor.get('voice') == row.get('voice') and actor.get('instruct') == row.get('instruct'), 'Unresolved speaker or direction')
        require(type(row.get('seed')) is int and row['seed'] >= 0, 'Invalid voice seed')
    require(bool(ids), 'Empty dialogue production plan')


def request_hash(plan, row):
    return hashlib.sha256(canonical({'project': plan['project'], 'model': plan['model'], 'request': row})).hexdigest()


def normalize_text(text, converter=None):
    text = converter.convert(text) if converter else text
    return ''.join(c for c in text if c.isalnum()).lower()


def transcript_result(expected, transcript, converter=None):
    expected, actual = normalize_text(expected, converter), normalize_text(transcript, converter)
    previous = list(range(len(actual) + 1))
    for i, left in enumerate(expected, 1):
        current = [i]
        for j, right in enumerate(actual, 1):
            current.append(min(current[-1] + 1, previous[j] + 1, previous[j - 1] + (left != right)))
        previous = current
    cer = previous[-1] / max(1, len(expected))
    polarity = all(expected.count(c) == actual.count(c) for c in ('不', '没'))
    return {'transcript': transcript, 'cer': round(cer, 6), 'polarityCountsMatch': polarity,
            'passed': bool(actual) and cer <= .2 and polarity}


def split_text(text, limit=72):
    """Preserve every original character while bounding each generation call."""
    parts, current = [], ''
    for sentence in re.findall(r'[^。！？；\n]+[。！？；\n]?|[。！？；\n]', text):
        while len(sentence) > limit:
            cut = sentence.rfind('，', 0, limit + 1) + 1 or limit
            if current:
                parts.append(current)
                current = ''
            parts.append(sentence[:cut])
            sentence = sentence[cut:]
        if current and len(current) + len(sentence) > limit:
            parts.append(current)
            current = ''
        current += sentence
    if current:
        parts.append(current)
    require(''.join(parts) == text, 'Speech segmentation changed dialogue')
    return parts


def normalize_audio(raw, master):
    base = ['ffmpeg', '-nostdin', '-hide_banner', '-y', '-i', str(raw)]
    result = subprocess.run(base + ['-af', 'loudnorm=I=-20:TP=-2:LRA=6:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, check=True)
    match = re.search(r'\{\s*"input_i".*?\}', result.stderr, re.S)
    require(match is not None, 'Missing loudness measurement')
    measured = json.loads(match.group())
    require(all(measured[k] not in ('-inf', 'inf', 'nan') for k in ('input_i', 'input_tp', 'input_lra', 'input_thresh')), 'Speech too short or silent for measured loudness')
    filters = ('loudnorm=I=-20:TP=-2:LRA=6:linear=true:'
               f"measured_I={measured['input_i']}:measured_TP={measured['input_tp']}:"
               f"measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}:offset={measured['target_offset']}")
    subprocess.run(base + ['-af', filters, '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', str(master)], capture_output=True, check=True)
    return measured


def verify_record(root, row, record, plan):
    require(record.get('id') == row['id'] and record.get('requestSha256') == request_hash(plan, row)
            and record.get('text') == row['text'] and record.get('actorId') == row['actorId'], 'Recorded request changed')
    require(record.get('status') == 'accepted' and record.get('asr', {}).get('passed') is True, 'Unaccepted recording')
    require(set(record.get('files', {})) == {'raw', 'master', 'runtime'}, 'Incomplete recording files')
    for file in record['files'].values():
        target = (root / file['path']).resolve()
        require(target.is_relative_to(root.resolve()) and target.is_file() and not target.is_symlink(), 'Unsafe or missing recording file')
        require(target.stat().st_size == file['bytes'] and digest(target) == file['sha256'], 'Recording bytes changed')


def render(args):
    plan = json.loads(args.plan.read_text(encoding='utf-8'))
    validate_plan(plan)
    require(0 <= args.shard_index < args.shard_count <= 128 and 1 <= args.threads <= 16, 'Invalid production shard')
    require(args.model_dir.is_dir() and args.asr_dir.is_dir(), 'Download both pinned models before offline inference')
    require(args.attempt_offset >= 0, 'Invalid retry offset')
    for file in plan['model'].get('snapshotFiles', []):
        target = (args.model_dir / file['path']).resolve()
        require(target.is_relative_to(args.model_dir.resolve()) and target.is_file()
            and target.stat().st_size == file['bytes'] and digest(target) == file['sha256'], 'Pinned model bytes differ')
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = args.output / 'manifest.json'
    old = json.loads(manifest.read_text()) if manifest.exists() else {'records': []}
    fingerprint = hashlib.sha256(canonical(plan)).hexdigest()
    if manifest.exists():
        require(old.get('planSha256') == fingerprint, 'Output belongs to a different source/request plan')
    records = {r['id']: r for r in old['records']}
    selected = plan['lines'][args.shard_index::args.shard_count]
    if args.limit is not None:
        selected = selected[:args.limit]
    policy = enforce_offline()
    import onnxruntime
    onnxruntime.disable_telemetry_events()
    import numpy as np
    import soundfile as sf
    import torch
    from qwen_tts import Qwen3TTSModel
    from faster_whisper import WhisperModel
    from opencc import OpenCC
    torch.set_num_threads(args.threads)
    torch.set_num_interop_threads(1)
    converter = OpenCC('t2s')
    asr = WhisperModel(str(args.asr_dir.resolve()), device='cpu', compute_type='int8', cpu_threads=args.threads, local_files_only=True)
    engine = None

    def checkpoint():
        complete = all(row['id'] in records and records[row['id']]['status'] == 'accepted' for row in selected)
        save(manifest, {'schema': 1, 'project': plan['project'], 'planSha256': fingerprint,
            'semanticSha256': plan['semanticSha256'], 'sourceCommit': plan['sourceCommit'],
            'shardIndex': args.shard_index, 'shardCount': args.shard_count,
            'requestedIds': [r['id'] for r in selected], 'status': 'accepted' if complete else 'incomplete',
            'networkPolicy': policy, 'telemetry': 'disabled', 'model': plan['model'],
            'humanListening': False, 'records': [records[r['id']] for r in selected if r['id'] in records]})

    checkpoint()
    for row in selected:
        if row['id'] in records and records[row['id']]['status'] == 'accepted':
            verify_record(args.output, row, records[row['id']], plan)
            print('CACHE', row['id'], flush=True)
            continue
        if engine is None:
            engine = Qwen3TTSModel.from_pretrained(str(args.model_dir.resolve()), device_map='cpu', dtype=torch.bfloat16,
                attn_implementation='eager', low_cpu_mem_usage=True, local_files_only=True)
        for attempt in range(args.attempt_offset, args.attempt_offset + 3):
            try:
                began = time.monotonic()
                take = args.output / 'takes' / row['id'] / str(attempt)
                take.mkdir(parents=True, exist_ok=True)
                pieces = []
                for index, text in enumerate(split_text(row['text'])):
                    seed = row['seed'] + attempt * 10000 + index
                    torch.manual_seed(seed)
                    np.random.seed(seed % (2 ** 32))
                    with torch.inference_mode():
                        waves, rate = engine.generate_custom_voice(text=text, language='Chinese', speaker=row['voice'],
                            instruct=row['instruct'], max_new_tokens=512)
                    samples = np.asarray(waves[0], dtype=np.float32).reshape(-1)
                    require(rate == 24000 and len(waves) == 1 and np.isfinite(samples).all() and len(samples) > 0, 'Invalid generated speech')
                    if pieces:
                        pieces.append(np.zeros(1800, dtype=np.float32))
                    pieces.append(samples)
                samples = np.concatenate(pieces)
                require(.2 <= len(samples) / 24000 <= max(8, len(row['text']) * .8), 'Unexpected speech duration')
                raw, master, runtime = (take / name for name in ('raw.wav', 'master.wav', 'runtime.ogg'))
                sf.write(raw, samples, 24000, subtype='FLOAT')
                loudness = normalize_audio(raw, master)
                subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(master), '-c:a', 'libvorbis', '-q:a', '5', str(runtime)], check=True)
                decoded, sample_rate = sf.read(runtime, dtype='float32')
                require(sample_rate == 24000 and decoded.ndim == 1 and np.isfinite(decoded).all()
                        and .001 < float(np.max(np.abs(decoded))) < 1 and abs(len(decoded) - len(samples)) < 2400, 'Encoded speech signal differs')
                probe = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(runtime), '-ar', '16000', '-ac', '1', '-f', 'f32le', 'pipe:1'], capture_output=True, check=True)
                segments, _ = asr.transcribe(np.frombuffer(probe.stdout, dtype='<f4').copy(), language='zh', beam_size=5,
                    condition_on_previous_text=False, vad_filter=False)
                transcript = ''.join(s.text for s in segments)
                result = transcript_result(row['text'], transcript, converter)
                record = {**row, 'requestSha256': request_hash(plan, row), 'attempt': attempt,
                    'status': 'accepted' if result['passed'] else 'needs_review', 'asr': result,
                    'duration': round(len(samples) / 24000, 6), 'wallSeconds': round(time.monotonic() - began, 3),
                    'loudness': loudness, 'files': {key: {'path': file.relative_to(args.output).as_posix(),
                        'bytes': file.stat().st_size, 'sha256': digest(file)} for key, file in [('raw', raw), ('master', master), ('runtime', runtime)]}}
                save(take / 'take.json', record)
                records[row['id']] = record
                checkpoint()
                print(json.dumps({'id': row['id'], 'attempt': attempt, 'status': record['status'], 'cer': result['cer'],
                    'seconds': record['duration']}, ensure_ascii=False), flush=True)
                if result['passed']:
                    break
            except Exception as error:
                records[row['id']] = {**row, 'requestSha256': request_hash(plan, row),
                    'status': 'production_error', 'attempt': attempt,
                    'error': type(error).__name__ + ': ' + str(error), 'files': {}}
                checkpoint()
                print(json.dumps({'id': row['id'], 'attempt': attempt,
                    'status': 'production_error', 'error': str(error)}, ensure_ascii=False), flush=True)
    checkpoint()
    require(all(records[row['id']]['status'] == 'accepted' for row in selected), 'Some recordings require review; no complete bundle is claimed')


def merge(args):
    plan = json.loads(args.plan.read_text(encoding='utf-8'))
    validate_plan(plan)
    expected = {r['id']: r for r in plan['lines']}
    found = {}
    for manifest in sorted(args.parts.rglob('manifest.json')):
        part = json.loads(manifest.read_text(encoding='utf-8'))
        if part.get('project') != plan['project']:
            continue
        require(part.get('planSha256') == hashlib.sha256(canonical(plan)).hexdigest()
                and part.get('status') == 'accepted', 'Incomplete or mismatched production shard')
        for record in part['records']:
            require(record['id'] in expected and record['id'] not in found, 'Duplicate or unexpected recorded dialogue')
            verify_record(manifest.parent, expected[record['id']], record, plan)
            found[record['id']] = (manifest.parent, record)
    require(set(found) == set(expected), 'Full dialogue coverage is incomplete')
    require(not args.output.exists(), 'Merged output already exists; inspect before retry')
    args.output.mkdir(parents=True)
    records = []
    for row in plan['lines']:
        root, record = found[row['id']]
        copied = dict(record)
        copied['files'] = {}
        for key, file in record['files'].items():
            suffix = '.ogg' if key == 'runtime' else '.wav'
            target = args.output / key / (row['id'] + suffix)
            target.parent.mkdir(exist_ok=True)
            shutil.copy2(root / file['path'], target)
            copied['files'][key] = {'path': target.relative_to(args.output).as_posix(), 'bytes': target.stat().st_size, 'sha256': digest(target)}
        records.append(copied)
    save(args.output / 'full-voice.json', {'schema': 1, 'project': plan['project'], 'status': 'all_dialogue_signal_and_asr_passed',
        'sourceCommit': plan['sourceCommit'], 'semanticSha256': plan['semanticSha256'],
        'planSha256': hashlib.sha256(canonical(plan)).hexdigest(), 'count': len(records), 'model': plan['model'],
        'records': records, 'humanListening': False, 'runtimeIntegration': 'pending_exact_source_binding'})
    print(json.dumps({'project': plan['project'], 'accepted': len(records), 'output': str(args.output)}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    render_parser = sub.add_parser('render')
    render_parser.add_argument('--plan', type=Path, required=True)
    render_parser.add_argument('--output', type=Path, required=True)
    render_parser.add_argument('--model-dir', type=Path, required=True)
    render_parser.add_argument('--asr-dir', type=Path, required=True)
    render_parser.add_argument('--shard-index', type=int, default=0)
    render_parser.add_argument('--shard-count', type=int, default=1)
    render_parser.add_argument('--threads', type=int, default=4)
    render_parser.add_argument('--limit', type=int)
    render_parser.add_argument('--attempt-offset', type=int, default=0)
    merge_parser = sub.add_parser('merge')
    merge_parser.add_argument('--plan', type=Path, required=True)
    merge_parser.add_argument('--parts', type=Path, required=True)
    merge_parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    render(args) if args.command == 'render' else merge(args)


if __name__ == '__main__':
    main()
