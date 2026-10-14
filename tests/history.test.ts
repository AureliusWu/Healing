import { describe, expect, test } from 'vitest';
import { filterHistory, historySpeakers } from '../src/game/history';

describe('search of already-read records', () => {
  const voice = { speaker: '季宁', text: '三号接收口 Ｄ３', context: '旧通信间', clip: 'original-voice' };
  const rows = [Object.freeze({ speaker: null, text: '钥匙响了。' }), Object.freeze(voice), Object.freeze({ ...voice })];
  test('normalizes full-width text, case and whitespace and intersects terms with the speaker', () => {
    expect(filterHistory(rows, '  d3\n旧通信间 ', '季宁')).toEqual(rows.slice(1));
    expect(filterHistory(rows, 'D3', '旁白')).toEqual([]);
    expect(historySpeakers(rows)).toEqual(['旁白', '季宁']);
  });
  test('keeps original voice identities, order and repeated visits without changing the input', () => {
    const found = filterHistory(rows, '三号');
    expect(found[0]).toBe(rows[1]); expect(found[1]).toBe(rows[2]);
    expect(filterHistory(rows)).toEqual(rows);
  });
  test('cannot reveal text outside the supplied read route', () => {
    const seen = rows.slice(0, 1);
    expect(filterHistory(seen, '三号')).toEqual([]);
    expect(historySpeakers(seen)).toEqual(['旁白']);
  });
});
