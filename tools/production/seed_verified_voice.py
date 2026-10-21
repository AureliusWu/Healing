"""Seed a new render partition with verified takes from the recovered archive.

Only exact accepted requests are copied. New, missing and rejected requests stay
unseeded; the normal offline renderer retries them without weakening ASR gates.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import shutil

from render_full_voice import canonical, request_hash, require, save, validate_plan, verify_record


def seed(plan, source, output, index, count, review_homophones=False):
    validate_plan(plan)
    require(0 <= index < count <= 128, 'Invalid production partition')
    require(not (output / 'manifest.json').exists(), 'Refuse to overwrite a production checkpoint')
    archive = json.loads((source / 'manifest.json').read_text(encoding='utf-8'))
    require(archive.get('project') == plan['project'], 'Foreign recording archive')
    expected = {row['id']: row for row in plan['lines']}
    records = {}
    for record in archive['records']:
        identity = record['id']
        require(identity in expected and identity not in records, 'Unknown or duplicate recovered take')
        if record.get('requestSha256') != request_hash(plan, expected[identity]):
            require(record.get('status') != 'accepted', 'Recovered accepted request changed')
            continue
        records[identity] = record
    selected = plan['lines'][index::count]
    retained = []
    for row in selected:
        previous = records.get(row['id'])
        if not previous:
            continue
        previous = copy.deepcopy(previous)
        if review_homophones and previous['status'] == 'needs_review':
            from phonetic_review import review_homophones as review
            from opencc import OpenCC
            proof = review(row['text'], previous.get('asr', {}).get('transcript', ''), OpenCC('t2s'))
            previous['asr']['phoneticReview'] = proof
            if proof['passed']:
                previous['status'] = 'accepted'
                previous['asr']['passed'] = True
                previous['asr']['acceptance'] = 'exact_toned_homophones'
        if previous['status'] != 'accepted':
            continue
        verify_record(source, row, previous, plan)
        record = copy.deepcopy(previous)
        for kind, meta in record['files'].items():
            target = output / 'reused' / row['id'] / (kind + Path(meta['path']).suffix)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source / meta['path'], target)
            meta['path'] = target.relative_to(output).as_posix()
        verify_record(output, row, record, plan)
        retained.append(record)
    save(output / 'manifest.json', {
        'schema': 1, 'project': plan['project'],
        'planSha256': hashlib.sha256(canonical(plan)).hexdigest(),
        'semanticSha256': plan['semanticSha256'], 'sourceCommit': plan['sourceCommit'],
        'shardIndex': index, 'shardCount': count,
        'requestedIds': [row['id'] for row in selected],
        'records': retained, 'status': 'accepted' if len(retained) == len(selected) else 'incomplete', 'humanListening': False,
        'resumeEvidence': {'archiveManifestSha256': hashlib.sha256((source / 'manifest.json').read_bytes()).hexdigest(),
                           'reusedAccepted': len(retained)}})
    return {'selected': len(selected), 'reused': len(retained), 'pending': len(selected) - len(retained)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--shard-index', type=int, required=True)
    parser.add_argument('--shard-count', type=int, required=True)
    parser.add_argument('--review-homophones', action='store_true')
    args = parser.parse_args()
    print(json.dumps(seed(json.loads(args.plan.read_text()), args.source, args.output,
                          args.shard_index, args.shard_count, args.review_homophones)))
