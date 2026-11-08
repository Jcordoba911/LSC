import { describe, expect, it } from 'vitest';
import type { Word } from '../types';
import { answer, createGame, currentRound } from './signToWord';

const word = (tema: string, espanol: string): Word => ({
  id: `${tema}-${espanol}`,
  tema,
  leccion: 1,
  espanol,
  sign: `assets/signs/${espanol}.png`,
});

const words = [
  word('animales', 'perro'),
  word('animales', 'gato'),
  word('animales', 'pájaro'),
  word('saludos', 'hola'),
  word('saludos', 'gracias'),
];

describe('createGame', () => {
  it('crea una ronda por palabra del tema con la respuesta entre las opciones', () => {
    const game = createGame('animales', words);
    expect(game.rounds).toHaveLength(3);
    for (const round of game.rounds) {
      expect(round.word.tema).toBe('animales');
      expect(round.options).toContain(round.word.espanol);
      expect(round.options).toHaveLength(4);
      expect(new Set(round.options).size).toBe(round.options.length);
    }
  });

  it('prefiere distractores del mismo tema', () => {
    const game = createGame('animales', words, { optionsPerRound: 3 });
    for (const round of game.rounds) {
      expect(round.options.every((o) => ['perro', 'gato', 'pájaro'].includes(o))).toBe(true);
    }
  });
});

describe('answer', () => {
  it('suma puntos al acertar y quita vidas al fallar', () => {
    let game = createGame('animales', words, { lives: 2 });
    const first = currentRound(game)!;
    ({ state: game } = answer(game, first.word.espanol));
    expect(game.score).toBe(10);
    expect(game.lives).toBe(2);

    const second = currentRound(game)!;
    const wrong = second.options.find((o) => o !== second.word.espanol)!;
    ({ state: game } = answer(game, wrong));
    expect(game.lives).toBe(1);
    expect(game.finished).toBe(false);
  });

  it('termina al quedarse sin vidas', () => {
    let game = createGame('animales', words, { lives: 1 });
    const round = currentRound(game)!;
    ({ state: game } = answer(game, round.options.find((o) => o !== round.word.espanol)!));
    expect(game.finished).toBe(true);
    expect(currentRound(game)).toBeUndefined();
  });

  it('termina al completar todas las rondas', () => {
    let game = createGame('animales', words);
    while (!game.finished) ({ state: game } = answer(game, currentRound(game)!.word.espanol));
    expect(game.correct).toBe(3);
    expect(game.score).toBe(30);
  });
});
