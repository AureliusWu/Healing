import { useState } from 'react';
import { characterIds, expressionIds, expressionLabels } from '../game/presentation';
import type { Character, Expression } from '../game/types';
import { characterInfo } from '../story/chapter1';
import { CharacterSprite } from './CharacterSprite';

export function CharacterGallery() {
  const [view, setView] = useState<'expressions' | 'turnaround'>('expressions');
  const [expressions, setExpressions] = useState<Record<Character, Expression>>({ lin: 'neutral', chen: 'neutral', tang: 'neutral' });
  return <>
    <div className="character-gallery-tabs" role="group" aria-label="角色画集">
      <button aria-pressed={view === 'expressions'} onClick={() => setView('expressions')}>表情与档案</button>
      <button aria-pressed={view === 'turnaround'} onClick={() => setView('turnaround')}>三视图</button>
    </div>
    <div className={`character-cards character-gallery ${view === 'turnaround' ? 'turnaround-gallery' : ''}`}>
      {characterIds.map(id => <article key={id} className="character-card">
        {view === 'expressions' ? <>
          <div className="character-portrait"><CharacterSprite character={id} expression={expressions[id]} className="gallery-sprite" /></div>
          <div className="expression-options" role="group" aria-label={`${characterInfo[id].name}的表情`}>
            {expressionIds.map(expression => <button key={expression} aria-pressed={expressions[id] === expression}
              onClick={() => setExpressions(current => ({ ...current, [id]: expression }))}>{expressionLabels[expression]}</button>)}
          </div>
        </> : <figure className="character-turnaround">
          <img src={`${import.meta.env.BASE_URL}art/${id}-turnaround.webp`} alt={`${characterInfo[id].name}的正面、侧面、背面三视图`} />
          <figcaption>正面 / 侧面 / 背面</figcaption>
        </figure>}
        <span className="eyebrow">{characterInfo[id].role}</span><h3>{characterInfo[id].name}</h3>
        <p>{characterInfo[id].subtitle}</p><blockquote>{characterInfo[id].quote}</blockquote>
      </article>)}
    </div>
  </>;
}
