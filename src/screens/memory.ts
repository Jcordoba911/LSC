import { createSignMedia } from '../components/signMedia';
import { createStyleSelector } from '../components/styleSelector';
import { h } from '../dom';
import { createMemoryGame, flip, unflip, type MemoryGameState } from '../game/memory';
import { navigate, type Screen } from '../router';
import { progress } from '../services/progress';
import { isSignStyle, loadThemes, loadWords, signFor, themeLabel } from '../services/words';
import type { Word } from '../types';
import { setLastResult } from './results';

const scoreKey = (tema: string) => `memoria:${tema}`;

export const memoryIndexScreen: Screen = async (root) => {
  const themes = await loadThemes();
  root.append(
    h(
      'section',
      { class: 'screen' },
      h('a', { class: 'back', href: '#/modos' }, '← Modos de Juego'),
      h('h2', {}, 'Memoria: encuentra los pares'),
      h('p', { class: 'muted' }, 'Encuentra cada par formado por una seña y su palabra.'),
      h(
        'ul',
        { class: 'theme-list' },
        ...themes.map((theme) => {
          const learned = progress.isLearned(theme.id, theme.words.map((word) => word.id));
          const bestScore = progress.get(scoreKey(theme.id)).bestScore;
          return h(
            'li',
            { class: 'theme-card' },
            h('h3', {}, themeLabel(theme.id)),
            h(
              'p',
              { class: 'muted' },
              learned ? '✔ Aprendido' : '🔒 Completa Aprende para desbloquear',
              bestScore > 0 ? ` · Mejor puntaje: ${bestScore}` : '',
            ),
            learned
              ? h(
                  'a',
                  { class: 'btn btn-primary', href: `#/memoria/${encodeURIComponent(theme.id)}` },
                  'Jugar',
                )
              : h('button', { class: 'btn', disabled: true }, '🔒 Jugar'),
          );
        }),
      ),
    ),
  );
};

export const memoryScreen: Screen = async (root, { tema, estilo }) => {
  const [words, themes] = await Promise.all([loadWords(), loadThemes()]);
  const theme = themes.find((item) => item.id === tema);
  if (!theme) return navigate('/memoria');
  if (!isSignStyle(estilo)) {
    root.append(createStyleSelector('memoria', tema, theme.words.filter((word) => word.signAnimated).length));
    return;
  }

  if (!progress.isLearned(tema, theme.words.map((word) => word.id))) {
    root.append(
      h(
        'section',
        { class: 'screen center' },
        h('h2', {}, '🔒 Tema bloqueado'),
        h('p', {}, `Completa "Aprende" del tema ${themeLabel(tema)} para poder jugar.`),
        h('a', { class: 'btn btn-primary', href: `#/aprende/${encodeURIComponent(tema)}` }, 'Ir a Aprende'),
      ),
    );
    return;
  }

  let state: MemoryGameState = createMemoryGame(tema, words);
  const wordById = new Map<string, Word>(theme.words.map((word) => [word.id, word]));
  if (state.cards.length === 0) {
    root.append(
      h(
        'section',
        { class: 'screen center' },
        h('p', {}, 'Este tema no tiene palabras para jugar.'),
        h('a', { class: 'btn', href: '#/memoria' }, 'Volver a los temas'),
      ),
    );
    return;
  }

  const hud = h('div', { class: 'hud' });
  const grid = h('div', { class: 'memory-grid', 'aria-label': 'Tablero de memoria' });
  const cardButtons = state.cards.map((card, index) => {
    const word = wordById.get(card.wordId)!;
    const front = card.kind === 'sign'
      ? createSignMedia(signFor(word, estilo), `Seña de ${word.espanol}`)
      : h('span', { class: 'memory-word' }, word.espanol);
    const button = h(
      'button',
      {
        class: 'memory-card',
        type: 'button',
        'aria-label': 'Carta boca abajo',
        onclick: () => reveal(index),
      },
      h('span', { class: 'card-inner' }, h('span', { class: 'card-front', 'aria-hidden': 'true' }, front), h('span', { class: 'card-back', 'aria-hidden': 'true' }, '🤟')),
    );
    grid.append(button);
    return button;
  });
  const screen = h(
    'section',
    { class: 'screen memory-game' },
    h('a', { class: 'back', href: '#/memoria' }, '← Salir'),
    h('h2', {}, `${themeLabel(tema)} · Memoria`),
    hud,
    grid,
  );
  root.append(screen);

  let busy = false;

  function render() {
    hud.replaceChildren(
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
        isFlipped ? `${card.kind === 'sign' ? 'Seña' : 'Palabra'}: ${word.espanol}` : 'Carta boca abajo',
      );
    });
  }

  function finish() {
    const isRecord = progress.saveScore(scoreKey(tema), state.score);
    setLastResult({
      result: {
        tema,
        score: state.score,
        correct: state.matched.length,
        total: state.cards.length / 2,
        livesLeft: 1,
      },
      isRecord,
      label: `Memoria · ${themeLabel(tema)}`,
      playAgainHref: `#/memoria/${encodeURIComponent(tema)}/${estilo}`,
      review: { href: '#/memoria', label: 'Otros temas' },
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
