"""Review ASR spelling only when every Han syllable and tone is identical.

No edit-distance tolerance, numeric expansion, name substitution, or missing
syllables are allowed. Original ASR text and CER remain in the recording record.
This is a machine pronunciation check, not human listening approval.
"""
import re


def review_homophones(expected, transcript, converter=None):
    from pypinyin import Style, lazy_pinyin, load_phrases_dict

    # Correct the dictionary's de2 fallback for this grammatical neutral particle.
    load_phrases_dict({'说得对': [['shuō'], ['de'], ['duì']]})

    def normalize(text):
        text = converter.convert(text) if converter else text
        return ''.join(c for c in text if c.isalnum())

    expected, actual = normalize(expected), normalize(transcript)
    eligible = bool(expected) and len(expected) == len(actual) and all(
        re.fullmatch(r'[\u3400-\u9fff]+', text) is not None for text in (expected, actual))
    negative_match = all(expected.count(c) == actual.count(c) for c in ('不', '没'))
    target = lazy_pinyin(expected, style=Style.TONE3, neutral_tone_with_five=True) if eligible else []
    observed = lazy_pinyin(actual, style=Style.TONE3, neutral_tone_with_five=True) if eligible else []
    return {'method': 'exact_all_syllables_and_tones_pypinyin_0.53.0',
            'expected': expected, 'observed': actual,
            'expectedSyllables': target, 'observedSyllables': observed,
            'sameLength': len(expected) == len(actual), 'polarityCountsMatch': negative_match,
            'passed': bool(eligible and negative_match and target == observed),
            'humanListening': False}
