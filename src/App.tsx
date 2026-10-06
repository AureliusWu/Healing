import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './components/Icon';
import { Dialog } from './components/Dialog';
import { advance, choose, getScene, newGame, recordLine } from './game/engine';
import { decodeSave, encodeSave, KEY, readEndings, readSave, readSettings, slots, writeSave, type Slot } from './game/storage';
import { music } from './game/music';
import type { GameState, Save, Settings } from './game/types';
import { characterInfo, endingInfo } from './story/chapter1';

type Panel = 'chapters' | 'characters' | 'memories' | 'settings' | 'saves' | 'history' | 'about' | null;
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}.webp`;
const panelTitles = { chapters: '章节', characters: '与你相遇', memories: '回忆手册', settings: '阅读设置', saves: '存档', history: '已读文字', about: '关于这场青春' };

export function App() {
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [game, setGame] = useState<GameState>(newGame);
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [panel, setPanel] = useState<Panel>(null);
  const [saveList, setSaveList] = useState<Record<Slot, Save | null>>(() => Object.fromEntries(slots.map(s => [s, readSave(s)])) as Record<Slot, Save | null>);
  const [endings, setEndings] = useState<string[]>(readEndings);
  const [visible, setVisible] = useState(0);
  const [auto, setAuto] = useState(false);
  const [fast, setFast] = useState(false);
  const [toast, setToast] = useState('');
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [confirm, setConfirm] = useState<{ text: string; action: () => void } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const currentRef = useRef(game);
  const storageWarning = useRef(false);
  currentRef.current = game;
  const scene = getScene(game);
  const line = scene.lines[game.line];
  const characters = Array.from(line.text);
  const complete = visible >= characters.length;
  const lastLine = game.line === scene.lines.length - 1;
  const choicesVisible = lastLine && !!scene.choices && complete;
  const finished = lastLine && !!scene.ending && complete;
  const closePanel = useCallback(() => setPanel(null), []);

  const notify = useCallback((message: string) => setToast(message), []);
  const refreshSaves = useCallback(() => setSaveList(Object.fromEntries(slots.map(s => [s, readSave(s)])) as Record<Slot, Save | null>), []);
  const store = useCallback((slot: Slot, state: GameState) => {
    try { writeSave(slot, state); refreshSaves(); return true; }
    catch { if (!storageWarning.current) { notify('暂时无法写入存档，请用导出存档保留进度。'); storageWarning.current = true; } return false; }
  }, [notify, refreshSaves]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    try { localStorage.setItem(`${KEY}:settings`, JSON.stringify(settings)); } catch { /* Settings can remain in memory. */ }
    music.configure(settings.music, settings.volume);
  }, [settings]);
  useEffect(() => {
    if (screen === 'game') store('auto', game);
  }, [game, screen, store]);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) { setAuto(false); setFast(false); music.pause(); }
    };
    const beforeInstall = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent); };
    const installed = () => { setInstall(null); notify('已安装，可以从桌面打开《湿性愈合》。'); };
    const connectivity = () => setOnline(navigator.onLine);
    const workerError = () => notify('离线下载未完成，联网时仍可阅读。请刷新后重试。');
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', installed);
    window.addEventListener('online', connectivity);
    window.addEventListener('offline', connectivity);
    window.addEventListener('pwa-error', workerError);
    if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol) && import.meta.env.PROD) {
      void navigator.serviceWorker.ready.then(() => setOfflineReady(true));
    }
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', installed);
      window.removeEventListener('online', connectivity);
      window.removeEventListener('offline', connectivity);
      window.removeEventListener('pwa-error', workerError);
    };
  }, [notify]);

  useEffect(() => {
    setVisible(0);
    if (settings.textSpeed === 0 || fast || settings.reducedMotion) { setVisible(Array.from(line.text).length); return; }
    const id = setInterval(() => setVisible(count => {
      if (count >= Array.from(line.text).length) clearInterval(id);
      return count + 1;
    }), Math.round(1000 / settings.textSpeed));
    return () => clearInterval(id);
  }, [game.sceneId, game.line, line.text, settings.textSpeed, settings.reducedMotion, fast]);

  const step = useCallback(() => {
    if (screen !== 'game' || panel || confirm || finished) return;
    if (!complete) { setVisible(characters.length); return; }
    if (!choicesVisible) setGame(state => advance(state));
  }, [screen, panel, confirm, finished, complete, characters.length, choicesVisible]);
  useEffect(() => {
    if ((!auto && !fast) || !complete || choicesVisible || finished || panel || confirm || screen !== 'game') return;
    const id = setTimeout(step, fast ? 70 : settings.autoDelay + Math.min(line.text.length * 45, 2500));
    return () => clearTimeout(id);
  }, [auto, fast, complete, choicesVisible, finished, panel, confirm, screen, step, settings.autoDelay, line.text]);
  useEffect(() => {
    if (choicesVisible || finished) { setAuto(false); setFast(false); }
  }, [choicesVisible, finished]);
  useEffect(() => {
    if (!finished || !scene.ending || screen !== 'game') return;
    setEndings(previous => {
      const result = [...new Set([...previous, scene.ending!])];
      try { localStorage.setItem(`${KEY}:endings`, JSON.stringify(result)); } catch { /* Exported save still contains the ending. */ }
      return result;
    });
  }, [finished, scene.ending, screen]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (panel || confirm || /INPUT|TEXTAREA|SELECT|BUTTON/.test((event.target as HTMLElement).tagName)) return;
      if (event.key === 'Escape' && screen === 'game') { setPanel('saves'); return; }
      if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowRight') { event.preventDefault(); void music.unlock(); step(); }
      if (event.key.toLowerCase() === 'a' && screen === 'game') { setAuto(value => !value); setFast(false); }
      if (event.key.toLowerCase() === 'l' && screen === 'game') setPanel('history');
      if (event.key.toLowerCase() === 's' && screen === 'game') setPanel('saves');
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [panel, confirm, screen, step]);

  function begin() {
    const run = () => { setGame(newGame()); setScreen('game'); setPanel(null); setAuto(false); setFast(false); void music.unlock(); };
    if (saveList.auto) setConfirm({ text: '开始新的阅读会更新自动存档。手动存档会保留。', action: run });
    else run();
  }
  function load(save: Save) {
    setGame(save.state); setScreen('game'); setPanel(null); setAuto(false); setFast(false); void music.unlock(); notify('已回到上次停下的地方。');
  }
  function exportProgress() {
    const state = screen === 'game' ? currentRef.current : saveList.auto?.state;
    if (!state) { notify('开始阅读后，就能导出进度。'); return; }
    const blob = new Blob([JSON.stringify(encodeSave(state), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `MoistHealing-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    notify('存档已导出。可在另一台设备导入继续。');
  }
  async function importProgress(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('存档文件过大');
      const save = decodeSave(await file.text());
      setConfirm({ text: '导入后会切换到这份存档，并更新自动存档。手动存档会保留。', action: () => load(save) });
    } catch (error) { notify(error instanceof Error ? error.message : '存档读取失败'); }
    if (importRef.current) importRef.current.value = '';
  }
  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings(previous => ({ ...previous, [key]: value }));
  const activeCharacter = line.speaker === '林见夏' ? 'lin' : line.speaker === '陈知遥' ? 'chen' : scene.character;
  const navigation = <>
    <button onClick={() => setPanel('chapters')}><Icon name="book" /><span>章节</span></button>
    <button onClick={() => setPanel('characters')}><Icon name="users" /><span>角色</span></button>
    <button onClick={() => setPanel('memories')}><Icon name="leaf" /><span>回忆</span></button>
    <button onClick={() => setPanel('settings')}><Icon name="gear" /><span>设置</span></button>
  </>;

  return <div className={settings.reducedMotion ? 'app reduce-motion' : 'app'} onPointerDown={() => { void music.unlock(); }}>
    <div className="main-surface" inert={!!panel || !!confirm}>
    {screen === 'title' ? <main className="title-screen">
      <header className="title-header"><a className="brand" href="#" onClick={event => { event.preventDefault(); setPanel('about'); }}><span className="brand-mark"><Icon name="leaf" size={22} /></span><span>一场关于生长的故事</span></a><button className="sound-button" onClick={() => { setSetting('music', !settings.music); if (!settings.music) void music.unlock(); }} aria-label={settings.music ? '关闭音乐' : '开启音乐'}><Icon name={settings.music ? 'sound' : 'muted'} size={19} /><span>{settings.music ? '声音开启' : '声音关闭'}</span></button></header>
      <section className="title-copy">
        <div className="chapter-label"><span>CHAPTER 01</span><span className="short-rule" /><span>生长痛</span></div>
        <h1>湿性愈合<span className="title-dot">。</span></h1>
        <div className="english-title">MOIST HEALING</div>
        <p className="title-description">有些话，长大后才学会说。<br />有些人，在雨停之前就已靠近。</p>
        <div className="title-menu"><button className="primary start-button" onClick={begin}><span>开始阅读</span><Icon name="arrow" size={22} /></button><button className="continue-button" disabled={!saveList.auto} onClick={() => saveList.auto && load(saveList.auto)}><Icon name="history" size={18} /><span>{saveList.auto ? '继续上次的故事' : '故事，从这里开始'}</span></button></div>
        <nav className="title-nav" aria-label="游戏菜单">{navigation}</nav>
        <div className="chapter-note"><span className="note-number">01</span><div><span>第一章 / 生长痛</span><p>九月、换座、旧校刊，还有一句没说完的话。</p></div></div>
      </section>
      <section className="title-visual" aria-label="雨后校园与林见夏"><img className="cover-background" src={art('campus')} alt="秋雨后的校园，香樟树与湿润的跑道" /><div className="cover-wash" /><img className="cover-character" src={art('lin')} alt="林见夏，抱着文学笔记本的靠窗邻座" /><div className="visual-date">江城 · 九月<br /><span>17:42 / AFTER THE RAIN</span></div><div className="visual-caption"><span className="caption-line" /><p>“你还没想好，<br />也可以先留白。”</p><small>林见夏</small></div><span className="visual-index">01 — 03</span></section>
      <footer className="title-footer"><span><i className={`status-dot ${offlineReady ? 'ready' : ''}`} />{location.protocol === 'file:' ? '桌面版 · 离线阅读' : offlineReady ? `${online ? '离线阅读已就绪' : '正在离线阅读'} · PWA` : '校园视觉小说 · 第一章'}</span><div>{install && <button onClick={async () => { try { await install.prompt(); setInstall(null); } catch { notify('请使用浏览器菜单中的“安装应用”。'); } }}><Icon name="download" size={14} />安装到桌面</button>}<button onClick={() => setPanel('saves')}>存档迁移</button><span>v{__APP_VERSION__}</span></div></footer>
    </main> : <main className="game-screen" data-scene={game.sceneId} data-line={game.line}>
      <img key={scene.background} className="scene-background" src={art(scene.background)} alt={scene.background === 'classroom' ? '午后的校园教室' : '雨后的校园'} />
      <div className="scene-shade" />
      <header className="game-header"><button className="paper-button" onClick={() => { setScreen('title'); setAuto(false); setFast(false); refreshSaves(); }} aria-label="返回标题"><Icon name="home" size={17} /><span>湿性愈合</span></button><div className="scene-heading"><span>第一章 · 生长痛</span><strong>{scene.title}</strong></div><button className="paper-button" onClick={() => setPanel('settings')} aria-label="阅读设置"><Icon name="gear" size={18} /></button></header>
      <div className="scene-time"><span>{scene.location}</span><small>{scene.time}</small></div>
      {activeCharacter && <img key={activeCharacter} className="scene-character" src={art(activeCharacter)} alt={characterInfo[activeCharacter].name} />}
      <button className="scene-tap" onClick={step} aria-label="继续剧情" disabled={choicesVisible || finished} />
      {choicesVisible && <div className="choice-panel" aria-label="剧情选择"><span className="choice-heading">这一刻，你想怎么做？</span>{scene.choices!.map((choice, index) => <button key={choice.id} onClick={() => { setGame(state => choose(state, choice.id)); setAuto(false); setFast(false); }}><span className="choice-number">0{index + 1}</span><span>{choice.text}</span><Icon name="arrow" size={17} /></button>)}</div>}
      <section className="reading-panel" aria-label="剧情文本"><div className="speaker"><span className={line.speaker === '旁白' ? 'speaker-marker narration' : 'speaker-marker'} /><span>{line.speaker === '旁白' ? scene.title : line.speaker}</span><small>{line.speaker === '旁白' ? 'NARRATION' : 'DIALOGUE'}</small></div><button className="dialogue-text" onClick={step} aria-label={complete ? '显示下一段' : '显示完整文字'} disabled={choicesVisible || finished}><span className="sr-only">{line.text}</span><span aria-hidden="true">{characters.slice(0, visible).join('')}{!complete && <span className="typing-cursor" />}</span></button><div className="reading-bottom"><div className="game-tools"><button onClick={() => setPanel('saves')}><Icon name="save" size={16} />存档</button><button onClick={() => setPanel('history')}><Icon name="history" size={16} />回看</button><button className={auto ? 'active' : ''} disabled={choicesVisible || finished} onClick={() => { setAuto(value => !value); setFast(false); }} aria-pressed={auto}><Icon name={auto ? 'pause' : 'play'} size={15} />自动</button><button className={fast ? 'active' : ''} disabled={choicesVisible || finished} onClick={() => { setFast(value => !value); setAuto(false); }} aria-pressed={fast}>快进</button></div><span className="next-indicator">{finished ? '本章结束' : choicesVisible ? '请做出选择' : complete ? '点击继续 ◇' : '正在阅读'}</span></div><div className="reading-progress"><span style={{ width: `${((game.line + 1) / scene.lines.length) * 100}%` }} /></div></section>
      {finished && scene.ending && <section className="ending-card" aria-label="章节结局"><span className="eyebrow">CHAPTER 01 · END</span><span className="ending-badge">{endingInfo[scene.ending].badge}</span><h2>{endingInfo[scene.ending].label}</h2><p>{endingInfo[scene.ending].subtitle}</p><button className="primary" onClick={() => { setScreen('title'); refreshSaves(); }}>回到标题 <Icon name="arrow" size={18} /></button></section>}
    </main>}
    </div>

    {panel && !confirm && <Dialog title={panelTitles[panel]} onClose={closePanel} wide={panel === 'characters' || panel === 'saves'} subtitle={panel === 'saves' ? '在这里留住进度，也可以带到另一台设备。' : undefined}>
      {panel === 'chapters' && <><button className="chapter-card" onClick={begin}><img src={art('campus')} alt="校园" /><div><span className="eyebrow">CHAPTER 01 · 可阅读</span><h3>生长痛</h3><p>一张成绩单，一本笔记，三个没说完的下午。</p><small>四次选择 · 三种结局</small></div><Icon name="arrow" /></button><p className="soft-note">当前版本包含完整第一章。后续章节将继续沿用你的故事选择。</p></>}
      {panel === 'characters' && <div className="character-cards">{(['lin', 'chen'] as const).map(id => <article key={id} className="character-card"><div className="character-portrait"><img src={art(id)} alt={characterInfo[id].name} /></div><span className="eyebrow">{characterInfo[id].role}</span><h3>{characterInfo[id].name}</h3><p>{characterInfo[id].subtitle}</p><blockquote>{characterInfo[id].quote}</blockquote></article>)}</div>}
      {panel === 'memories' && <><p className="soft-note">完成第一章后，相应的结局会留在这里。已解锁 {endings.length} / 3。</p><div className="memory-list">{Object.entries(endingInfo).map(([id, info], index) => <article key={id} className={endings.includes(id) ? 'memory unlocked' : 'memory'}><span>0{index + 1}</span><div><small>{endings.includes(id) ? info.badge : '尚未相遇'}</small><h3>{endings.includes(id) ? info.label : '未翻开的那一页'}</h3><p>{endings.includes(id) ? info.subtitle : '不同的选择，会让故事走向不同的地方。'}</p></div><Icon name={endings.includes(id) ? 'check' : 'book'} /></article>)}</div></>}
      {panel === 'settings' && <div className="settings-list"><label className="setting"><span>文字速度<small>{settings.textSpeed === 0 ? '一次显示全部' : `${settings.textSpeed} 字 / 秒`}</small></span><input aria-label="文字速度" type="range" min="0" max="80" step="4" value={settings.textSpeed} onChange={e => setSetting('textSpeed', +e.target.value)} /></label><label className="setting"><span>自动阅读停留<small>{(settings.autoDelay / 1000).toFixed(1)} 秒 + 段落阅读时间</small></span><input aria-label="自动阅读停留" type="range" min="800" max="6000" step="200" value={settings.autoDelay} onChange={e => setSetting('autoDelay', +e.target.value)} /></label><label className="setting"><span>背景音乐<small>原创轻音序 · 首次点击后播放</small></span><input aria-label="背景音乐" type="checkbox" checked={settings.music} onChange={e => { setSetting('music', e.target.checked); if (e.target.checked) void music.unlock(); }} /></label><label className="setting"><span>音乐音量<small>{Math.round(settings.volume * 100)}%</small></span><input aria-label="音乐音量" type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={e => setSetting('volume', +e.target.value)} /></label><label className="setting"><span>减少动态效果<small>关闭动画并一次显示文字</small></span><input aria-label="减少动态效果" type="checkbox" checked={settings.reducedMotion} onChange={e => setSetting('reducedMotion', e.target.checked)} /></label><div className="keyboard-hints"><span>空格 / Enter · 继续</span><span>A · 自动</span><span>S / Esc · 存档</span><span>L · 回看</span></div><p className="soft-note">手机支持横屏和竖屏；阅读进度会自动保存。安装 PWA 后可以离线阅读。</p></div>}
      {panel === 'saves' && <><div className="save-grid">{slots.map(slot => { const save = saveList[slot]; return <article key={slot} className="save-card"><div className="save-heading"><span>{slot === 'auto' ? '自动存档' : `手动存档 ${slot}`}</span><small>{save ? new Date(save.savedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '空白'}</small></div><h3>{save ? getScene(save.state).title : '把这一刻留下来'}</h3><p>{save ? `${getScene(save.state).location} · 第 ${save.state.line + 1} 段` : '开始阅读后可以存入这里。'}</p><div>{slot !== 'auto' && <button disabled={screen !== 'game'} onClick={() => { const run = () => { if (store(slot, currentRef.current)) notify('这一刻已经保存。'); }; if (save) setConfirm({ text: `要更新手动存档 ${slot} 吗？`, action: run }); else run(); }}>存入</button>}<button disabled={!save} onClick={() => save && load(save)}>读取 <Icon name="arrow" size={14} /></button></div></article>; })}</div><div className="save-actions"><button onClick={exportProgress}><Icon name="download" size={18} />导出存档</button><button onClick={() => importRef.current?.click()}><Icon name="upload" size={18} />导入存档</button></div><p className="soft-note">手机与电脑共用存档格式。导出 JSON 后，在另一台设备导入即可继续；当前版本不提供账户云同步。</p></>}
      {panel === 'history' && <div className="history-list">{recordLine(game).history.length === 0 ? <p>还没有读过的文字。</p> : recordLine(game).history.map((entry, index) => <article key={`${entry.sceneId}-${entry.line}-${index}`}><span>{entry.speaker}</span><p>{entry.text}</p></article>)}</div>}
      {panel === 'about' && <div className="about-copy"><span className="about-leaf"><Icon name="leaf" size={46} /></span><p>《湿性愈合》是一部关于青春期、校园与靠近的原创视觉小说。</p><p>你扮演高二学生程屿，在一次月考后的换座中，与林见夏和陈知遥相遇。成绩、家庭期待、说不出口的话，都会成为这段故事的一部分。</p><p>第一章《生长痛》有四次关键选择和三种结局。“湿性愈合”在故事中作为情感隐喻：为尚未说完的话，保留一点可以被接住的空间。</p><p className="soft-note">创作 / AureliusWu 与 AI 协作<br />美术 / AI 生成原创背景与角色立绘<br />音乐 / 原创程序音序<br />版本 / {__APP_VERSION__}</p></div>}
    </Dialog>}
    {confirm && <Dialog title="留住这一刻" onClose={() => setConfirm(null)}><p className="confirm-text">{confirm.text}</p><div className="confirm-actions"><button className="secondary" onClick={() => setConfirm(null)}>再想一下</button><button className="primary" onClick={() => { confirm.action(); setConfirm(null); }}>继续 <Icon name="arrow" size={18} /></button></div></Dialog>}
    <input ref={importRef} className="sr-only" tabIndex={-1} aria-label="选择存档文件" type="file" accept=".json,application/json" onChange={e => { void importProgress(e.target.files?.[0]); }} />
    <div className={toast ? 'toast visible' : 'toast'} role="status" aria-live="polite">{toast}</div>
  </div>;
}
