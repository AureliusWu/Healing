import { chapters, cgInfo, endingInfo } from '../story';
import { sceneMap } from './engine';
import { musicFor, readChapter, readEnding, readGallery, readScores, readUnlockProof } from './progress';
import { scoreInfo } from './score';
import { decodeSave, encodeSave, KEY, readEndings, readSave, slots, type Slot } from './storage';
import type { CgId, Ending, GameState, MusicId, Save } from './types';

type Chapter = 1 | 2 | 3;
const endingIds = Object.keys(endingInfo) as Ending[];
const proofIds = [...Object.keys(cgInfo).map(id => `gallery:${id}`), ...Object.keys(scoreInfo).map(id => `scores:${id}`)];

// History and scores are reconstructed by decodeSave/replay, rather than repeated
// in every checkpoint. Stable story identity and actual decisions travel with it.
export type CompactSave = Omit<Save, 'state'> & { state: Pick<GameState, 'schema' | 'storyVersion' | 'sceneId' | 'line' | 'decisions'> };
export type ReadingBackup = {
  format: 'moist-healing-reading-backup'; schema: 1; game: 'moist-healing'; storyVersion: 'moist-healing-v1'; exportedAt: string;
  slots: Partial<Record<Slot, CompactSave>>;
  chapters: Partial<Record<Chapter, CompactSave>>;
  endings: Partial<Record<Ending, CompactSave>>;
  proofs: Partial<Record<string, CompactSave>>;
  memories: { endings: Ending[]; gallery: CgId[]; scores: MusicId[] };
};
export type ProgressImport = { kind: 'single'; save: Save } | {
  kind: 'backup'; slots: Partial<Record<Slot, Save>>;
  chapters: Partial<Record<Chapter, Save>>; endings: Partial<Record<Ending, Save>>;
  proofs: Partial<Record<string, Save>>;
  memories: ReadingBackup['memories'];
};

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function compact(save: Save): CompactSave {
  const { schema, storyVersion, sceneId, line, decisions } = save.state;
  return { schema: 1, game: 'moist-healing', savedAt: save.savedAt, state: { schema, storyVersion, sceneId, line, decisions } };
}
export function createReadingBackup(current?: GameState, date = new Date()): ReadingBackup {
  const saves: ReadingBackup['slots'] = {};
  for (const slot of slots) {
    const save = slot === 'auto' && current ? encodeSave(current, date) : readSave(slot);
    if (save) saves[slot] = compact(save);
  }
  const chapterProofs: ReadingBackup['chapters'] = {};
  for (const chapter of chapters) { const save = readChapter(chapter.id); if (save) chapterProofs[chapter.id] = compact(save); }
  const endingProofs: ReadingBackup['endings'] = {};
  for (const ending of endingIds) { const save = readEnding(ending); if (save) endingProofs[ending] = compact(save); }
  const proofs: ReadingBackup['proofs'] = {};
  for (const id of proofIds) { const save = readUnlockProof(id); if (save) proofs[id] = compact(save); }
  const result: ReadingBackup = { format: 'moist-healing-reading-backup', schema: 1, game: 'moist-healing', storyVersion: 'moist-healing-v1', exportedAt: date.toISOString(),
    slots: saves, chapters: chapterProofs, endings: endingProofs, proofs,
    memories: { endings: readEndings().filter((id): id is Ending => endingIds.includes(id as Ending)), gallery: readGallery(), scores: readScores() } };
  // Refuse an incomplete export rather than silently drop an old unlock.
  decodeProgressFile(JSON.stringify(result));
  return result;
}
function saveMap<T extends string | number>(value: unknown, ids: readonly T[], validate?: (save: Save, id: T) => boolean): Partial<Record<T, Save>> {
  if (!object(value) || Object.keys(value).some(id => !ids.some(known => String(known) === id))) throw new Error('备份中的存档位置损坏');
  const result: Partial<Record<T, Save>> = {};
  for (const id of ids) {
    if (!Object.hasOwn(value, String(id))) continue;
    const save = decodeSave(JSON.stringify(value[String(id)]));
    if (validate && !validate(save, id)) throw new Error('备份中的章首或结局证明不一致');
    result[id] = save;
  }
  return result;
}
function knownList<T extends string>(value: unknown, ids: readonly T[]): T[] {
  if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || !ids.includes(id as T))) throw new Error('备份中的回忆记录损坏');
  return [...new Set(value)] as T[];
}
export function decodeProgressFile(raw: string): ProgressImport {
  if (raw.length > 2_000_000) throw new Error('存档文件过大');
  const value: unknown = JSON.parse(raw);
  if (!object(value) || !Object.hasOwn(value, 'format')) return { kind: 'single', save: decodeSave(raw) };
  if (value.format !== 'moist-healing-reading-backup' || value.schema !== 1 || value.game !== 'moist-healing' || value.storyVersion !== 'moist-healing-v1' || typeof value.exportedAt !== 'string' || !Number.isFinite(Date.parse(value.exportedAt))) throw new Error('文件不是《湿性愈合》的阅读备份');
  const saves = saveMap(value.slots, slots);
  const chapterProofs = saveMap(value.chapters, chapters.map(chapter => chapter.id), (save, id) => save.state.sceneId === chapters.find(chapter => chapter.id === id)!.start && save.state.line === 0);
  const endingProofs = saveMap(value.endings, endingIds, (save, id) => sceneMap.get(save.state.sceneId)?.ending === id && save.state.line === 0);
  const proofs = saveMap(value.proofs, proofIds, (save, id) => witnessed(save).has(id));
  if (!object(value.memories)) throw new Error('备份中的回忆记录损坏');
  const memories = { endings: knownList(value.memories.endings, endingIds), gallery: knownList(value.memories.gallery, Object.keys(cgInfo) as CgId[]), scores: knownList(value.memories.scores, Object.keys(scoreInfo) as MusicId[]) };
  if (memories.endings.some(id => !endingProofs[id])) throw new Error('备份缺少已读结局的路线证明');
  const evidence = new Set(['scores:rain']);
  for (const save of [...Object.values(saves), ...Object.values(chapterProofs), ...Object.values(endingProofs), ...Object.values(proofs)]) {
    if (save) for (const id of witnessed(save)) evidence.add(id);
  }
  if (memories.gallery.some(id => !evidence.has(`gallery:${id}`)) || memories.scores.some(id => !evidence.has(`scores:${id}`))) {
    throw new Error('回忆缺少实际路线证明，请读取相关存档后再导出完整备份；单份存档仍可导出');
  }
  return { kind: 'backup', slots: saves, chapters: chapterProofs, endings: endingProofs, proofs, memories };
}

type ProgressStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function applyProgressImport(imported: ProgressImport, storage: ProgressStorage = localStorage): void {
  const updates = new Map<string, string>();
  if (imported.kind === 'single') updates.set(`${KEY}:save:auto`, JSON.stringify(imported.save));
  else {
    for (const slot of slots) if (imported.slots[slot]) updates.set(`${KEY}:save:${slot}`, JSON.stringify(imported.slots[slot]));
    for (const chapter of chapters) if (imported.chapters[chapter.id]) updates.set(`${KEY}:chapter:${chapter.id}`, JSON.stringify(imported.chapters[chapter.id]));
    for (const ending of endingIds) if (imported.endings[ending]) updates.set(`${KEY}:ending:${ending}`, JSON.stringify(imported.endings[ending]));
    for (const id of proofIds) if (imported.proofs[id]) updates.set(`${KEY}:proof:${id}`, JSON.stringify(imported.proofs[id]));
    const merge = <T extends string>(key: string, ids: readonly T[], added: readonly T[]) => {
      let old: T[] = [];
      try { const value: unknown = JSON.parse(storage.getItem(`${KEY}:${key}`) ?? '[]'); if (Array.isArray(value)) old = value.filter((id): id is T => typeof id === 'string' && ids.includes(id as T)); } catch { /* Invalid local unlock list has no trusted entries. */ }
      updates.set(`${KEY}:${key}`, JSON.stringify([...new Set([...old, ...added])]));
    };
    merge('endings', endingIds, imported.memories.endings);
    merge('gallery', Object.keys(cgInfo) as CgId[], imported.memories.gallery);
    merge('scores', Object.keys(scoreInfo) as MusicId[], imported.memories.scores);
  }
  const before = new Map([...updates.keys()].map(key => [key, storage.getItem(key)]));
  const changed: string[] = [];
  try {
    for (const [key, raw] of updates) {
      if (before.get(key) === raw) continue;
      storage.setItem(key, raw);
      changed.push(key);
    }
  } catch {
    // Free newly written bytes before restoring originals, so a quota failure
    // does not leave an imported slot or partial unlock list behind.
    for (const key of changed) storage.removeItem(key);
    for (const key of changed) { const raw = before.get(key); if (raw !== null && raw !== undefined) storage.setItem(key, raw); }
    throw new Error('导入未完成，原有进度已保留。请腾出存储空间后重试。');
  }
}

function witnessed(save: Save): Set<string> {
  const ids = new Set([...save.state.history.map(entry => entry.sceneId), save.state.sceneId]);
  const proof = new Set<string>();
  for (const id of ids) { const scene = sceneMap.get(id)!; if (scene.cg) proof.add(`gallery:${scene.cg}`); proof.add(`scores:${musicFor(id)}`); }
  return proof;
}
