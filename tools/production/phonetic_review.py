"""Review ASR spelling only when every Han syllable and tone is identical.

No edit-distance tolerance, name substitution, or missing syllables are allowed.
Explicit integer digits and 24-hour clock tokens are expanded without changing
their values. Original ASR text and CER remain in the recording record.
This is a machine pronunciation check, not human listening approval.
"""
import re


def han_integer(value):
    digits = '零一二三四五六七八九'
    if value == 0:
        return digits[0]
    result, zero = '', False
    for divisor, unit in [(1000, '千'), (100, '百'), (10, '十'), (1, '')]:
        digit, value = divmod(value, divisor)
        if digit:
            if zero:
                result += '零'
            result += digits[digit] + unit
            zero = False
        elif result and value:
            zero = True
    return result[1:] if result.startswith('一十') else result


def expand_asr_numbers(text):
    def clock(match):
        hour, minute = map(int, match.groups())
        if not (0 <= hour < 24 and 0 <= minute < 60):
            return match.group()
        return han_integer(hour) + '点' + ('零' if 0 < minute < 10 else '') + han_integer(minute) + '分'
    text = re.sub(r'(?<!\d)(\d{1,2}):(\d{2})(?!\d)', clock, text)
    def integer(match):
        raw = match.group()
        return han_integer(int(raw)) if len(raw) <= 4 and (len(raw) == 1 or not raw.startswith('0')) else raw
    return re.sub(r'\d+', integer, text)


def review_homophones(expected, transcript, converter=None):
    from pypinyin import Style, lazy_pinyin, load_phrases_dict

    # Correct the dictionary's de2 fallback for this grammatical neutral particle.
    load_phrases_dict({'说得对': [['shuō'], ['de'], ['duì']],
                       '你应了': [['nǐ'], ['yìng'], ['le']],
                       '坐得比': [['zuò'], ['de'], ['bǐ']]})

    def normalize(text):
        text = converter.convert(text) if converter else text
        return ''.join(c for c in expand_asr_numbers(text) if c.isalnum())

    expected, actual = normalize(expected), normalize(transcript)
    eligible = bool(expected) and len(expected) == len(actual) and all(
        re.fullmatch(r'[\u3400-\u9fff]+', text) is not None for text in (expected, actual))
    negative_match = all(expected.count(c) == actual.count(c) for c in ('不', '没'))
    target = lazy_pinyin(expected, style=Style.TONE3, neutral_tone_with_five=True) if eligible else []
    observed = lazy_pinyin(actual, style=Style.TONE3, neutral_tone_with_five=True) if eligible else []
    return {'method': 'exact_all_syllables_tones_and_explicit_numeric_values_v2_pypinyin_0.53.0',
            'expected': expected, 'observed': actual,
            'expectedSyllables': target, 'observedSyllables': observed,
            'sameLength': len(expected) == len(actual), 'polarityCountsMatch': negative_match,
            'passed': bool(eligible and negative_match and target == observed),
            'humanListening': False}
