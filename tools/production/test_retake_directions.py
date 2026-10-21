import json
from pathlib import Path
import tempfile
import unittest
from retake_directions import load_directions


class RetakeDirectionsTests(unittest.TestCase):
    def test_source_words_and_actor_are_bound(self):
        row = {'id': 'clip', 'textSha256': 'exact-words', 'instruct': 'Original actor.'}
        plan = {'project': 'Healing', 'lines': [row]}
        with tempfile.TemporaryDirectory() as root:
            file = Path(root) / 'directions.json'
            spec = {'schema': 1, 'project': 'Healing', 'directions': [
                {'id': 'clip', 'textSha256': 'exact-words', 'instruction': 'Speak clearly.'}]}
            file.write_text(json.dumps(spec))
            direction = load_directions(file, plan)['clip']
            self.assertEqual(direction['instruction'], 'Original actor. Speak clearly.')
            self.assertEqual(row['instruct'], 'Original actor.')
            spec['directions'][0]['textSha256'] = 'changed-words'
            file.write_text(json.dumps(spec))
            with self.assertRaisesRegex(ValueError, 'stale'):
                load_directions(file, plan)
            spec['directions'][0]['textSha256'] = 'exact-words'
            spec['directions'].append(spec['directions'][0])
            file.write_text(json.dumps(spec))
            with self.assertRaisesRegex(ValueError, 'Duplicate'):
                load_directions(file, plan)

    def test_no_implicit_override(self):
        self.assertEqual(load_directions(None, {'project': 'Healing'}), {})
