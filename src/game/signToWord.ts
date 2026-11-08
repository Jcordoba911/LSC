import type { Word } from '../types';

export interface Round {
  word: Word;
  options: string[];
}

export interface GameState {
  tema: string;
  rounds: Round[];
  index: number;
  score: number;
  lives: number;
  correct: number;
  finished: boolean;
}

export interface GameOptions {
  lives?: number;
  optionsPerRound?: number;
  pointsPerHit?: number;
  rng?: () => number;
}

export const DEFAULTS = { lives: 3, optionsPerRound: 4, pointsPerHit: 10 };

export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Modo "seña a palabra": cada ronda muestra la seña de una palabra del tema y
 * opciones de respuesta. Los distractores salen primero del mismo tema y, si
 * no alcanzan, del resto del vocabulario.
 */
export function createGame(
  tema: string,
  allWords: readonly Word[],
  { lives = DEFAULTS.lives, optionsPerRound = DEFAULTS.optionsPerRound, rng = Math.random }: GameOptions = {},
): GameState {
  const themeWords = allWords.filter((w) => w.tema === tema);
  const others = allWords.filter((w) => w.tema !== tema);

  const rounds = shuffle(themeWords, rng).map((word) => {
    const sameTheme = shuffle(themeWords.filter((w) => w.espanol !== word.espanol), rng);
    const otherThemes = shuffle(others, rng);
    const distractors = [...new Set([...sameTheme, ...otherThemes].map((w) => w.espanol))]
      .filter((text) => text !== word.espanol)
      .slice(0, optionsPerRound - 1);
    return { word, options: shuffle([word.espanol, ...distractors], rng) };
  });

  return { tema, rounds, index: 0, score: 0, lives, correct: 0, finished: rounds.length === 0 };
}

export function currentRound(state: GameState): Round | undefined {
  return state.finished ? undefined : state.rounds[state.index];
}

export function answer(
  state: GameState,
  option: string,
  pointsPerHit = DEFAULTS.pointsPerHit,
): { state: GameState; isCorrect: boolean } {
  const round = currentRound(state);
  if (!round) return { state, isCorrect: false };

  const isCorrect = option === round.word.espanol;
  const lives = isCorrect ? state.lives : state.lives - 1;
  const index = state.index + 1;
  return {
    isCorrect,
    state: {
      ...state,
      index,
      lives,
      score: state.score + (isCorrect ? pointsPerHit : 0),
      correct: state.correct + (isCorrect ? 1 : 0),
      finished: lives <= 0 || index >= state.rounds.length,
    },
  };
}
