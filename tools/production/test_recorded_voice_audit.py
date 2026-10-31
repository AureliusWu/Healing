import copy
import json
from pathlib import Path
import unittest

from audit_recorded_voice import compare_requests


class RecordedVoiceAuditTests(unittest.TestCase):
    def setUp(self):
        self.retained = json.loads((Path(__file__).resolve().parents[2]
            / 'docs/production/full-media/dialogue-plan.json').read_text(encoding='utf-8'))

    def test_current_source_rebind_does_not_rewrite_recording_history(self):
        current = copy.deepcopy(self.retained)
        current['sourceCommit'] = 'a' * 40
        current['sourceFiles'] = [{'path': 'new-current-source', 'sha256': 'b' * 64}]
        compare_requests(self.retained, current)

    def test_changed_order_text_actor_model_or_scope_cannot_close_old_failure(self):
        mutations = [lambda p: p['lines'].reverse(),
            lambda p: p['lines'][0].update(seed=p['lines'][0]['seed'] + 1),
            lambda p: p['lines'][0].update(text='改写的台词'),
            lambda p: p['actors'][p['lines'][0]['actorId']].update(instruct='改变音色'),
            lambda p: p['model'].update(revision='main'),
            lambda p: p['scope'].update(allBranches=False)]
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                current = copy.deepcopy(self.retained)
                mutate(current)
                with self.assertRaises(ValueError):
                    compare_requests(self.retained, current)


if __name__ == '__main__':
    unittest.main()
