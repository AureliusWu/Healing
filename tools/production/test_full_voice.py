import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from render_full_voice import merge, request_hash, split_text, transcript_result, validate_plan, verify_record


class FullDialogueProductionTests(unittest.TestCase):
    def setUp(self):
        self.plan = {'schema': 1, 'project': 'NetLove', 'sourceCommit': 'a' * 40,
            'semanticSha256': 'b' * 64, 'scope': {'allBranches': True},
            'model': {'id': 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',
                'revision': '0c0e3051f131929182e2c023b9537f8b1c68adfe', 'sampleRate': 24000},
            'actors': {'actor': {'voice': 'Serena', 'instruct': '自然清楚。'}},
            'lines': [{'id': 'netlove-line-001', 'text': '我没有答应。', 'actorId': 'actor',
                'voice': 'Serena', 'instruct': '自然清楚。', 'seed': 12,
                'textSha256': hashlib.sha256('我没有答应。'.encode()).hexdigest()}]}

    def test_all_branch_text_actor_and_unique_identity_are_required(self):
        validate_plan(self.plan)
        for mutate in [lambda p: p['scope'].update(allBranches=False),
                lambda p: p['lines'].append(copy.deepcopy(p['lines'][0])),
                lambda p: p['lines'][0].update(id='../escape'),
                lambda p: p['lines'][0].update(text='改变正文'),
                lambda p: p['lines'][0].update(actorId='unknown'),
                lambda p: p['lines'][0].update(voice='another'),
                lambda p: p['model'].update(revision='main')]:
            plan = copy.deepcopy(self.plan)
            mutate(plan)
            with self.assertRaises(ValueError):
                validate_plan(plan)

    def test_generation_chunks_preserve_every_character_and_bound_long_lines(self):
        for text in ['嗯。', '今天没有答应。你还要问吗？', '很长的一句话，' * 60, '第一句\n第二句！']:
            parts = split_text(text)
            self.assertEqual(''.join(parts), text)
            self.assertTrue(all(0 < len(part) <= 72 for part in parts))

    def test_independent_transcript_cannot_drop_negation_even_with_low_cer(self):
        self.assertTrue(transcript_result('我没有答应。', '我没有答应')['passed'])
        self.assertFalse(transcript_result('我没有答应。', '我有答应')['passed'])
        self.assertFalse(transcript_result('这件事我还不确定，明天会再问一次。', '这件事我还确定，明天会再问一次')['passed'])
        self.assertFalse(transcript_result('嗯。', '')['passed'])

    def test_record_acceptance_checks_actual_bytes_and_rejects_path_escape(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            file = root / 'fixture.ogg'
            file.write_bytes(b'fixture')
            metadata = {'path': file.name, 'bytes': 7, 'sha256': hashlib.sha256(b'fixture').hexdigest()}
            row = self.plan['lines'][0]
            record = {**row, 'requestSha256': request_hash(self.plan, row), 'status': 'accepted',
                'asr': {'passed': True}, 'files': {kind: dict(metadata) for kind in ('raw', 'master', 'runtime')}}
            verify_record(root, row, record, self.plan)
            for mutate in [lambda r: r.update(status='needs_review'),
                    lambda r: r['files']['runtime'].update(path='../escape'),
                    lambda r: r['files']['master'].update(sha256='0' * 64)]:
                bad = copy.deepcopy(record)
                mutate(bad)
                with self.assertRaises(ValueError):
                    verify_record(root, row, bad, self.plan)
            file.write_bytes(b'changed')
            with self.assertRaises(ValueError):
                verify_record(root, row, record, self.plan)

    def test_merge_cannot_call_a_partial_clip_set_full_coverage(self):
        from types import SimpleNamespace
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            plan = root / 'plan.json'
            plan.write_text(json.dumps(self.plan))
            (root / 'parts').mkdir()
            with self.assertRaisesRegex(ValueError, 'coverage is incomplete'):
                merge(SimpleNamespace(plan=plan, parts=root / 'parts', output=root / 'complete'))
            self.assertFalse((root / 'complete').exists())


if __name__ == '__main__':
    unittest.main()
