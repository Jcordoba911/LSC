import type { PlayableSentence } from '../services/sentences';
import { shuffle } from './signToWord';

/** Palabra desordenada; `key` distingue palabras repetidas en la misma frase. */
export interface Token {
  key: number;
  text: string;
}

export interface SentenceRound extends PlayableSentence {
  /** Palabras de la frase desordenadas, para tocarlas en orden. */
  tokens: Token[];
  /** Frase correcta y distractores, para la variante "elegir el significado". */
  options: string[];
}

export interface SentenceGameState {
  tema: string;
  rounds: SentenceRound[];
  index: number;
  score: number;
  earned: number;
  lives: number;
  correct: number;
  /** Intentos fallidos en la ronda actual. */
  misses: number;
  pointsPerWord: number;
  finished: boolean;
}

export interface SentenceGameOptions {
  lives?: number;
  optionsPerRound?: number;
  pointsPerWord?: number;
  rng?: () => number;
}

export const ALL_THEMES = 'todas';
export const SENTENCE_DEFAULTS = { lives: 3, optionsPerRound: 3, pointsPerWord: 10 };

function shuffleTokens(texts: string[], rng: () => number): Token[] {
  const tokens = texts.map((text, key) => ({ key, text }));
  const allSame = texts.every((t) => t === texts[0]);
  let shuffled = shuffle(tokens, rng);
  for (let i = 0; i < 10 && !allSame && shuffled.every((t, j) => t.text === texts[j]); i++) {
    shuffled = shuffle(tokens, rng);
  }
  if (!allSame && shuffled.every((t, j) => t.text === texts[j])) shuffled.push(shuffled.shift()!);
  return shuffled;
}

/**
 * Modo "Construye la frase": cada ronda reproduce las señas animadas de una
 * frase y el jugador ordena las palabras (o elige el significado completo).
 * `tema` = ALL_THEMES usa todas las frases.
 */
export function createSentenceGame(
  tema: string,
  playable: readonly PlayableSentence[],
  {
    lives = SENTENCE_DEFAULTS.lives,
    optionsPerRound = SENTENCE_DEFAULTS.optionsPerRound,
    pointsPerWord = SENTENCE_DEFAULTS.pointsPerWord,
    rng = Math.random,
  }: SentenceGameOptions = {},
): SentenceGameState {
  const pool = tema === ALL_THEMES ? [...playable] : playable.filter((p) => p.sentence.tema === tema);
  const rounds = shuffle(pool, rng).map((item) => {
    const answer = item.sentence.frase;
    const sameTheme = shuffle(playable.filter((p) => p.sentence.tema === item.sentence.tema), rng);
    const others = shuffle(playable.filter((p) => p.sentence.tema !== item.sentence.tema), rng);
    const distractors = [...new Set([...sameTheme, ...others].map((p) => p.sentence.frase))]
      .filter((text) => text !== answer)
      .slice(0, optionsPerRound - 1);
    return {
      ...item,
      tokens: shuffleTokens(item.words.map((w) => w.espanol), rng),
      options: shuffle([answer, ...distractors], rng),
    };
  });
  return {
    tema,
    rounds,
    index: 0,
    score: 0,
    earned: 0,
    lives,
    correct: 0,
    misses: 0,
    pointsPerWord,
    finished: rounds.length === 0,
  };
}

export function currentSentence(state: SentenceGameState): SentenceRound | undefined {
  return state.finished ? undefined : state.rounds[state.index];
}

/** Para cada posición, si la palabra elegida coincide con la de la frase. */
export function checkOrder(round: SentenceRound, chosen: readonly string[]): boolean[] {
  return round.words.map((w, i) => chosen[i] === w.espanol);
}

export function isCorrectOrder(round: SentenceRound, chosen: readonly string[]): boolean {
  return chosen.length === round.words.length && checkOrder(round, chosen).every(Boolean);
}

function advance(state: SentenceGameState, patch: Partial<SentenceGameState>): SentenceGameState {
  const index = state.index + 1;
  return { ...state, ...patch, index, misses: 0, finished: index >= state.rounds.length };
}

/** Normaliza lo ganado frente al máximo de puntos posibles en todas las rondas. */
function maximumScore(state: SentenceGameState): number {
  return state.pointsPerWord * state.rounds.reduce((total, round) => total + round.words.length, 0);
}

/**
 * Registra un intento. Acierto: suma puntos (la mitad si hubo fallos) y pasa a
 * la siguiente frase. Error: quita una vida y se queda en la misma frase para
 * reintentar, salvo que se acaben las vidas.
 */
export function submitSentence(
  state: SentenceGameState,
  isCorrect: boolean,
): { state: SentenceGameState; isCorrect: boolean } {
  const round = currentSentence(state);
  if (!round) return { state, isCorrect: false };
  if (isCorrect) {
    const full = state.pointsPerWord * round.words.length;
    const points = state.misses > 0 ? Math.ceil(full / 2) : full;
    const earned = state.earned + points;
    const maxScore = maximumScore(state);
    const score = maxScore === 0 ? 0 : Math.round((earned / maxScore) * 100);
    return {
      isCorrect,
      state: advance(state, { earned, score, correct: state.correct + 1 }),
    };
  }
  const lives = state.lives - 1;
  return { isCorrect, state: { ...state, lives, misses: state.misses + 1, finished: lives <= 0 } };
}

/** Salta la frase actual sin puntos. */
export function skipSentence(state: SentenceGameState): SentenceGameState {
  return currentSentence(state) ? advance(state, {}) : state;
}
