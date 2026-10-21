"""Explicit performance notes, bound to unchanged source words and actor identity."""
import hashlib
import json
from pathlib import Path


def load_directions(path, plan):
    if path is None:
        return {}
    spec = json.loads(Path(path).read_text(encoding='utf-8'))
    if spec.get('schema') != 1 or spec.get('project') != plan['project']:
        raise ValueError('Retake directions belong to another project')
    rows = {row['id']: row for row in plan['lines']}
    result = {}
    for item in spec.get('directions', []):
        row = rows.get(item.get('id'))
        if row is None or row['id'] in result or item.get('textSha256') != row['textSha256']:
            raise ValueError('Duplicate, unknown or stale retake direction')
        note = item.get('instruction')
        if not isinstance(note, str) or not note.strip() or len(note) > 600:
            raise ValueError('Invalid retake performance instruction')
        result[row['id']] = {
            'instruction': row['instruct'] + ' ' + note,
            'note': note,
            'textSha256': row['textSha256'],
            'directionSha256': hashlib.sha256(json.dumps(item, ensure_ascii=False, sort_keys=True).encode()).hexdigest(),
        }
    return result
