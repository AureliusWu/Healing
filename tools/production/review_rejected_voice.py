"""Recheck rejected immutable audio with a larger, independent offline ASR.

No reference transcript is supplied to ASR. The old transcript remains in the
record. Neither the recorded request nor audio bytes are changed by this pass.
"""
import argparse
import copy
import json
from pathlib import Path
import subprocess
import shutil

from render_full_voice import digest, request_hash, require, save, transcript_result, validate_plan, verify_record
from phonetic_review import review_homophones
from offline_runtime import enforce_offline

MODEL = 'Systran/faster-whisper-large-v3'
REVISION = 'edaa852ec7e145841d8ffdb056a99866b5f0a478'
SECONDARY_MODEL = 'FunAudioLLM/SenseVoiceSmall'
SECONDARY_REVISION = '3847d57b6bdf2dd8875cb1508d2af43d80a16bf7'

def strict_secondary(expected, actual, converter):
    result = transcript_result(expected, actual, converter)
    proof = review_homophones(expected, actual, converter)
    result.update(passed=result['cer'] == 0 or proof['passed'], phoneticReview=proof,
                  acceptance='independent_exact_words_or_all_syllables_and_tones')
    return result



def main(args):
    plan = json.loads(args.plan.read_text())
    validate_plan(plan)
    archive = json.loads((args.source / 'manifest.json').read_text())
    require(archive['project'] == plan['project'], 'Foreign archive')
    rows = {row['id']: row for row in plan['lines']}
    require(len(archive['records']) == len(rows), 'Incomplete input archive')
    records = {}
    for record in archive['records']:
        row = rows.get(record['id'])
        require(row and record['id'] not in records and record['requestSha256'] == request_hash(plan, row), 'Stale or duplicate request')
        for file in record.get('files', {}).values():
            target = (args.source / file['path']).resolve()
            require(target.is_relative_to(args.source.resolve()) and target.is_file() and not target.is_symlink(), 'Unsafe audio path')
            require(target.stat().st_size == file['bytes'] and digest(target) == file['sha256'], 'Recorded audio changed')
        if record['status'] == 'accepted':
            verify_record(args.source, row, record, plan)
        records[row['id']] = copy.deepcopy(record)
    require(args.model_dir.is_dir(), 'Pinned review model missing')
    model_files = [{ 'path': str(p.relative_to(args.model_dir)), 'sha256': digest(p), 'bytes': p.stat().st_size }
                   for p in sorted(args.model_dir.rglob('*')) if p.is_file() and '.cache' not in p.parts]
    network = enforce_offline()
    import numpy as np
    import onnxruntime
    from faster_whisper import WhisperModel
    from opencc import OpenCC
    onnxruntime.disable_telemetry_events()
    converter = OpenCC('t2s')
    engine = WhisperModel(str(args.model_dir.resolve()), device='cpu', compute_type='int8', cpu_threads=4, local_files_only=True)
    secondary = None
    for row in plan['lines']:
        record = records[row['id']]
        if record['status'] == 'accepted' or row.get('replayOf'):
            continue
        require(set(record.get('files', {})) == {'raw', 'master', 'runtime'}, 'Missing original rejected audio')
        original_asr = copy.deepcopy(record.get('asr'))
        runtime = args.source / record['files']['runtime']['path']
        decoded = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(runtime), '-ar', '16000', '-ac', '1', '-f', 'f32le', 'pipe:1'], check=True, capture_output=True)
        segments, _ = engine.transcribe(np.frombuffer(decoded.stdout, dtype='<f4').copy(), language='zh', beam_size=5,
                                         condition_on_previous_text=False, vad_filter=False, temperature=0)
        actual = ''.join(segment.text for segment in segments)
        result = transcript_result(row.get('spokenText', row['text']), actual, converter)
        if not result['passed']:
            proof = review_homophones(row.get('spokenText', row['text']), actual, converter)
            result['phoneticReview'] = proof
            if proof['passed']:
                result.update(passed=True, acceptance='exact_toned_homophones')
        result.update(model=MODEL, revision=REVISION, audioSha256=record['files']['runtime']['sha256'])
        record.setdefault('asrReviewHistory', []).append(original_asr)
        record['asr'] = result
        record['status'] = 'accepted' if result['passed'] else 'needs_review'
        if not result['passed'] and args.secondary_model_dir:
            if secondary is None:
                from funasr import AutoModel
                secondary = AutoModel(model=str(args.secondary_model_dir.resolve()), device='cpu',
                                      disable_update=True, disable_pbar=True)
            alternatives = [(args.source, copy.deepcopy(record))]
            if args.candidates:
                for manifest in sorted(args.candidates.rglob('manifest.json')):
                    part_root = manifest.parent
                    for take in sorted((part_root / 'takes' / row['id']).glob('*/take.json')):
                        candidate = json.loads(take.read_text())
                        require(candidate['requestSha256'] == request_hash(plan, row), 'Alternate take request changed')
                        alternatives.append((part_root, candidate))
            seen_audio = set()
            all_reviews = []
            for candidate_root, candidate in alternatives:
                runtime_meta = candidate['files']['runtime']
                if runtime_meta['sha256'] in seen_audio:
                    continue
                seen_audio.add(runtime_meta['sha256'])
                for file in candidate['files'].values():
                    file_path = (candidate_root / file['path']).resolve()
                    require(file_path.is_relative_to(candidate_root.resolve()) and file_path.is_file()
                            and not file_path.is_symlink() and file_path.stat().st_size == file['bytes']
                            and digest(file_path) == file['sha256'], 'Alternate audio bytes changed')
                decoded = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(candidate_root / runtime_meta['path']),
                    '-ar', '16000', '-ac', '1', '-f', 'f32le', 'pipe:1'], check=True, capture_output=True)
                output = secondary.generate(input=np.frombuffer(decoded.stdout, dtype='<f4').copy(),
                                            cache={}, language='zh', use_itn=False, batch_size=1)
                import re
                raw_transcript = output[0]['text']
                actual = re.sub(r'<\|[^|]*\|>', '', raw_transcript)
                proof = strict_secondary(row.get('spokenText', row['text']), actual, converter)
                proof.update(model=SECONDARY_MODEL, revision=SECONDARY_REVISION,
                             rawTranscript=raw_transcript, audioSha256=runtime_meta['sha256'],
                             humanListening=False)
                all_reviews.append(proof)
                if proof['passed']:
                    candidate.setdefault('asrReviewHistory', []).extend([candidate.get('asr'), result])
                    for kind, file in candidate['files'].items():
                        source_file = candidate_root / file['path']
                        target = args.source / row['id'] / (kind + source_file.suffix)
                        target.parent.mkdir(parents=True, exist_ok=True)
                        if source_file.resolve() != target.resolve():
                            shutil.copyfile(source_file, target)
                        candidate['files'][kind] = {**file, 'path': target.relative_to(args.source).as_posix()}
                    candidate.update(status='accepted', asr=proof)
                    record = records[row['id']] = candidate
                    verify_record(args.source, row, record, plan)
                    break
            record['independentReviews'] = all_reviews
        print(json.dumps({'id': row['id'], 'status': record['status'], 'asr': record['asr']}, ensure_ascii=False), flush=True)
    # A replay is the very same original recording, never a replacement performance.
    for row in plan['lines']:
        if not row.get('replayOf'):
            continue
        original = row
        while original.get('replayOf'):
            original = rows[original['replayOf']]
        accepted = records[original['id']]
        if accepted['status'] == 'accepted':
            records[row['id']] = {**copy.deepcopy(accepted), **row, 'requestSha256': request_hash(plan, row),
                                  'productionMethod': 'replay_exact_original_bytes', 'replaySourceId': original['id']}
    pending = []
    for row in plan['lines']:
        record = records[row['id']]
        if record['status'] == 'accepted':
            verify_record(args.source, row, record, plan)
        else:
            pending.append({'id': row['id'], 'text': row['text'], 'status': record['status'], 'asr': record.get('asr')})
        save(args.source / row['id'] / 'record.json', record)
    archive.update(records=[records[row['id']] for row in plan['lines']],
                   reviewModel={'id': MODEL, 'revision': REVISION, 'files': model_files, 'networkPolicy': network},
                   humanListening=False)
    save(args.source / 'manifest.json', archive)
    report = {'schema': 1, 'project': plan['project'], 'target': len(rows), 'accepted': len(rows) - len(pending),
              'pendingCount': len(pending), 'pending': pending, 'semanticSha256': plan['semanticSha256'],
              'archive': args.source.as_posix(), 'reviewModel': {'id': MODEL, 'revision': REVISION},
              'humanListening': False, 'runtimeIntegration': 'pending', 'release': 'not_published'}
    save(args.report, report)
    print(json.dumps({k: report[k] for k in ('project', 'target', 'accepted', 'pendingCount')}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--model-dir', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--secondary-model-dir', type=Path)
    parser.add_argument('--candidates', type=Path)
    main(parser.parse_args())
