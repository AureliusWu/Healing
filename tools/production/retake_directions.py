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
        spoken = item.get('spokenText', row.get('spokenText', row['text']))
        phonetic = None
        if spoken != row.get('spokenText', row['text']):
            from phonetic_review import review_homophones
            from opencc import OpenCC
            phonetic = review_homophones(row.get('spokenText', row['text']), spoken, OpenCC('t2s'))
            if not phonetic['passed']:
                raise ValueError('Pronunciation spelling changes syllables or tones')
        segments = item.get('segments')
        if segments is not None:
            clean = lambda value: ''.join(c for c in value if c.isalnum())
            if (not isinstance(segments, list) or not 1 <= len(segments) <= 8
                    or any(not isinstance(s, str) or not s.strip() for s in segments)
                    or clean(''.join(segments)) != clean(spoken)):
                raise ValueError('Performance segmentation changes source words')
        result[row['id']] = {
            'instruction': row['instruct'] + ' ' + note,
            'note': note,
            'spokenText': spoken,
            **({'phoneticSpellingProof': phonetic} if phonetic is not None else {}),
            **({'segments': segments} if segments is not None else {}),
            'textSha256': row['textSha256'],
            'directionSha256': hashlib.sha256(json.dumps(item, ensure_ascii=False, sort_keys=True).encode()).hexdigest(),
        }
    return result
