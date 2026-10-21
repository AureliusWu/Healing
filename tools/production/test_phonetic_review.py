import importlib.util
import unittest

from phonetic_review import review_homophones


@unittest.skipUnless(importlib.util.find_spec('pypinyin'), 'author-side pypinyin unavailable')
class PhoneticReviewTests(unittest.TestCase):
    def test_homophone_spelling_preserves_all_syllables_and_tones(self):
        result = review_homophones('你说得对。', '你说的对')
        self.assertTrue(result['passed'])
        self.assertEqual(result['observed'], '你说的对')
        self.assertFalse(result['humanListening'])
        self.assertTrue(review_homophones('罗禾', '罗河')['passed'])

    def test_wrong_tone_missing_syllable_negation_and_numbers_are_rejected(self):
        for expected, actual in [('没进档。', '没劲到'), ('单列。', 'HELLO'),
                                 ('我没有答应。', '我有答应'), ('你说得对。', '你说对'),
                                 ('先改成机械轻响。', '先改成机械倾向。'),
                                 ('十七是后来取文件的。', '17是后来取文件的'),
                                 ('我们一点二十一就报了。', '我们一点二十九报了')]:
            with self.subTest(expected=expected, actual=actual):
                self.assertFalse(review_homophones(expected, actual)['passed'])


if __name__ == '__main__':
    unittest.main()
