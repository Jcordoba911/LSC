import { describe, expect, it } from 'vitest';
import { playableSentences } from '../services/sentences';
import type { Sentence, Word } from '../types';
import {
  ALL_THEMES,
  checkOrder,
  createSentenceGame,
  currentSentence,
  isCorrectOrder,
  skipSentence,
  submitSentence,
} from './buildSentence';

const word = (id: string, animated = true): Word => ({
  id,
  tema: 'x',
  leccion: 1,
  espanol: id,
  sign: `assets/signs/${id}.png`,
  signAnimated: animated ? `assets/signs/animated/${id}.mp4` : undefined,
});

const words = ['perro', 'gato', 'negro', 'gris', 'sopa', 'caliente', 'oso'].map((id) => word(id, id !== 'oso'));
words.push({ ...word('pez'), signAnimated: null });

const sentence = (id: string, tema: string, palabras: string[]): Sentence => ({
  id,
  tema,
  leccion: 1,
  palabras,
  frase: palabras.join(' '),
});

const sentences = [
  sentence('s1', 'animales', ['perro', 'negro']),
  sentence('s2', 'animales', ['gato', 'gris']),
  sentence('s3', 'alimentos', ['sopa', 'caliente']),
  sentence('s4', 'animales', ['oso', 'negro']),
  sentence('s5', 'animales', ['pez', 'gris']),
  sentence('s6', 'animales', ['perro', 'inexistente']),
];

const playable = playableSentences(sentences, words);

describe('playableSentences', () => {
  it('excluye frases con palabras sin signAnimated o inexistentes', () => {
    expect(playable.map((p) => p.sentence.id)).toEqual(['s1', 's2', 's3']);
    expect(playable[0].words.map((w) => w.id)).toEqual(['perro', 'negro']);
  });
});

describe('createSentenceGame', () => {
  it('filtra por tema o usa todas', () => {
    expect(createSentenceGame('animales', playable).rounds).toHaveLength(2);
    expect(createSentenceGame(ALL_THEMES, playable).rounds).toHaveLength(3);
    expect(createSentenceGame('colores', playable).finished).toBe(true);
  });

  it('desordena las palabras sin dejarlas en el orden correcto', () => {
    for (let seed = 0; seed < 20; seed++) {
      const game = createSentenceGame(ALL_THEMES, playable, { rng: () => (seed % 10) / 10 });
      for (const round of game.rounds) {
        const texts = round.tokens.map((t) => t.text);
        expect([...texts].sort()).toEqual(round.words.map((w) => w.espanol).sort());
        expect(isCorrectOrder(round, texts)).toBe(false);
      }
    }
  });

  it('incluye la frase correcta entre opciones únicas', () => {
    const game = createSentenceGame(ALL_THEMES, playable);
    for (const round of game.rounds) {
      expect(round.options).toContain(round.sentence.frase);
      expect(round.options).toHaveLength(3);
      expect(new Set(round.options).size).toBe(3);
    }
  });
});

describe('checkOrder', () => {
  it('marca cada posición', () => {
    const round = createSentenceGame('alimentos', playable).rounds[0];
    expect(checkOrder(round, ['sopa', 'caliente'])).toEqual([true, true]);
    expect(checkOrder(round, ['caliente', 'sopa'])).toEqual([false, false]);
    expect(isCorrectOrder(round, ['sopa'])).toBe(false);
  });
});

describe('submitSentence', () => {
  it('normaliza puntos ganados contra el máximo de todas las palabras', () => {
    let game = createSentenceGame(ALL_THEMES, playable);
    ({ state: game } = submitSentence(game, true));
    expect(game).toMatchObject({ earned: 20, score: 33, correct: 1, index: 1, lives: 3 });
  });

  it('al fallar quita una vida y permite reintentar con la mitad de puntos', () => {
    let game = createSentenceGame(ALL_THEMES, playable);
    const first = currentSentence(game);
    ({ state: game } = submitSentence(game, false));
    expect(game).toMatchObject({ lives: 2, index: 0, misses: 1, finished: false });
    expect(currentSentence(game)).toBe(first);
    ({ state: game } = submitSentence(game, true));
    expect(game).toMatchObject({ earned: 10, score: 17, index: 1, misses: 0 });
  });

  it('termina al quedarse sin vidas o al completar las frases', () => {
    let game = createSentenceGame(ALL_THEMES, playable, { lives: 1 });
    ({ state: game } = submitSentence(game, false));
    expect(game.finished).toBe(true);
    expect(currentSentence(game)).toBeUndefined();

    game = createSentenceGame(ALL_THEMES, playable);
    game = skipSentence(game);
    while (!game.finished) ({ state: game } = submitSentence(game, true));
    expect(game).toMatchObject({ correct: 2, earned: 40, score: 67 });
  });

  it('awards 100 for a perfect run', () => {
    let game = createSentenceGame(ALL_THEMES, playable);
    while (!game.finished) ({ state: game } = submitSentence(game, true));
    expect(game).toMatchObject({ correct: 3, score: 100 });
  });
});
