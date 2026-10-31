"""Revalidate retained recordings against current dialogue without inference.

Historical recording/approval metadata is immutable. A fresh exporter snapshot
binds this audit to current source; technical success is not listening approval
or a new player release.
"""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace

from render_full_voice import digest, merge, require, save, validate_plan
from seed_verified_voice import seed
from validate_runtime import validate


def compare_requests(retained, current):
    validate_plan(retained)
    validate_plan(current)
    for key in ('project', 'semanticSha256', 'model', 'actors', 'lines'):
        require(retained[key] == current[key], 'Current recording requests changed: ' + key)


def audit(root, current_path, decode=False):
    retained_path = root / 'docs/production/full-media/dialogue-plan.json'
    retained = json.loads(retained_path.read_text(encoding='utf-8'))
    current = json.loads(current_path.read_text(encoding='utf-8'))
    compare_requests(retained, current)
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
    require(current['sourceCommit'] == commit, 'Exporter snapshot belongs to another commit')
    require(current['sourceFiles'], 'Current source inventory is missing')
    seen = set()
    for source in current['sourceFiles']:
        relative = Path(source['path'])
        path = root / relative
        require(not relative.is_absolute() and '..' not in relative.parts
                and not path.is_symlink() and path.resolve().is_relative_to(root.resolve())
                and path.is_file() and source['path'] not in seen, 'Unsafe current source inventory')
        require(digest(path) == source['sha256'], 'Source changed after exporter snapshot')
        seen.add(source['path'])
    runtime = validate(root, complete=True, decode=decode)
    # Exercise the same seed -> merge path that failed in historical jobs.
    # Outputs are fresh temporary copies; retained recordings are never edited.
    with tempfile.TemporaryDirectory(prefix='recorded-voice-audit-') as directory:
        temp = Path(directory)
        result = seed(retained, root / 'assets_source/voice/continued-20261020',
                      temp / 'parts/part-0', 0, 1)
        require(result['pending'] == 0, 'Retained recordings still need production')
        merge(SimpleNamespace(plan=retained_path, parts=temp / 'parts', output=temp / 'complete'))
        merged = json.loads((temp / 'complete/full-voice.json').read_text(encoding='utf-8'))
        require(merged['count'] == len(retained['lines']), 'Merged coverage is incomplete')
    return {
        'schema': 1, 'project': retained['project'], 'sourceCommit': commit,
        'currentSourceFiles': current['sourceFiles'], 'semanticSha256': retained['semanticSha256'],
        'retainedPlanSha256': digest(retained_path), 'target': runtime['target'],
        'accepted': runtime['accepted'], 'decoded': bool(decode),
        'seedAndMerge': 'PASS', 'technicalStatus': 'PASS', 'synthesized': 0,
        'humanListening': False, 'runtimeInteraction': 'NOT_RUN', 'release': 'NOT_ASSESSED',
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--current-plan', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--decode', action='store_true')
    args = parser.parse_args()
    require(not args.report.exists(), 'Audit output already exists; preserve previous evidence')
    report = audit(Path.cwd(), args.current_plan, args.decode)
    save(args.report, report)
    print(json.dumps(report, ensure_ascii=False))
