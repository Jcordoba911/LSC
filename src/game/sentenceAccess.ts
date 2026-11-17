import { ALL_THEMES } from './buildSentence';
import type { PlayableSentence } from '../services/sentences';
import type { Word } from '../types';

export function canPlaySentences(
  tema: string,
  playable: readonly PlayableSentence[],
  words: readonly Word[],
  isLearned: (tema: string, wordIds: readonly string[]) => boolean,
): boolean {
  const themes =
    tema === ALL_THEMES
      ? [...new Set(playable.map((item) => item.sentence.tema))]
      : [tema];

  return (
    themes.length > 0 &&
    themes.every((theme) => {
      const wordIds = words.filter((word) => word.tema === theme).map((word) => word.id);
      return wordIds.length > 0 && isLearned(theme, wordIds);
    })
  );
}
