import { createSignMedia } from '../components/signMedia';
import { h } from '../dom';
import {
  createMemoryGame,
  DIFFICULTIES,
  flip,
  unflip,
  type MemoryDifficulty,
  type MemoryGameState,
} from '../game/memory';
import { navigate, type Screen } from '../router';
import { progress } from '../services/progress';
import { loadThemes, loadWords } from '../services/words';
import type { Theme, Word } from '../types';
import { setLastResult } from './results';

const difficultyLabels: Record<MemoryDifficulty, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};

const difficulties = Object.keys(DIFFICULTIES) as MemoryDifficulty[];

function isMemoryDifficulty(value: string | undefined): value is MemoryDifficulty {
  return value !== undefined && Object.prototype.hasOwnProperty.call(DIFFICULTIES, value);
}

function pendingThemes(themes: readonly Theme[]): Theme[] {
  return themes.filter(
    (theme) => !progress.isLearned(theme.id, theme.words.map((word) => word.id)),
  );
}

function appendLockedScreen(root: HTMLElement, pendingCount: number): void {
  const message =
    pendingCount === 1
      ? 'Te falta 1 tema por aprender para desbloquear Memoria.'
      : `Te faltan ${pendingCount} temas por aprender para desbloquear Memoria.`;
  root.append(
    h(
      'section',
      { class: 'screen center memory-locked' },
      h('a', { class: 'back', href: '#/modos' }, '← Modos de Juego'),
      h('h2', {}, '🔒 Memoria bloqueada'),
      h('p', {}, message),
      h('a', { class: 'btn btn-primary', href: '#/aprende' }, 'Ir a Aprendizaje'),
    ),
  );
}

export const memoryIndexScreen: Screen = async (root) => {
  const [themes] = await Promise.all([loadThemes(), loadWords()]);
  const pending = pendingThemes(themes);
  if (pending.length > 0) {
    appendLockedScreen(root, pending.length);
    return;
  }

  root.append(
    h(
      'section',
      { class: 'screen memory-index' },
      h('a', { class: 'back', href: '#/modos' }, '← Modos de Juego'),
      h('h2', {}, 'Memoria: encuentra los pares'),
      h(
        'p',
        { class: 'muted' },
        'Relaciona cada seña con su palabra. El tablero mezcla vocabulario de todos los temas.',
      ),
      h(
        'div',
        { class: 'memory-difficulties' },
        ...difficulties.map((difficulty) => {
          const pairCount = DIFFICULTIES[difficulty];
          const bestScore = progress.get(`memoria:${difficulty}`).bestScore;
          return h(
            'article',
            { class: 'memory-difficulty' },
            h('h3', {}, difficultyLabels[difficulty]),
            h('p', { class: 'muted' }, `${pairCount} pares`),
            bestScore > 0
              ? h('p', { class: 'record' }, `Mejor puntaje: ${bestScore}`)
              : null,
            h(
              'a',
              {
                class: 'btn btn-primary',
                href: `#/memoria/${difficulty}`,
              },
              'Jugar',
            ),
          );
        }),
      ),
    ),
  );
};

export const memoryScreen: Screen = async (root, { dificultad }) => {
  if (!isMemoryDifficulty(dificultad)) return navigate('/memoria');

  const [words, themes] = await Promise.all([loadWords(), loadThemes()]);
  const pending = pendingThemes(themes);
  if (pending.length > 0) {
    appendLockedScreen(root, pending.length);
    return;
  }

  if (words.length === 0) {
    root.append(
      h(
        'section',
        { class: 'screen center' },
        h('p', {}, 'No hay palabras disponibles para jugar.'),
        h('a', { class: 'btn', href: '#/memoria' }, 'Volver a dificultades'),
      ),
    );
    return;
  }

  const pairCount = Math.min(DIFFICULTIES[dificultad], words.length);
  let state: MemoryGameState = createMemoryGame(words, { pairs: pairCount });
  const wordById = new Map<string, Word>(words.map((word) => [word.id, word]));
  const difficultyLabel = difficultyLabels[dificultad];
  const hud = h('div', { class: 'hud' });
  const grid = h('div', {
    class: `memory-grid${state.cards.length > 40 ? ' large' : ''}`,
    'aria-label': 'Tablero de memoria',
  });
  const cardButtons = state.cards.map((card, index) => {
    const word = wordById.get(card.wordId)!;
    const front =
      card.kind === 'sign'
        ? createSignMedia(
            card.media === 'video' && word.signAnimated ? word.signAnimated : word.sign,
            `Seña de ${word.espanol}`,
          )
        : h('span', { class: 'memory-word' }, word.espanol);
    const button = h(
      'button',
      {
        class: 'memory-card',
        type: 'button',
        'aria-label': 'Carta boca abajo',
        onclick: () => reveal(index),
      },
      h(
        'span',
        { class: 'card-inner' },
        h('span', { class: 'card-front', 'aria-hidden': 'true' }, front),
        h('span', { class: 'card-back', 'aria-hidden': 'true' }, '🤟'),
      ),
    );
    grid.append(button);
    return button;
  });
  const screen = h(
    'section',
    { class: 'screen memory-game' },
    h('a', { class: 'back', href: '#/memoria' }, '← Dificultades'),
    h('h2', {}, `${difficultyLabel} · Memoria`),
    hud,
    grid,
  );
  root.append(screen);

  let busy = false;

  function render() {
    hud.replaceChildren(
      h('span', {}, `Dificultad: ${difficultyLabel}`),
      h('span', {}, `Movimientos: ${state.moves}`),
      h('span', {}, `Pares: ${state.matched.length}/${state.cards.length / 2}`),
      h('span', {}, `Puntaje: ${state.score}`),
    );
    cardButtons.forEach((button, index) => {
      const card = state.cards[index];
      const word = wordById.get(card.wordId)!;
      const isMatched = state.matched.includes(card.wordId);
      const isFlipped = isMatched || state.flipped.includes(index);
      button.classList.toggle('flipped', isFlipped);
      button.classList.toggle('matched', isMatched);
      button.disabled = isMatched || busy || state.flipped.includes(index);
      button.setAttribute(
        'aria-label',
        isFlipped
          ? `${card.kind === 'sign' ? 'Seña' : 'Palabra'}: ${word.espanol}`
          : 'Carta boca abajo',
      );
    });
  }

  function finish() {
    const isRecord = progress.saveScore(`memoria:${dificultad}`, state.score);
    setLastResult({
      result: {
        tema: 'Memoria',
        score: state.score,
        correct: state.matched.length,
        total: state.cards.length / 2,
        livesLeft: 1,
      },
      isRecord,
      label: `Memoria · ${difficultyLabel}`,
      playAgainHref: '#/memoria',
      review: { href: '#/memoria', label: 'Elegir dificultad' },
    });
    navigate('/resultados');
  }

  function reveal(index: number) {
    const result = flip(state, index);
    if (result.state === state) return;
    state = result.state;
    busy = result.matched === false;
    render();
    if (busy) {
      setTimeout(() => {
        if (!screen.isConnected) return;
        state = unflip(state);
        busy = false;
        render();
      }, 1000);
    } else if (state.finished) {
      finish();
    }
  }

  render();
};
