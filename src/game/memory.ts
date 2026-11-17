import type { Word } from '../types';
import { shuffle } from './signToWord';

export type MemoryCard =
  | {
      wordId: string;
      kind: 'sign';
      media: 'image' | 'video';
    }
  | {
      wordId: string;
      kind: 'text';
    };

export interface MemoryGameState {
  cards: MemoryCard[];
  flipped: number[];
  matched: string[];
  moves: number;
  score: number;
  finished: boolean;
}

export interface MemoryGameOptions {
  pairs?: number;
  rng?: () => number;
}

export interface FlipResult {
  state: MemoryGameState;
  matched: boolean | null;
}

export const DIFFICULTIES = {
  facil: 10,
  medio: 20,
  dificil: 30,
} as const;

export type MemoryDifficulty = keyof typeof DIFFICULTIES;

const POINTS_PER_PAIR = 20;
const EXTRA_MOVE_PENALTY = 2;

/** Puntaje: 20 puntos por par, menos 2 por cada movimiento sobre los pares encontrados. */
function scoreFor(matched: number, moves: number): number {
  return Math.max(0, matched * POINTS_PER_PAIR - Math.max(0, moves - matched) * EXTRA_MOVE_PENALTY);
}

export function createMemoryGame(
  allWords: readonly Word[],
  { pairs = 6, rng = Math.random }: MemoryGameOptions = {},
): MemoryGameState {
  const pairCount = Math.max(0, Math.floor(pairs));
  const selected = shuffle(allWords, rng).slice(0, pairCount);
  const cards = shuffle(
    selected.flatMap(({ id, signAnimated }) => {
      const media: 'image' | 'video' = signAnimated && rng() < 0.5 ? 'video' : 'image';
      return [
        { wordId: id, kind: 'sign' as const, media },
        { wordId: id, kind: 'text' as const },
      ];
    }),
    rng,
  );
  return {
    cards,
    flipped: [],
    matched: [],
    moves: 0,
    score: 0,
    finished: cards.length === 0,
  };
}

export function flip(state: MemoryGameState, cardIndex: number): FlipResult {
  if (
    state.finished ||
    !Number.isInteger(cardIndex) ||
    cardIndex < 0 ||
    cardIndex >= state.cards.length ||
    state.flipped.length >= 2 ||
    state.flipped.includes(cardIndex)
  ) {
    return { state, matched: null };
  }
  const card = state.cards[cardIndex];
  if (state.matched.includes(card.wordId)) return { state, matched: null };

  if (state.flipped.length === 0) {
    return { state: { ...state, flipped: [cardIndex] }, matched: null };
  }

  const other = state.cards[state.flipped[0]];
  const moves = state.moves + 1;
  const isMatch = other.wordId === card.wordId && other.kind !== card.kind;
  if (!isMatch) {
    return {
      state: {
        ...state,
        flipped: [...state.flipped, cardIndex],
        moves,
        score: scoreFor(state.matched.length, moves),
      },
      matched: false,
    };
  }

  const matched = [...state.matched, card.wordId];
  return {
    state: {
      ...state,
      flipped: [],
      matched,
      moves,
      score: scoreFor(matched.length, moves),
      finished: matched.length === state.cards.length / 2,
    },
    matched: true,
  };
}

export function unflip(state: MemoryGameState): MemoryGameState {
  return state.flipped.length === 2 ? { ...state, flipped: [] } : state;
}
