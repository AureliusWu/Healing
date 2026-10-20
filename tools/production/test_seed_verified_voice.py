import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from render_full_voice import request_hash
from seed_verified_voice import seed


class SeedVerifiedVoiceTests(unittest.TestCase):
    def fixture(self, root):
        source = root / 'archive'
        source.mkdir()
        plan = json.loads((Path(__file__).resolve().parents[2] / 'docs/production/full-media/dialogue-plan.json').read_text())
        plan['lines'] = [copy.deepcopy(row) for row in plan['lines'] if not row.get('replayOf')][:3]
        records = []
        for index, row in enumerate(plan['lines'][:2]):
            files = {}
            for kind in ('raw', 'master', 'runtime'):
                path = source / (str(index) + '-' + kind + '.bin')
                path.write_bytes((row['id'] + kind).encode())
                files[kind] = {'path': path.name, 'bytes': path.stat().st_size,
                               'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
            records.append({**row, 'requestSha256': request_hash(plan, row), 'status': 'accepted' if index == 0 else 'needs_review',
                            'asr': {'passed': index == 0}, 'files': files})
        manifest = {'project': plan['project'], 'records': records}
        (source / 'manifest.json').write_text(json.dumps(manifest))
        return source, plan, manifest

    def test_changed_partition_keeps_exact_accepted_bytes_and_excludes_failed_or_missing(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source, plan, _ = self.fixture(root)
            output = root / 'new-partition'
            result = seed(plan, source, output, 0, 2)
            self.assertEqual(result, {'selected': 2, 'reused': 1, 'pending': 1})
            saved = json.loads((output / 'manifest.json').read_text())
            self.assertEqual(saved['records'][0]['id'], plan['lines'][0]['id'])
            for meta in saved['records'][0]['files'].values():
                self.assertEqual(hashlib.sha256((output / meta['path']).read_bytes()).hexdigest(), meta['sha256'])
            self.assertEqual(len(json.loads((source / 'manifest.json').read_text())['records']), 2)

    def test_corrupt_bytes_stale_request_duplicate_and_foreign_project_are_rejected(self):
        for mutation in ('bytes', 'request', 'duplicate', 'foreign'):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                source, plan, manifest = self.fixture(root)
                if mutation == 'bytes':
                    (source / manifest['records'][0]['files']['runtime']['path']).write_bytes(b'broken')
                elif mutation == 'request':
                    manifest['records'][0]['requestSha256'] = '0' * 64
                elif mutation == 'duplicate':
                    manifest['records'].append(manifest['records'][0])
                else:
                    manifest['project'] = 'unknown'
                (source / 'manifest.json').write_text(json.dumps(manifest))
                with self.assertRaises(ValueError):
                    seed(plan, source, root / 'output', 0, 1)

    def test_existing_checkpoint_and_invalid_partition_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source, plan, _ = self.fixture(root)
            with self.assertRaises(ValueError):
                seed(plan, source, root / 'bad', 2, 2)
            output = root / 'output'
            seed(plan, source, output, 0, 1)
            with self.assertRaises(ValueError):
                seed(plan, source, output, 0, 1)


if __name__ == '__main__':
    unittest.main()
