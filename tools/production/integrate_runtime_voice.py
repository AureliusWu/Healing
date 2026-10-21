"""Import only byte-verified, text-bound, ASR-accepted dialogue into the player.

The original small voice catalogs remain immutable provenance. This generated
catalog expands their runtime coverage and retains exact legacy/replay bytes.
An incomplete author preview is permitted, but --require-complete is the
release gate. No inference runtime or network request enters the player.
"""
import argparse
import json
from pathlib import Path
import shutil
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_full_voice import digest, require, save, validate_plan, verify_record


def integrate(root, require_complete=False):
    plan = json.loads((root / 'docs/production/full-media/dialogue-plan.json').read_text())
    validate_plan(plan)
    source = root / 'assets_source/voice/continued-20261020'
    archive = json.loads((source / 'manifest.json').read_text())
    require(archive['project'] == plan['project'] and archive['semanticSha256'] == plan['semanticSha256'],
            'Foreign or stale voice archive')
    rows = {row['id']: row for row in plan['lines']}
    records = {record['id']: record for record in archive['records']}
    require(len(records) == len(archive['records']) and set(records) == set(rows), 'Incomplete or duplicate source bindings')
    accepted, pending = [], []
    for row in plan['lines']:
        record = records[row['id']]
        if record['status'] != 'accepted':
            pending.append({'id': row['id'], 'text': row['text'], 'reason': record['status']})
            continue
        verify_record(source, row, record, plan)
        accepted.append((row, record))
    project = plan['project']
    player = root / ('game' if project == 'Rain' else 'public')
    legacy = {}
    assets = None
    if project == 'Rain':
        legacy = {v['line_id']: v for v in json.loads((root / 'game/data/voice_manifest.json').read_text())['voices']}
        assets = json.loads((root / 'game/data/asset_manifest.json').read_text())
        # Preserve the ordinary Ren'Py asset validator, including full decoding.
        sys.path.insert(0, str(root))
        from tools.audio_process.metadata import audio_metadata
    clips, bindings = [], []
    for row, record in accepted:
        recording_root = row
        while recording_root.get('replayOf'):
            recording_root = rows[recording_root['replayOf']]
        original = records[recording_root['id']]
        require(original['status'] == 'accepted', 'Accepted replay lacks an accepted original')
        require(record['files']['runtime']['sha256'] == original['files']['runtime']['sha256'],
                'Replay does not reuse the original recording')
        meta = original['files']['runtime']
        suffix = Path(meta['path']).suffix
        rel = f"audio/voice/full-20261021/{recording_root['id']}{suffix}"
        preserved = None
        if project == 'Rain' and row['lineId'] in legacy:
            preserved = legacy[row['lineId']]
            require(preserved['text'] == row['text'] and preserved['character'] == row['speaker'],
                    'Legacy line identity changed')
            rel = preserved['file']
        elif project == 'Circuit' and recording_root.get('legacy'):
            rel = next(file['path'].removeprefix('public/') for file in recording_root['legacy']['files']
                       if file['path'].startswith('public/'))
            require(digest(player / rel) == meta['sha256'], 'Legacy runtime bytes changed')
        else:
            dest = player / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source / meta['path'], dest)
        clip = {'id': row['id'], 'lineId': row['lineId'].removesuffix('--variant') if row.get('variant') else row['lineId'], 'sceneId': row['sceneId'],
                'lineIndex': row['lineIndex'], 'speaker': row.get('sourceSpeaker', row['speaker']),
                'text': row.get('sourceText', row['text']), 'src': rel}
        if project == 'Circuit':
            clip = {'id': recording_root.get('legacy', {}).get('id', recording_root['id']),
                    'productionId': row['id'], 'character': row['actorId'], 'text': row['text'],
                    'src': '/' + rel, 'bindings': [{'chapter': row['sceneId'], 'node': row['nodeId']}],
                    'start': row['start']}
        elif project == 'Rain':
            clip.update(voice_id=preserved['voice_id'] if preserved else row['id'].replace('-', '_'),
                        line_id=row['lineId'], character=row['speaker'], file=rel)
        clips.append(clip)
        bindings.append({'id': row['id'], 'source': str((source / meta['path']).relative_to(root)),
                         'runtime': str((player / rel).relative_to(root)), 'sha256': digest(player / rel),
                         'recordedSha256': meta['sha256'], 'requestSha256': record['requestSha256'],
                         'preservedLegacy': bool(preserved or recording_root.get('legacy')),
                         'replayOf': row.get('replayOf'), 'asrPassed': record['asr']['passed']})
        if project == 'Rain' and not preserved:
            master = source / record['files']['master']['path']
            asset = {'id': row['id'].replace('-', '_'), 'type': 'voice', 'file': rel,
                     'source': 'Pinned offline Qwen3-TTS; full-media plan and accepted recording retained',
                     'license': 'Project-only generated character voice; Qwen3-TTS Apache-2.0',
                     'version': 1, 'approved': True, 'status': 'candidate_user_review',
                     'sha256': digest(player / rel), 'source_file': master.relative_to(root).as_posix(),
                     'source_sha256': digest(master), 'audio': audio_metadata(player / rel),
                     'source_audio': audio_metadata(master),
                     'production_record_id': row['id'],
                     'production_request_sha256': record['requestSha256'],
                     'approval_scope': 'Agent integration review; human listening pending'}
            old = next((i for i, a in enumerate(assets['assets']) if a['id'] == asset['id']), None)
            if old is None: assets['assets'].append(asset)
            else: assets['assets'][old] = asset
    manifest = {'schema': 1, 'project': project, 'target': len(rows), 'accepted': len(clips),
                'complete': not pending, 'clips': clips}
    dest = root / ('game/data/full_voice_manifest.json' if project == 'Rain' else 'src/game/full-voice-manifest.json')
    save(dest, manifest)
    if assets is not None: save(root / 'game/data/asset_manifest.json', assets)
    report = {'schema': 1, 'project': project, 'semanticSha256': plan['semanticSha256'],
              'target': len(rows), 'accepted': len(clips), 'pending': pending, 'bindings': bindings,
              'humanListening': False, 'release': 'not_published',
              'status': 'runtime_files_bound' if not pending else 'author_preview_incomplete'}
    save(root / 'docs/production/full-media/runtime-voice.json', report)
    print(json.dumps({k: report[k] for k in ['project', 'target', 'accepted', 'pending', 'status']}, ensure_ascii=False))
    require(not require_complete or not pending, 'Full dialogue release gate: unresolved recordings remain')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--require-complete', action='store_true')
    args = parser.parse_args()
    integrate(Path.cwd(), args.require_complete)
