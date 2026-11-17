import { describe, expect, it } from 'vitest';
import type { Word } from '../types';
import { createMemoryGame, flip, unflip } from './memory';

const words: Word[] = Array.from({ length: 8 }, (_, index) => ({
  id: `word-${index}`,
  tema: index < 7 ? 'animales' : 'alimentos',
  leccion: 1,
  espanol: `palabra ${index}`,
  sign: `assets/signs/word-${index}.png`,
}));

describe('createMemoryGame', () => {
  it('creates sign/text pairs, capped by words in the selected theme', () => {
    const game = createMemoryGame('animales', words, { pairs: 8, rng: () => 0.5 });
    expect(game.cards).toHaveLength(14);
    for (const wordId of new Set(game.cards.map((card) => card.wordId))) {
      expect(game.cards.filter((card) => card.wordId === wordId).map((card) => card.kind).sort()).toEqual([
        'sign',
        'text',
      ]);
    }
  });

  it('uses the supplied random generator for repeatable shuffling', () => {
    const first = createMemoryGame('animales', words, { pairs: 4, rng: () => 0.25 });
    const second = createMemoryGame('animales', words, { pairs: 4, rng: () => 0.25 });
    expect(first.cards).toEqual(second.cards);
  });

  it('uses all available words even when fewer than the default pair count', () => {
    expect(createMemoryGame('alimentos', words).cards).toHaveLength(2);
  });
});

describe('flip', () => {
  it('matches by wordId across distinct card kinds and counts one move per pair', () => {
    const game = createMemoryGame('animales', words, { pairs: 2, rng: () => 0.5 });
    const signIndex = game.cards.findIndex((card) => card.wordId === game.cards[0].wordId && card.kind === 'sign');
    const textIndex = game.cards.findIndex((card) => card.wordId === game.cards[0].wordId && card.kind === 'text');
    const first = flip(game, signIndex);
    expect(first.matched).toBeNull();
    const second = flip(first.state, textIndex);
    expect(second.matched).toBe(true);
    expect(second.state).toMatchObject({ moves: 1, matched: [game.cards[0].wordId], score: 20 });
    expect(second.state.finished).toBe(false);
    expect(flip(second.state, signIndex).state).toBe(second.state);
  });

  it('keeps mismatches exposed until unflip and rejects repeated or matched cards', () => {
    const game = createMemoryGame('animales', words, { pairs: 2, rng: () => 0.5 });
    const firstIndex = 0;
    const otherWordIndex = game.cards.findIndex((card) => card.wordId !== game.cards[firstIndex].wordId);
    const first = flip(game, firstIndex);
    const second = flip(first.state, otherWordIndex);
    expect(second.matched).toBe(false);
    expect(second.state.moves).toBe(1);
    expect(second.state.score).toBe(0);
    expect(flip(second.state, firstIndex).state).toBe(second.state);
    const reset = unflip(second.state);
    expect(reset.flipped).toEqual([]);
    expect(unflip(first.state)).toBe(first.state);
  });

  it('finishes after all pairs are found and blocks further flips', () => {
    let game = createMemoryGame('animales', words, { pairs: 1, rng: () => 0.5 });
    const wordId = game.cards[0].wordId;
    for (const kind of ['sign', 'text'] as const) {
      const index = game.cards.findIndex((card) => card.kind === kind);
      game = flip(game, index).state;
    }
    expect(game).toMatchObject({ finished: true, matched: [wordId], moves: 1, score: 20 });
    expect(flip(game, 0).state).toBe(game);
  });
});
