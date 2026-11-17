import { createSignMedia } from '../components/signMedia';
import { createStyleSelector } from '../components/styleSelector';
import { createPlayThemeList } from '../components/themeList';
import { h } from '../dom';
import { answer, createGame, currentRound, type GameState } from '../game/signToWord';
import { navigate, type Screen } from '../router';
import { progress } from '../services/progress';
import { isSignStyle, loadThemes, loadWords, signFor, themeLabel } from '../services/words';
import { setLastResult } from './results';

const FEEDBACK_MS = 900;

export const gameIndexScreen: Screen = async (root) => {
  const themes = await loadThemes();
  root.append(
    h(
      'section',
      { class: 'screen' },
      h('a', { class: 'back', href: '#/' }, '← Menú'),
      h('span', { class: 'eyebrow' }, 'Seña a palabra'),
      h('h2', {}, 'Elige un tema'),
      h('p', { class: 'muted' }, 'Elige un tema y estilo, mira la seña y selecciona la palabra correcta.'),
      createPlayThemeList(themes),
    ),
  );
};

export const gameScreen: Screen = async (root, { tema, estilo }) => {
  const words = await loadWords();
  const themeWords = words.filter((w) => w.tema === tema);
  if (themeWords.length === 0) return navigate('/jugar');
  if (!isSignStyle(estilo)) {
    root.append(createStyleSelector('jugar', tema, themeWords.filter((word) => word.signAnimated).length));
    return;
  }
  const selectedStyle = estilo;
  const themeWordIds = themeWords.map((w) => w.id);
  if (!progress.isLearned(tema, themeWordIds)) {
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

  let state: GameState = createGame(tema, words);
  if (state.rounds.length === 0) return navigate('/jugar');

  const hud = h('div', { class: 'hud' });
  const signSlot = h('div', { class: 'sign-frame' });
  const options = h('div', { class: 'options' });
  const screen = h(
    'section',
    { class: 'screen game' },
    h('a', { class: 'back', href: '#/jugar' }, '← Salir'),
    h('h2', {}, themeLabel(tema)),
    hud,
    signSlot,
    options,
  );
  root.append(screen);

  function renderHud() {
    hud.replaceChildren(
      h('span', {}, `Puntaje: ${state.score}`),
      h('span', { 'aria-label': `${state.lives} vidas` }, '❤'.repeat(Math.max(state.lives, 0)) || '—'),
      h('span', {}, `Ronda ${Math.min(state.index + 1, state.rounds.length)}/${state.rounds.length}`),
    );
  }

  function finish() {
    const isRecord = progress.saveScore(tema, state.score);
    setLastResult({
      result: {
        tema,
        score: state.score,
        correct: state.correct,
        total: state.rounds.length,
        livesLeft: state.lives,
      },
      isRecord,
      playAgainHref: `#/jugar/${encodeURIComponent(tema)}/${selectedStyle}`,
    });
    navigate('/resultados');
  }

  function renderRound() {
    renderHud();
    const round = currentRound(state);
    if (!round) return finish();
    signSlot.replaceChildren(createSignMedia(signFor(round.word, selectedStyle), '¿Qué palabra es esta seña?'));
    options.replaceChildren(
      ...round.options.map((option) =>
        h('button', { class: 'btn option', onclick: (e) => choose(option, e.currentTarget as HTMLButtonElement) }, option),
      ),
    );
  }

  function choose(option: string, button: HTMLButtonElement) {
    const correctText = currentRound(state)!.word.espanol;
    const result = answer(state, option);
    state = result.state;
    for (const btn of options.querySelectorAll('button')) {
      btn.disabled = true;
      if (btn.textContent === correctText) btn.classList.add('correct');
    }
    if (!result.isCorrect) button.classList.add('wrong');
    renderHud();
    setTimeout(() => {
      if (screen.isConnected) renderRound();
    }, FEEDBACK_MS);
  }

  renderRound();
};
