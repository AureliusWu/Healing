import { Fragment, useState, type ReactNode } from 'react';
import { filterHistory, historySpeakers, type ReplayEntry } from '../game/history';
import '../history-search.css';

type Props<T extends ReplayEntry> = {
  entries: readonly T[];
  renderEntry: (entry: T, originalIndex: number) => ReactNode;
  queryLabel?: string;
  showSpeakers?: boolean;
  emptyText?: string;
  ordered?: boolean;
  listClassName?: string;
};

export function RecordSearch<T extends ReplayEntry>({
  entries, renderEntry, queryLabel = '搜索已读文字', showSpeakers = true,
  emptyText = '还没有读过的文字。', ordered = false, listClassName = 'history-list',
}: Props<T>) {
  const [query, setQuery] = useState('');
  const [speaker, setSpeaker] = useState('');
  const indexed = entries.map((entry, index) => ({ ...entry, entry, index }));
  const visible = filterHistory(indexed, query, speaker);
  const List = ordered ? 'ol' : 'div';
  return <section className="record-search">
    <div className="record-search-controls">
      <label><span>{queryLabel}</span><input type="search" maxLength={80} value={query}
        placeholder="输入关键词" onChange={event => setQuery(event.target.value)} /></label>
      {showSpeakers && <label><span>说话人</span><select aria-label="说话人" value={speaker} onChange={event => setSpeaker(event.target.value)}>
        <option value="">全部人物</option>
        {historySpeakers(entries).map(who => <option key={who} value={who}>{who}</option>)}
      </select></label>}
      <button type="button" className="record-search-reset" disabled={!query && !speaker}
        onClick={() => { setQuery(''); setSpeaker(''); }}>清除筛选</button>
    </div>
    <p className="record-search-count" role="status" aria-live="polite">显示 {visible.length} / {entries.length} 条记录</p>
    {!entries.length ? <p className="record-search-empty">{emptyText}</p>
      : !visible.length ? <p className="record-search-empty">没有找到这条记录，可以换个关键词。</p>
      : <List className={listClassName} data-history-results>{visible.map(row =>
        <Fragment key={row.index}>{renderEntry(row.entry, row.index)}</Fragment>)}</List>}
  </section>;
}
