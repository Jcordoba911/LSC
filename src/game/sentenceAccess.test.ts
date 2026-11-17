import { describe, expect, it } from 'vitest';
import { ALL_THEMES } from './buildSentence';
import { canPlaySentences } from './sentenceAccess';
import type { PlayableSentence } from '../services/sentences';
import type { Word } from '../types';

const words: Word[] = [
  { id: 'perro', tema: 'animales', leccion: 1, espanol: 'perro', sign: 'assets/signs/perro.png' },
  { id: 'gato', tema: 'animales', leccion: 1, espanol: 'gato', sign: 'assets/signs/gato.png' },
  { id: 'pan', tema: 'alimentos', leccion: 1, espanol: 'pan', sign: 'assets/signs/pan.png' },
];

const playable: PlayableSentence[] = [
  {
    sentence: { id: 's1', tema: 'animales', leccion: 1, palabras: ['perro'], frase: 'El perro' },
    words: [{ ...words[0], signAnimated: 'assets/signs/animated/perro.mp4' }],
  },
  {
    sentence: { id: 's2', tema: 'alimentos', leccion: 1, palabras: ['pan'], frase: 'El pan' },
    words: [{ ...words[2], signAnimated: 'assets/signs/animated/pan.mp4' }],
  },
];

describe('canPlaySentences', () => {
  it('requires all vocabulary in the selected topic to be learned', () => {
    const learnedTopics: string[] = [];
    expect(
      canPlaySentences('animales', playable, words, (tema) => learnedTopics.includes(tema)),
    ).toBe(false);
    learnedTopics.push('animales');
    expect(
      canPlaySentences('animales', playable, words, (tema) => learnedTopics.includes(tema)),
    ).toBe(true);
  });

  it('requires every phrase topic before unlocking all phrases', () => {
    expect(canPlaySentences(ALL_THEMES, playable, words, (tema) => tema === 'animales')).toBe(false);
    expect(canPlaySentences(ALL_THEMES, playable, words, () => true)).toBe(true);
  });
});
