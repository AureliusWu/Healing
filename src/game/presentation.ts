import type { Character, Expression, Scene } from './types';

export const expressionIds: Expression[] = ['neutral', 'smile', 'surprised', 'worried', 'hurt', 'shy'];
export const expressionLabels: Record<Expression, string> = {
  neutral: '平静', smile: '微笑', surprised: '惊讶', worried: '担忧', hurt: '委屈', shy: '害羞',
};
export const characterIds: Character[] = ['lin', 'chen', 'tang'];
const speakers: Record<string, Character | undefined> = { 林见夏: 'lin', 陈知遥: 'chen', 许棠: 'tang' };

// Resolve from authored dialogue, so loading or revisiting a paragraph restores its
// expression without adding transient presentation state to the save schema.
export function presentationAt(scene: Scene, lineIndex: number): { character?: Character; expression: Expression } {
  let character = scene.character;
  const expressions: Partial<Record<Character, Expression>> = {};
  for (const line of scene.lines.slice(0, lineIndex + 1)) {
    const speaker = speakers[line.speaker];
    if (speaker) {
      character = speaker;
      if (line.expression) expressions[speaker] = line.expression;
    }
  }
  return { character, expression: character ? expressions[character] ?? 'neutral' : 'neutral' };
}
