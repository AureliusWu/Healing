import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from recover_voice import recover
from render_full_voice import request_hash


class RecoveryTests(unittest.TestCase):
    def fixture(self, root):
        text = '我没有答应。'
        row = {'id': 'rain-line-001', 'text': text, 'actorId': 'actor', 'voice': 'Serena',
               'instruct': '自然清楚。', 'seed': 12, 'textSha256': hashlib.sha256(text.encode()).hexdigest()}
        plan = {'schema': 1, 'project': 'Rain', 'sourceCommit': 'a' * 40,
                'semanticSha256': 'b' * 64, 'scope': {'allBranches': True},
                'model': {'id': 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',
                          'revision': '0c0e3051f131929182e2c023b9537f8b1c68adfe', 'sampleRate': 24000},
                'actors': {'actor': {'voice': 'Serena', 'instruct': '自然清楚。'}}, 'lines': [row]}
        part = root / 'parts' / 'one'
        part.mkdir(parents=True)
        payload = part / 'raw.wav'
        payload.write_bytes(b'original-evidence')
        file = {'path': 'raw.wav', 'bytes': payload.stat().st_size,
                'sha256': hashlib.sha256(payload.read_bytes()).hexdigest()}
        record = {**row, 'requestSha256': request_hash(plan, row), 'status': 'accepted',
                  'asr': {'passed': True, 'transcript': text},
                  'files': {kind: dict(file) for kind in ('raw', 'master', 'runtime')}}
        plan_file = root / 'plan.json'
        plan_file.write_text(json.dumps(plan))
        return plan_file, part, record, plan

    def test_partial_run_recovers_accepted_audio_and_lists_every_missing_line(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            plan_file, part, record, plan = self.fixture(root)
            second = {**plan['lines'][0], 'id': 'rain-line-002'}
            plan['lines'].append(second)
            plan_file.write_text(json.dumps(plan))
            (part / 'manifest.json').write_text(json.dumps({'project': 'Rain', 'records': [record]}))
            recover(plan_file, root / 'parts', root / 'archive', root / 'report.json', 123)
            report = json.loads((root / 'report.json').read_text())
            self.assertEqual((report['target'], report['accepted'], report['pendingCount']), (2, 1, 1))
            self.assertEqual(report['pending'][0]['id'], second['id'])
            self.assertEqual((root / 'archive' / record['id'] / 'raw.wav').read_bytes(), b'original-evidence')

    def test_rejected_take_keeps_its_transcript_and_never_becomes_accepted(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            plan_file, part, record, _ = self.fixture(root)
            record.update(status='needs_review', asr={'passed': False, 'transcript': '我有答应。'})
            (part / 'manifest.json').write_text(json.dumps({'project': 'Rain', 'records': [record]}))
            recover(plan_file, root / 'parts', root / 'archive', root / 'report.json', 123)
            report = json.loads((root / 'report.json').read_text())
            self.assertEqual(report['accepted'], 0)
            self.assertEqual(report['pending'][0]['asr']['transcript'], '我有答应。')

    def test_changed_request_or_changed_audio_stops_recovery(self):
        for tamper in ('request', 'audio'):
            with tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                plan_file, part, record, _ = self.fixture(root)
                if tamper == 'request':
                    record['requestSha256'] = '0' * 64
                else:
                    (part / 'raw.wav').write_bytes(b'changed')
                (part / 'manifest.json').write_text(json.dumps({'project': 'Rain', 'records': [record]}))
                with self.assertRaises(ValueError):
                    recover(plan_file, root / 'parts', root / 'archive', root / 'report.json', 123)


if __name__ == '__main__':
    unittest.main()
