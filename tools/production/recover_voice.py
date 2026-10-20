"""Recover verified takes from an interrupted run without inventing full coverage."""
import argparse
import json
from pathlib import Path
import shutil

from render_full_voice import digest, request_hash, require, save, validate_plan, verify_record


def recover(plan_path, parts, output, report_path, run_id):
    plan = json.loads(plan_path.read_text(encoding='utf-8'))
    validate_plan(plan)
    expected = {row['id']: row for row in plan['lines']}
    candidates = {}
    manifests = sorted(parts.rglob('manifest.json'))
    require(bool(manifests), 'No previous production manifests were downloaded')
    for manifest_path in manifests:
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        require(manifest.get('project') == plan['project'], 'Foreign production project')
        for record in manifest.get('records', []):
            row = expected.get(record['id'])
            require(row is not None, 'Unexpected recording identity')
            require(record.get('requestSha256') == request_hash(plan, row),
                    'Current actor, text, seed or model differs from the previous take: ' + row['id'])
            root = manifest_path.parent.resolve()
            for file in record.get('files', {}).values():
                path = root / file['path']
                require(path.resolve().is_relative_to(root) and path.is_file() and not path.is_symlink(),
                        'Unsafe or missing previous take')
                require(path.stat().st_size == file['bytes'] and digest(path) == file['sha256'],
                        'Previous take bytes changed')
            if record.get('status') == 'accepted':
                verify_record(root, row, record, plan)
            previous = candidates.get(row['id'])
            if not previous or record.get('status') == 'accepted':
                candidates[row['id']] = (root, record)
    output.mkdir(parents=True, exist_ok=True)
    records, pending = [], []
    for row in plan['lines']:
        candidate = candidates.get(row['id'])
        if not candidate:
            pending.append({'id': row['id'], 'text': row['text'], 'status': 'missing'})
            continue
        root, original = candidate
        record = dict(original)
        record['files'] = {}
        folder = output / row['id']
        folder.mkdir(parents=True, exist_ok=True)
        for kind, file in original.get('files', {}).items():
            source = root / file['path']
            target = folder / (kind + source.suffix)
            shutil.copyfile(source, target)
            record['files'][kind] = {**file, 'path': target.relative_to(output).as_posix()}
        record['recoveredFromRun'] = run_id
        save(folder / 'record.json', record)
        records.append(record)
        if record.get('status') != 'accepted':
            pending.append({'id': row['id'], 'text': row['text'], 'status': record['status'],
                            'asr': record.get('asr'), 'error': record.get('error')})
    accepted = sum(record['status'] == 'accepted' for record in records)
    report = {'schema': 1, 'project': plan['project'], 'sourceRun': run_id,
              'semanticSha256': plan['semanticSha256'], 'target': len(expected),
              'accepted': accepted, 'pendingCount': len(pending), 'pending': pending,
              'status': 'recovered_verified_takes' if pending else 'all_recordings_recovered',
              'archive': output.as_posix(), 'humanListening': False, 'runtimeIntegration': 'pending',
              'release': 'not_published'}
    save(output / 'manifest.json', {'schema': 1, 'project': plan['project'], 'records': records,
                                   'semanticSha256': plan['semanticSha256'], 'sourceRun': run_id})
    save(report_path, report)
    print(json.dumps({key: report[key] for key in ('project', 'target', 'accepted', 'pendingCount')}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--parts', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--run-id', type=int, required=True)
    args = parser.parse_args()
    recover(args.plan, args.parts, args.output, args.report, args.run_id)
