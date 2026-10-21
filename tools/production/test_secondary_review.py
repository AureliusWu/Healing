import unittest
from review_rejected_voice import strict_secondary

class SecondaryAcceptance(unittest.TestCase):
    def test_exact_and_all_tones_required(self):
        self.assertTrue(strict_secondary('这次别泡成复写联了。', '这次别泡成付写连了', None)['passed'])
        self.assertFalse(strict_secondary('直尺', '支持', None)['passed'])
        self.assertFalse(strict_secondary('别确认', '确认', None)['passed'])
        self.assertFalse(strict_secondary('直尺', '直尺直尺', None)['passed'])
        self.assertTrue(strict_secondary('直尺', '直尺。', None)['passed'])
