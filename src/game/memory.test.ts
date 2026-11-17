import { describe, expect, it } from 'vitest';
import type { Word } from '../types';
import {
  createMemoryGame,
  DIFFICULTIES,
  flip,
  unflip,
} from './memory';

const words: Word[] = Array.from({ length: 48 }, (_, index) => ({
  id: `word-${index}`,
  tema: `tema-${index % 3}`,
  leccion: 1,
  espanol: `palabra ${index}`,
  sign: `assets/signs/word-${index}.png`,
  ...(index % 3 === 0 ? { signAnimated: `assets/signs/animated/word-${index}.mp4` } : {}),
}));

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe('createMemoryGame', () => {
  it('uses the whole vocabulary pool and creates the configured number of pairs', () => {
    for (const pairCount of Object.values(DIFFICULTIES)) {
      const game = createMemoryGame(words, { pairs: pairCount, rng: seededRandom(42) });
      expect(game.cards).toHaveLength(pairCount * 2);
      expect(new Set(game.cards.map((card) => card.wordId)).size).toBe(pairCount);
      expect(
        new Set(game.cards.map((card) => words.find((word) => word.id === card.wordId)?.tema)).size,
      ).toBeGreaterThan(1);
    }
  });

  it('caps the number of pairs at the available vocabulary size', () => {
    expect(createMemoryGame(words.slice(0, 3), { pairs: 40, rng: seededRandom(7) }).cards).toHaveLength(6);
  });

  it('creates exactly one sign card and one text card per word', () => {
    const game = createMemoryGame(words, { pairs: 40, rng: seededRandom(123) });
    const wordIds = new Set(game.cards.map((card) => card.wordId));

    for (const wordId of wordIds) {
      const pair = game.cards.filter((card) => card.wordId === wordId);
      expect(pair.map((card) => card.kind).sort()).toEqual(['sign', 'text']);
      expect(pair.filter((card) => card.kind === 'sign')).toHaveLength(1);
      expect(pair.filter((card) => card.kind === 'text')).toHaveLength(1);
      expect(pair.find((card) => card.kind === 'text')).not.toHaveProperty('media');
    }
  });

  it('selects image or video once per sign card and only uses video when available', () => {
    const game = createMemoryGame(words, { pairs: 40, rng: seededRandom(123) });
    const signs = game.cards.filter((card) => card.kind === 'sign');

    expect(signs.some((card) => card.media === 'image')).toBe(true);
    expect(signs.some((card) => card.media === 'video')).toBe(true);
    expect(
      signs.some((card) => !words.find((word) => word.id === card.wordId)?.signAnimated),
    ).toBe(true);
    for (const card of signs) {
      const word = words.find((item) => item.id === card.wordId)!;
      if (card.media === 'video') expect(word.signAnimated).toBeTruthy();
      if (!word.signAnimated) expect(card.media).toBe('image');
    }
  });

  it('uses the supplied seeded random generator for repeatable selection, media, and shuffle', () => {
    const first = createMemoryGame(words, { pairs: 25, rng: seededRandom(2026) });
    const second = createMemoryGame(words, { pairs: 25, rng: seededRandom(2026) });
    expect(first.cards).toEqual(second.cards);
  });
});

describe('flip', () => {
  it('matches by wordId across distinct card kinds and counts one move per pair', () => {
    const game = createMemoryGame(words, { pairs: 2, rng: seededRandom(11) });
    const firstCard = game.cards[0];
    const signIndex = game.cards.findIndex(
      (card) => card.wordId === firstCard.wordId && card.kind === 'sign',
    );
    const textIndex = game.cards.findIndex(
      (card) => card.wordId === firstCard.wordId && card.kind === 'text',
    );
    const first = flip(game, signIndex);
    expect(first.matched).toBeNull();
    const second = flip(first.state, textIndex);
    expect(second.matched).toBe(true);
    expect(second.state).toMatchObject({ moves: 1, matched: [firstCard.wordId], score: 20 });
    expect(second.state.finished).toBe(false);
    expect(flip(second.state, signIndex).state).toBe(second.state);
  });

  it('keeps mismatches exposed until unflip and rejects repeated or matched cards', () => {
    const game = createMemoryGame(words, { pairs: 2, rng: seededRandom(12) });
    const firstIndex = 0;
    const otherWordIndex = game.cards.findIndex(
      (card) => card.wordId !== game.cards[firstIndex].wordId,
    );
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
    let game = createMemoryGame(words, { pairs: 1, rng: seededRandom(13) });
    const wordId = game.cards[0].wordId;
    for (const kind of ['sign', 'text'] as const) {
      const index = game.cards.findIndex((card) => card.kind === kind);
      game = flip(game, index).state;
    }
    expect(game).toMatchObject({ finished: true, matched: [wordId], moves: 1, score: 20 });
    expect(flip(game, 0).state).toBe(game);
  });
});
