import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Icon } from './components/Icon';
import { Dialog } from './components/Dialog';
import { RecordSearch } from './components/RecordSearch';
import { CharacterSprite } from './components/CharacterSprite';
import { CharacterGallery } from './components/CharacterGallery';
import { ChapterMenu, MemoryBook, Credits } from './components/EditionPanels';
import { PwaPanel } from './components/PwaPanel';
import { FullscreenButton, RotationHint } from './components/DisplayControls';
import { useDisplayMode } from './useDisplayMode';
import { pwa } from './pwa';
import { advance, choose, continueStory, getScene, newGame, recordLine, sceneMap } from './game/engine';
import { rereadFrom } from './game/reread';
import { decodeSave, encodeSave, KEY, readEndings, readSave, readSettings, slots, writeSave, type Slot } from './game/storage';
import { applyProgressImport, createReadingBackup, decodeProgressFile } from './game/backup';
import { music } from './game/music';
import { RecordedVoice, voiceBlocksAuto } from './game/voice';
import { voiceFor } from './game/voice-catalog';
import { cgAt, backgroundAt } from './game/scene-media';
import { presentationAt } from './game/presentation';
import { musicFor, readGallery, readScores, rememberProgress } from './game/progress';
import type { CgId, GameState, HistoryEntry, MusicId, Save, Settings } from './game/types';
import { chapters, cgInfo, endingInfo } from './story';

type Panel = 'chapters' | 'characters' | 'memories' | 'settings' | 'saves' | 'history' | 'about' | 'credits' | 'pwa' | null;
const art = (name: string) => `${import.meta.env.BASE_URL}art/${name}.webp`;
const panelTitles = { chapters: '章节', characters: '与你相遇', memories: '回忆手册', settings: '阅读设置', saves: '存档', history: '已读文字', about: '关于这场青春', credits: '制作人员', pwa: '把故事留在身边' };
const backgroundLabels = { corridor: '雨后的教学楼走廊', 'rain-eaves': '教学楼门口的雨檐', 'bus-stop': '校园外的夜间公交站', 'bus-interior': '雨夜公交车的后排', classroom: '午后的校园教室', campus: '秋雨后的校园', clubroom: '旧刊室与长桌', home: '雨夜的家与餐桌', printshop: '文印室与新印的稿纸', riverbank: '雨停后的江边步道' };
const historyChapter = (entry: HistoryEntry) => {
  const chapter = chapters.find(item => item.id === (sceneMap.get(entry.sceneId)?.chapter ?? 1));
  return chapter ? { id: String(chapter.id), title: chapter.title } : undefined;
};

export function App() {
  const [voice] = useState(() => new RecordedVoice());
  const voiceState = useSyncExternalStore(voice.subscribe, voice.getState);
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [liveGame, setLiveGame] = useState<GameState>(newGame);
  const [reread, setReread] = useState<{ game: GameState; originalVisible: number } | null>(null);
  const rereading = reread !== null;
  const game = reread?.game ?? liveGame;
  const setGame = useCallback((update: (state: GameState) => GameState) => {
    if (rereading) setReread(current => current ? { ...current, game: update(current.game) } : current);
    else setLiveGame(update);
  }, [rereading]);
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [panel, setPanel] = useState<Panel>(null);
  const [saveList, setSaveList] = useState<Record<Slot, Save | null>>(() => Object.fromEntries(slots.map(s => [s, readSave(s)])) as Record<Slot, Save | null>);
  const [endings, setEndings] = useState<string[]>(readEndings);
  const [gallery, setGallery] = useState<CgId[]>(readGallery);
  const [scores, setScores] = useState<MusicId[]>(readScores);
  const [audition, setAudition] = useState<MusicId | null>(null);
  const [typing, setTyping] = useState({ key: 'arrival:0', count: 0 });
  const resumeTyping = useRef<typeof typing | null>(null);
  const [readingSession, setReadingSession] = useState(0);
  const [auto, setAuto] = useState(false);
  const [fast, setFast] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);
  const [pageHidden, setPageHidden] = useState(() => document.hidden);
  const [toast, setToast] = useState('');
  const pwaState = useSyncExternalStore(pwa.subscribe, pwa.getState);
  const [confirm, setConfirm] = useState<{ text: string; action: () => void; exportBefore?: boolean } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const currentRef = useRef(game);
  const storageWarning = useRef(false);
  currentRef.current = game;
  const scene = getScene(game);
  const line = scene.lines[game.line];
  const currentVoice = voiceFor(scene.id, game.line, line);
  const activeCg = cgAt(scene, game.line);
  const activeBackground = backgroundAt(scene, game.line);
  const characters = Array.from(line.text);
  const lineKey = `${game.sceneId}:${game.line}`;
  const visible = typing.key === lineKey ? typing.count : 0;
  const complete = visible >= characters.length;
  const typingPaused = screen !== 'game' || !!panel || !!confirm || uiHidden || pageHidden;
  const readHistory = complete ? recordLine(game).history : game.history;
  const lastLine = game.line === scene.lines.length - 1;
  const choicesVisible = lastLine && !!scene.choices && complete;
  const finished = lastLine && (!!scene.ending || !!scene.chapterEnd) && complete;
  const liveScene = getScene(liveGame);
  const liveTyping = reread ? reread.originalVisible : resumeTyping.current?.count ?? visible;
  const liveFinished = liveGame.line === liveScene.lines.length - 1 && (!!liveScene.ending || !!liveScene.chapterEnd) && liveTyping >= Array.from(liveScene.lines[liveGame.line].text).length;
  const chapter = chapters.find(item => item.id === (scene.chapter ?? 1))!;
  const closePanel = useCallback(() => setPanel(null), []);

  const notify = useCallback((message: string) => setToast(message), []);
  const display = useDisplayMode(notify);
  const hideInterface = useCallback(() => {
    setAuto(false); setFast(false); setToast(''); setUiHidden(true);
  }, []);
  useEffect(() => {
    voice.configure(settings.voiceEnabled !== false && !fast, settings.voiceVolume ?? .8,
      screen === 'game' && !panel && !confirm && !uiHidden, !pageHidden, panel === 'history');
  }, [voice, settings.voiceEnabled, settings.voiceVolume, screen, panel, confirm, uiHidden, pageHidden, fast]);
  useEffect(() => {
    if (screen === 'game') voice.enter(currentVoice ? { ...currentVoice, src: `${import.meta.env.BASE_URL}${currentVoice.src}` } : undefined,
      `${game.sceneId}/${game.line}/${readingSession}/${settings.voiceEnabled !== false}/${fast}`);
    else voice.stop();
  }, [voice, screen, game.sceneId, game.line, readingSession, currentVoice, settings.voiceEnabled, fast]);
  useEffect(() => () => voice.stop(), [voice]);
  useEffect(() => { if (screen === 'game') window.scrollTo(0, 0); }, [screen]);
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
    music.configure({ ...settings, volume: settings.volume * (voiceState.status === 'playing' ? .32 : 1), music: panel === 'memories' && !!audition ? true : settings.music });
    music.setScene(panel === 'memories' && audition ? audition : screen === 'game' ? musicFor(scene.id) : 'rain', screen === 'game' && panel !== 'memories' && !!scene.rain);
  }, [settings, scene.id, scene.rain, screen, audition, panel, voiceState.status]);
  useEffect(() => { if (panel !== 'memories') setAudition(null); }, [panel]);
  useEffect(() => {
    if (screen === 'game') store('auto', liveGame);
  }, [liveGame, screen, store]);
  useEffect(() => {
    const visibility = () => {
      setPageHidden(document.hidden);
      if (document.hidden) { setAuto(false); setFast(false); music.pause(); }
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useLayoutEffect(() => { setTyping(resumeTyping.current ?? { key: lineKey, count: 0 }); resumeTyping.current = null; }, [lineKey, line.text, readingSession]);
  useEffect(() => {
    if (typingPaused || document.hidden || complete) return;
    if (settings.textSpeed === 0 || fast || settings.reducedMotion) { setTyping({ key: lineKey, count: characters.length }); return; }
    const id = setInterval(() => setTyping(previous => document.hidden ? previous : ({ key: lineKey,
      count: Math.min((previous.key === lineKey ? previous.count : 0) + 1, characters.length),
    })), Math.round(1000 / settings.textSpeed));
    return () => clearInterval(id);
  }, [lineKey, line.text, readingSession, characters.length, settings.textSpeed, settings.reducedMotion, fast, typingPaused, complete]);

  const step = useCallback(() => {
    if (document.hidden || screen !== 'game' || panel || confirm) return;
    if (uiHidden) { setUiHidden(false); return; }
    if (finished) return;
    if (!complete) { setTyping({ key: lineKey, count: characters.length }); return; }
    if (!choicesVisible) { music.effect('page'); setGame(state => advance(state)); }
  }, [screen, panel, confirm, uiHidden, finished, complete, lineKey, characters.length, choicesVisible]);
  useEffect(() => {
    if (voiceBlocksAuto(voiceState) || (!auto && !fast) || typingPaused || !complete || choicesVisible || finished) return;
    const id = setTimeout(step, fast ? 70 : settings.autoDelay + Math.min(line.text.length * 45, 2500));
    return () => clearTimeout(id);
  }, [voiceState, auto, fast, typingPaused, complete, choicesVisible, finished, step, settings.autoDelay, line.text]);
  useEffect(() => {
    if (choicesVisible || finished) { setAuto(false); setFast(false); }
  }, [choicesVisible, finished]);
  useEffect(() => {
    if (screen !== 'game') return;
    try {
      const progress = rememberProgress(liveGame, liveFinished);
      setEndings(previous => previous.join() === progress.endings.join() ? previous : progress.endings);
      setGallery(previous => previous.join() === progress.gallery.join() ? previous : progress.gallery);
      setScores(previous => previous.join() === progress.scores.join() ? previous : progress.scores);
    } catch { /* The validated save still preserves the route if storage is unavailable. */ }
  }, [liveGame, liveFinished, screen]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (panel || confirm || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement).tagName)) return;
      if (screen === 'game' && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        if (event.repeat) return;
        if (uiHidden) setUiHidden(false); else hideInterface();
        return;
      }
      if (uiHidden) {
        if (['Escape', ' ', 'Enter', 'ArrowRight'].includes(event.key)) { event.preventDefault(); setUiHidden(false); }
        return;
      }
      if ((event.target as HTMLElement).tagName === 'BUTTON') return;
      if (event.key === 'Escape' && screen === 'game') { setPanel('saves'); return; }
      if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowRight') { event.preventDefault(); void music.unlock(); voice.unlock(); step(); }
      if (event.key.toLowerCase() === 'a' && screen === 'game') { setAuto(value => !value); setFast(false); }
      if (event.key.toLowerCase() === 'l' && screen === 'game') setPanel('history');
      if (event.key.toLowerCase() === 's' && screen === 'game') setPanel('saves');
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [panel, confirm, screen, step, uiHidden, hideInterface]);

  function begin() {
    const run = () => { setLiveGame(newGame()); setReread(null); setReadingSession(value => value + 1); setScreen('game'); setPanel(null); setUiHidden(false); setAuto(false); setFast(false); void music.unlock(); };
    if (saveList.auto) setConfirm({ text: '开始新的阅读会更新自动存档。手动存档会保留。', action: run });
    else run();
  }
  function restoreSave(save: Save, resumeCurrentTyping = false) {
    const sameReading = resumeCurrentTyping && !rereading && save.state.sceneId === liveGame.sceneId && save.state.line === liveGame.line
      && JSON.stringify(save.state.decisions) === JSON.stringify(liveGame.decisions);
    if (!sameReading) { resumeTyping.current = null; setReadingSession(value => value + 1); }
    setLiveGame(save.state); setReread(null); setScreen('game'); setPanel(null); setUiHidden(false); setAuto(false); setFast(false); void music.unlock(); notify('已回到上次停下的地方。');
  }
  function load(save: Save, resumeCurrentTyping = false) {
    if (rereading) setConfirm({ text: '读取存档会结束这次重读，并切换原进度。要继续吗？', action: () => restoreSave(save) });
    else restoreSave(save, resumeCurrentTyping);
  }
  function saveCurrent(slot: Slot, existing: Save | null) {
    const run = () => { if (store(slot, currentRef.current)) notify('这一刻已经保存。'); };
    if (rereading) setConfirm({ text: `要把重读内容存入手动存档 ${slot} 吗？${existing ? '这个位置原有的存档会更新。' : ''}原进度和自动存档会保留。`, action: run });
    else if (existing) setConfirm({ text: `要更新手动存档 ${slot} 吗？`, action: run });
    else run();
  }
  function requestReread(entry: HistoryEntry) {
    try {
      const restored = rereadFrom(currentRef.current, entry);
      setConfirm({ text: `从「${getScene(restored).title}」第 ${restored.line + 1} 段重新阅读，会更新自动存档。之后的选择可以重新决定，手动存档与已解锁回忆会保留。需要保留原进度，可先导出存档。`,
        action: () => load(encodeSave(restored)), exportBefore: true });
    } catch (error) { notify(error instanceof Error ? error.message : '无法恢复这段已读文字'); }
  }
  function startReread(entry: HistoryEntry) {
    try {
      const restored = rereadFrom(currentRef.current, entry);
      setReread({ game: restored, originalVisible: reread?.originalVisible ?? visible });
      setReadingSession(value => value + 1); setPanel(null); setUiHidden(false); setAuto(false); setFast(false);
    } catch (error) { notify(error instanceof Error ? error.message : '无法恢复这段已读文字'); }
  }
  function returnFromReread() {
    if (!reread) return;
    resumeTyping.current = { key: `${liveGame.sceneId}:${liveGame.line}`, count: reread.originalVisible };
    setReread(null); setReadingSession(value => value + 1); setPanel(null); setUiHidden(false); setAuto(false); setFast(false);
  }
  function returnToTitle() { returnFromReread(); setScreen('title'); setAuto(false); setFast(false); refreshSaves(); }
  function exportBackup() {
    try {
      const backup = createReadingBackup(screen === 'game' ? liveGame : undefined);
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a'); anchor.href = url;
      anchor.download = `MoistHealing-reading-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      notify(rereading ? '原进度的阅读备份已导出；重读可另存到手动存档。' : '完整阅读备份已导出。');
    } catch (error) { notify(error instanceof Error ? error.message : '暂时无法导出阅读备份'); }
  }
  function exportProgress() {
    const state = screen === 'game' ? liveGame : saveList.auto?.state;
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
      const imported = decodeProgressFile(await file.text());
      const text = imported.kind === 'single' ? '导入后会切换到这份存档，并更新自动存档。手动存档会保留。'
        : `这份备份包含 ${Object.keys(imported.slots).length} 份存档、${Object.keys(imported.chapters).length} 个章首和 ${imported.memories.endings.length} 段结局。导入会更新对应位置并合并结局、画面与音乐回忆；备份中没有的位置会保留。`;
      setConfirm({ text: `${rereading ? '导入会结束这次重读。' : ''}${text}`, action: () => {
        try {
          applyProgressImport(imported);
          refreshSaves(); setEndings(readEndings()); setGallery(readGallery()); setScores(readScores());
          const save = imported.kind === 'single' ? imported.save : imported.slots.auto;
          if (save) restoreSave(save); else { returnFromReread(); notify('阅读备份已导入，可以选择存档继续。'); }
        } catch (error) { notify(error instanceof Error ? error.message : '存档读取失败'); }
      } });
    } catch (error) { notify(error instanceof Error ? error.message : '存档读取失败'); }
    if (importRef.current) importRef.current.value = '';
  }
  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings(previous => ({ ...previous, [key]: value }));
  const { character: activeCharacter, expression: activeExpression } = presentationAt(scene, game.line);
  const navigation = <>
    <button onClick={() => setPanel('chapters')}><Icon name="book" /><span>章节</span></button>
    <button onClick={() => setPanel('characters')}><Icon name="users" /><span>角色</span></button>
    <button onClick={() => setPanel('memories')}><Icon name="leaf" /><span>回忆</span></button>
    <button onClick={() => setPanel('settings')}><Icon name="gear" /><span>设置</span></button>
  </>;

  return <div className={settings.reducedMotion ? 'app reduce-motion' : 'app'} onPointerDown={() => { void music.unlock(); voice.unlock(); }}>
    <div className="main-surface" inert={!!panel || !!confirm}>
    {screen === 'title' && <RotationHint display={display} reading={false} />}
    {screen === 'title' ? <main className="title-screen">
      <header className="title-header"><a className="brand" href="#" onClick={event => { event.preventDefault(); setPanel('about'); }}><span className="brand-mark"><Icon name="leaf" size={22} /></span><span>一场关于生长的故事</span></a><div className="title-actions"><FullscreenButton display={display} /><button className="sound-button" onClick={() => { setSetting('music', !settings.music); if (!settings.music) void music.unlock(); }} aria-label={settings.music ? '关闭音乐' : '开启音乐'}><Icon name={settings.music ? 'sound' : 'muted'} size={19} /><span>{settings.music ? '声音开启' : '声音关闭'}</span></button></div></header>
      <section className="title-copy">
        <div className="chapter-label"><span>COMPLETE EDITION</span><span className="short-rule" /><span>三章完结</span></div>
        <h1>湿性愈合<span className="title-dot">。</span></h1>
        <div className="english-title">MOIST HEALING</div>
        <p className="title-description">有些话，长大后才学会说。<br />有些人，在雨停之前就已靠近。</p>
        <div className="title-menu"><button className="primary start-button" onClick={begin}><span>开始阅读</span><Icon name="arrow" size={22} /></button><button className="continue-button" disabled={!saveList.auto} onClick={() => saveList.auto && load(saveList.auto, true)}><Icon name="history" size={18} /><span>{saveList.auto ? '继续上次的故事' : '故事，从这里开始'}</span></button></div>
        <nav className="title-nav" aria-label="游戏菜单">{navigation}</nav>
        <div className="chapter-note"><span className="note-number">03</span><div><span>生长痛 / 显影 / 雨停以后</span><p>三章故事，四个结局，留在同一页的青春。</p></div></div>
      </section>
      <section className="title-visual" aria-label="雨后校园与林见夏"><img className="cover-background" src={art('campus')} alt="秋雨后的校园，香樟树与湿润的跑道" /><div className="cover-wash" /><img className="cover-character" src={art('lin')} alt="林见夏，抱着文学笔记本的靠窗邻座" /><div className="visual-date">江城 · 九月<br /><span>17:42 / AFTER THE RAIN</span></div><div className="visual-caption"><span className="caption-line" /><p>“你还没想好，<br />也可以先留白。”</p><small>林见夏</small></div><span className="visual-index">01 — 03</span></section>
      <footer className="title-footer"><span><i className={`status-dot ${pwaState.status === 'ready' || pwaState.status === 'desktop' ? 'ready' : ''}`} />{pwaState.status === 'desktop' ? '桌面版 · 离线阅读' : pwaState.status === 'ready' ? `${pwaState.online ? '离线阅读已就绪' : '正在离线阅读'} · PWA` : pwaState.status === 'downloading' ? '正在下载离线内容…' : pwaState.status === 'error' ? '离线下载待重试' : '校园视觉小说 · 三章完结'}</span><div>{pwaState.status !== 'desktop' && <button onClick={() => setPanel('pwa')}><Icon name={pwaState.updateReady ? 'check' : 'download'} size={14} />{pwaState.updateReady ? '有新版本' : '安装与离线'}</button>}<button onClick={() => setPanel('saves')}>存档迁移</button><button onClick={() => setPanel('credits')}>制作人员</button><span>v{__APP_VERSION__}</span></div></footer>
    </main> : <main className="game-screen" data-scene={game.sceneId} data-line={game.line} data-ui-hidden={uiHidden} data-rereading={rereading}>
      {rereading && <aside className="reread-banner" aria-label="重读状态"><span>正在临时重读 · 原进度已保留</span><button onClick={returnFromReread}>返回原进度</button><button onClick={() => setConfirm({ text: '将这次重读作为后续阅读，会更新自动进度。原进度可先导出保留。', action: () => restoreSave(encodeSave(game)), exportBefore: true })}>沿此路线继续</button></aside>}
      <header className="game-header">
        <button className="paper-button" onClick={returnToTitle} aria-label="返回标题"><Icon name="home" size={17} /><span>湿性愈合</span></button>
        <div className="scene-heading"><span>0{chapter.id} / {chapter.title}</span><strong>{scene.title}</strong><div className="scene-time"><span>{scene.location}</span><small>{scene.time}</small></div></div>
        <div className="game-header-actions"><FullscreenButton display={display} compact /><button className="paper-button" onClick={() => setPanel('settings')} aria-label="阅读设置"><Icon name="gear" size={18} /></button></div>
      </header>
      <section className="game-stage" aria-label="故事画面">
        <div className="scene-frame">
          <img key={activeCg ?? activeBackground} className={activeCg ? 'scene-background scene-event' : 'scene-background'} data-cg={activeCg} data-background={activeBackground} src={art(activeCg ? `cg-${activeCg}` : activeBackground)} alt={activeCg ? cgInfo[activeCg].description : backgroundLabels[activeBackground]} />
          {!activeCg && activeCharacter && <CharacterSprite key={activeCharacter} character={activeCharacter} expression={activeExpression} className="scene-character" />}
        </div>
        <button className="scene-tap" onClick={step} aria-label={uiHidden ? '恢复阅读界面' : '继续剧情'} disabled={!uiHidden && (choicesVisible || finished)} />
        {uiHidden && <button className="focus-return" onClick={() => setUiHidden(false)}><Icon name="eye" size={16} /><span>恢复界面</span><kbd>H</kbd></button>}
      </section>
      {!uiHidden && <RotationHint display={display} reading /> }
      <div className="story-controls">
        <section className="reading-panel" aria-label="剧情文本">
          <div className="reading-context"><span>0{chapter.id} / {chapter.title}</span><span>{scene.location} · {scene.time}</span></div>
          <div className="speaker"><span className={line.speaker === '旁白' ? 'speaker-marker narration' : 'speaker-marker'} /><span>{line.speaker === '旁白' ? scene.title : line.speaker}</span><small>{line.speaker === '旁白' ? 'NARRATION' : 'DIALOGUE'}</small></div>
          {choicesVisible ? <div className="choice-panel" aria-label="剧情选择"><p className="choice-heading">{line.text}</p>{scene.choices!.map((choice, index) => <button key={choice.id} onClick={() => { music.effect('choice'); setGame(state => choose(state, choice.id)); setAuto(false); setFast(false); }}><span className="choice-number">0{index + 1}</span><span>{choice.text}</span><Icon name="arrow" size={17} /></button>)}</div>
          : <button className="dialogue-text" onClick={step} aria-label={complete ? '显示下一段' : '显示完整文字'} disabled={finished}><span className="sr-only">{line.text}</span><span aria-hidden="true">{characters.slice(0, visible).join('')}{!complete && <span className="typing-cursor" />}</span></button>}
          {finished && <section className="ending-card" aria-label="章节结局">
            <div><span className="eyebrow">CHAPTER 0{chapter.id} · END / {scene.ending ? endingInfo[scene.ending].badge : '显影 · 章节完成'}</span><h2>{scene.ending ? endingInfo[scene.ending].label : '这一版，已确认'}</h2><p>{scene.ending ? endingInfo[scene.ending].subtitle : '把答应过的事留给下一次打开柜门的下午。'}</p></div>
            <div className="ending-actions">{scene.continuation ? <button className="primary" onClick={() => { music.effect('choice'); setGame(state => continueStory(state)); }}>下一章 · {chapters[chapter.id].title} <Icon name="arrow" size={18} /></button> : <button className="primary" onClick={() => setPanel('credits')}>制作人员 <Icon name="arrow" size={18} /></button>}<button className="secondary" onClick={returnToTitle}>回到标题</button></div>
          </section>}
          {currentVoice && <div className="voice-controls" aria-label="人物语音">
            <button onClick={() => voice.replay({ ...currentVoice, src: `${import.meta.env.BASE_URL}${currentVoice.src}` })}>重听本句</button>
            {voiceState.status === 'playing' && <button onClick={() => voice.pause()}>暂停语音</button>}
            {['paused', 'blocked'].includes(voiceState.status) && <button onClick={() => voice.resume()}>继续语音</button>}
            {voiceState.status === 'failed' && <span>语音暂不可用，可继续阅读。</span>}
          </div>}
          <div className="reading-bottom">
            <div className="game-tools"><button onClick={() => setPanel('saves')}><Icon name="save" size={16} />存档</button><button onClick={() => setPanel('history')}><Icon name="history" size={16} />回看</button><button className={auto ? 'active' : ''} disabled={choicesVisible || finished} onClick={() => { setAuto(value => !value); setFast(false); }} aria-pressed={auto}><Icon name={auto ? 'pause' : 'play'} size={15} />自动</button><button className={fast ? 'active' : ''} disabled={choicesVisible || finished} onClick={() => { setFast(value => !value); setAuto(false); }} aria-pressed={fast}>快进</button><button onClick={hideInterface} aria-keyshortcuts="H" title="隐藏界面 · H，轻触画面恢复"><Icon name="eye-off" size={16} />隐藏界面</button></div>
            <span className="next-indicator">{finished ? '本章结束' : choicesVisible ? '请做出选择' : complete ? '点击继续 ◇' : '正在阅读'}</span>
          </div>
          <div className="reading-progress"><span style={{ width: `${((game.line + 1) / scene.lines.length) * 100}%` }} /></div>
        </section>
      </div>
    </main>}
    </div>

    {panel && !confirm && <Dialog title={panelTitles[panel]} onClose={closePanel} wide={panel === 'characters' || panel === 'saves' || panel === 'memories'} subtitle={panel === 'saves' ? '在这里留住进度，也可以带到另一台设备。' : undefined}>
      {panel === 'pwa' && <PwaPanel state={pwaState} />}
      {panel === 'chapters' && <ChapterMenu begin={begin} load={load} />}
      {panel === 'characters' && <CharacterGallery />}
      {panel === 'memories' && <MemoryBook endings={endings} gallery={gallery} scores={scores} load={load} audition={audition} onAudition={setAudition} />}
      {panel === 'credits' && <Credits />}
      {panel === 'settings' && <div className="settings-list"><label className="setting"><span>人物语音<small>按原文播放，也可逐句重听</small></span><input aria-label="人物语音" type="checkbox" checked={settings.voiceEnabled !== false} onChange={e => setSetting('voiceEnabled', e.target.checked)} /></label><label className="setting"><span>语音音量<small>{Math.round((settings.voiceVolume ?? .8) * 100)}%</small></span><input aria-label="语音音量" type="range" min="0" max="1" step="0.05" value={settings.voiceVolume ?? .8} onChange={e => setSetting('voiceVolume', +e.target.value)} /></label><label className="setting"><span>文字速度<small>{settings.textSpeed === 0 ? '一次显示全部' : `${settings.textSpeed} 字 / 秒`}</small></span><input aria-label="文字速度" type="range" min="0" max="80" step="4" value={settings.textSpeed} onChange={e => setSetting('textSpeed', +e.target.value)} /></label><label className="setting"><span>自动阅读停留<small>{(settings.autoDelay / 1000).toFixed(1)} 秒 + 段落阅读时间</small></span><input aria-label="自动阅读停留" type="range" min="800" max="6000" step="200" value={settings.autoDelay} onChange={e => setSetting('autoDelay', +e.target.value)} /></label><label className="setting"><span>背景音乐<small>六首原创配乐 · 首次点击后播放</small></span><input aria-label="背景音乐" type="checkbox" checked={settings.music} onChange={e => { setSetting('music', e.target.checked); if (e.target.checked) void music.unlock(); }} /></label><label className="setting"><span>声音音量<small>{Math.round(settings.volume * 100)}%</small></span><input aria-label="声音音量" type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={e => setSetting('volume', +e.target.value)} /></label><label className="setting"><span>环境雨声<small>在雨天场景播放，可独立关闭</small></span><input aria-label="环境雨声" type="checkbox" checked={settings.ambience} onChange={e => setSetting('ambience', e.target.checked)} /></label><label className="setting"><span>操作提示音<small>轻声提示翻页与选择</small></span><input aria-label="操作提示音" type="checkbox" checked={settings.soundEffects} onChange={e => setSetting('soundEffects', e.target.checked)} /></label><label className="setting"><span>减少动态效果<small>关闭动画并一次显示文字</small></span><input aria-label="减少动态效果" type="checkbox" checked={settings.reducedMotion} onChange={e => setSetting('reducedMotion', e.target.checked)} /></label><div className="display-setting"><div><strong>横屏阅读</strong><p>把手机横过来，能看见更多校园与角色。</p></div><FullscreenButton display={display} /></div><div className="keyboard-hints"><span>空格 / Enter · 继续</span><span>A · 自动</span><span>S / Esc · 存档</span><span>L · 回看</span><span>H · 隐藏 / 恢复界面</span></div><p className="soft-note">隐藏界面后会暂停自动阅读，轻触画面即可恢复，段落保持原位。推荐横屏游玩。安装后优先横屏；也可继续竖屏阅读，旋转时自动保留进度。若屏幕没有转向，请开启系统的自动旋转。</p></div>}
      {panel === 'saves' && <><div className="save-grid">{slots.map(slot => { const save = saveList[slot]; return <article key={slot} className="save-card"><div className="save-heading"><span>{slot === 'auto' ? '自动存档' : `手动存档 ${slot}`}</span><small>{save ? new Date(save.savedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '空白'}</small></div><h3>{save ? getScene(save.state).title : '把这一刻留下来'}</h3><p>{save ? `${getScene(save.state).location} · 第 ${save.state.line + 1} 段` : '开始阅读后可以存入这里。'}</p><div>{slot !== 'auto' && <button disabled={screen !== 'game'} onClick={() => saveCurrent(slot, save)}>存入</button>}<button disabled={!save} onClick={() => save && load(save)}>读取 <Icon name="arrow" size={14} /></button></div></article>; })}</div><div className="save-actions"><button onClick={exportBackup}><Icon name="download" size={18} />导出阅读备份</button><button onClick={exportProgress}><Icon name="download" size={18} />导出存档</button><button onClick={() => importRef.current?.click()}><Icon name="upload" size={18} />导入存档</button></div><p className="soft-note">手机与电脑共用存档格式。导出 JSON 后，在另一台设备导入即可继续；当前版本不提供账户云同步。</p></>}
      {panel === 'history' && <><div className="voice-controls" aria-label="历史语音控制">{voiceState.clip && voiceBlocksAuto(voiceState) && <button onClick={() => voiceState.status === 'playing' ? voice.pause() : voice.resume()}>{voiceState.status === 'playing' ? '暂停语音' : '继续语音'}</button>}</div><RecordSearch entries={readHistory} chapterFor={historyChapter} renderEntry={entry => <article><div className="history-entry-location"><span>{getScene({ ...game, sceneId: entry.sceneId }).title} · 第 {entry.line + 1} 段</span><button className="history-reread" onClick={() => startReread(entry)}>临时重读</button><button className="history-reread" onClick={() => requestReread(entry)}>从这里重读 <Icon name="arrow" size={14} /></button></div><span>{entry.speaker}</span><p>{entry.text}</p>{settings.voiceEnabled !== false && voiceFor(entry.sceneId, entry.line, entry) && <button onClick={() => { const clip = voiceFor(entry.sceneId, entry.line, entry); if (clip) voice.replay({ ...clip, src: `${import.meta.env.BASE_URL}${clip.src}` }, true); }}>重听语音</button>}</article>} /></>}
      {panel === 'about' && <div className="about-copy"><span className="about-leaf"><Icon name="leaf" size={46} /></span><p>《湿性愈合》是一部关于青春期、校园与靠近的原创视觉小说。</p><p>你扮演高二学生程屿，在一次月考后的换座中，与林见夏、陈知遥、许棠相遇。成绩、家庭期待、说不出口的话，都会成为这段故事的一部分。</p><p>三章《生长痛》《显影》《雨停以后》已完整收录。第一章保留三个章节结局，最后一个放学路口通向四个最终结局。“湿性愈合”在故事中作为情感隐喻：为尚未说完的话，保留一点可以被接住的空间。</p><p className="soft-note">创作 / AureliusWu 与 AI 协作<br />美术 / AI 生成原创背景与角色立绘<br />音乐 / 原创程序音序<br />版本 / {__APP_VERSION__}</p></div>}
    </Dialog>}
    {confirm && <Dialog title="留住这一刻" onClose={() => setConfirm(null)}><p className="confirm-text">{confirm.text}</p><div className="confirm-actions">{confirm.exportBefore && <button className="secondary" onClick={exportProgress}><Icon name="download" size={18} />导出原进度</button>}<button className="secondary" onClick={() => setConfirm(null)}>再想一下</button><button className="primary" onClick={() => { confirm.action(); setConfirm(null); }}>继续 <Icon name="arrow" size={18} /></button></div></Dialog>}
    <input ref={importRef} className="sr-only" tabIndex={-1} aria-label="选择存档文件" type="file" accept=".json,application/json" onChange={e => { void importProgress(e.target.files?.[0]); }} />
    <div className={toast ? 'toast visible' : 'toast'} role="status" aria-live="polite">{toast}</div>
  </div>;
}
