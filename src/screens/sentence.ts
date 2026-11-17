import { createSignSequence } from '../components/signSequence';
import { h } from '../dom';
import {
  ALL_THEMES,
  checkOrder,
  createSentenceGame,
  currentSentence,
  isCorrectOrder,
  skipSentence,
  submitSentence,
  type SentenceGameState,
  type Token,
} from '../game/buildSentence';
import { canPlaySentences } from '../game/sentenceAccess';
import { navigate, type Screen } from '../router';
import { progress } from '../services/progress';
import { loadSentences, playableSentences, type PlayableSentence } from '../services/sentences';
import { loadWords, themeLabel } from '../services/words';
import { setLastResult } from './results';

const FEEDBACK_MS = 1600;

type Variant = 'ordenar' | 'significado';
const VARIANTS: Record<Variant, string> = { ordenar: 'Ordenar palabras', significado: 'Elegir el significado' };

const scoreKey = (variant: Variant, tema: string) => `frases:${variant}:${tema}`;
const temaLabel = (tema: string) => (tema === ALL_THEMES ? 'Todas las frases' : themeLabel(tema));
const playHref = (tema: string, variant: Variant) =>
  `#/frases/${encodeURIComponent(tema)}${variant === 'significado' ? '/significado' : ''}`;

async function loadPlayable(): Promise<PlayableSentence[]> {
  const [sentences, words] = await Promise.all([loadSentences(), loadWords()]);
  return playableSentences(sentences, words);
}

export const sentenceIndexScreen: Screen = async (root) => {
  const [playable, words] = await Promise.all([loadPlayable(), loadWords()]);
  const temas = [...new Set(playable.map((p) => p.sentence.tema))];
  const groups = [ALL_THEMES, ...temas].map((tema) => ({
    tema,
    count: tema === ALL_THEMES ? playable.length : playable.filter((p) => p.sentence.tema === tema).length,
    unlocked: canPlaySentences(tema, playable, words, (theme, wordIds) =>
      progress.isLearned(theme, wordIds),
    ),
  }));

  root.append(
    h(
      'section',
      { class: 'screen' },
      h('a', { class: 'back', href: '#/modos' }, '← Modos de Juego'),
      h('h2', {}, 'Construye la frase'),
      h(
        'p',
        { class: 'muted' },
        'Mira la secuencia de señas y ordena las palabras para formar la frase, o elige su significado.',
      ),
      playable.length === 0
        ? h('p', {}, 'Todavía no hay frases con señas animadas.')
        : h(
            'ul',
            { class: 'theme-list' },
            ...groups.map(({ tema, count, unlocked }) => {
              const best = (Object.keys(VARIANTS) as Variant[])
                .map((v) => [v, progress.get(scoreKey(v, tema)).bestScore] as const)
                .filter(([, score]) => score > 0)
                .map(([v, score]) => `${v === 'ordenar' ? 'Ordenar' : 'Significado'}: ${score}`);
              return h(
                'li',
                { class: 'theme-card' },
                h('h3', {}, temaLabel(tema)),
                h(
                  'p',
                  { class: 'muted' },
                  `${count} ${count === 1 ? 'frase' : 'frases'}`,
                  !unlocked
                    ? ' · 🔒 Completa Aprendizaje para desbloquear'
                    : best.length
                      ? ` · Mejor: ${best.join(', ')}`
                      : '',
                ),
                h(
                  'div',
                  { class: 'actions' },
                  unlocked
                    ? h('a', { class: 'btn btn-primary', href: playHref(tema, 'ordenar') }, 'Ordenar')
                    : h('button', { class: 'btn', disabled: true }, '🔒 Ordenar'),
                  unlocked
                    ? h('a', { class: 'btn', href: playHref(tema, 'significado') }, 'Significado')
                    : h('button', { class: 'btn', disabled: true }, '🔒 Significado'),
                ),
              );
            }),
          ),
    ),
  );
};

export const sentenceGameScreen: Screen = async (root, { tema, variante }) => {
  const variant: Variant = variante === 'significado' ? 'significado' : 'ordenar';
  if (variante && variante !== variant) return navigate(playHref(tema, variant).slice(1));

  const [playable, words] = await Promise.all([loadPlayable(), loadWords()]);
  if (tema !== ALL_THEMES && !playable.some((item) => item.sentence.tema === tema)) {
    return navigate('/frases');
  }
  if (!canPlaySentences(tema, playable, words, (theme, wordIds) =>
    progress.isLearned(theme, wordIds),
  )) {
    root.append(
      h(
        'section',
        { class: 'screen center' },
        h('h2', {}, '🔒 Modo bloqueado'),
        h(
          'p',
          {},
          tema === ALL_THEMES
            ? 'Completa Aprendizaje de todos los temas de frases para practicar todas juntas.'
            : `Completa Aprendizaje de ${themeLabel(tema)} para desbloquear sus frases.`,
        ),
        h(
          'a',
          {
            class: 'btn btn-primary',
            href: tema === ALL_THEMES ? '#/aprende' : `#/aprende/${encodeURIComponent(tema)}`,
          },
          'Ir a Aprendizaje',
        ),
      ),
    );
    return;
  }

  let state: SentenceGameState = createSentenceGame(tema, playable);
  if (state.rounds.length === 0) return navigate('/frases');

  const hud = h('div', { class: 'hud' });
  const sequenceSlot = h('div');
  const prompt = h('p', { class: 'muted center' });
  const answerRow = h('div', { class: 'sentence-answer', 'aria-label': 'Tu frase' });
  const bank = h('div', { class: 'word-bank' });
  const options = h('div', { class: 'options single' });
  const feedback = h('p', { class: 'feedback', role: 'status' });
  const actions = h('div', { class: 'actions center' });
  const screen = h(
    'section',
    { class: 'screen game sentence-game' },
    h('a', { class: 'back', href: '#/frases' }, '← Salir'),
    h('h2', {}, `${temaLabel(tema)} · ${VARIANTS[variant]}`),
    hud,
    sequenceSlot,
    prompt,
    ...(variant === 'ordenar' ? [answerRow, bank] : [options]),
    feedback,
    actions,
  );
  root.append(screen);

  let sequence: ReturnType<typeof createSignSequence> | null = null;
  const later = (fn: () => void) =>
    setTimeout(() => {
      if (screen.isConnected) fn();
    }, FEEDBACK_MS);

  function renderHud() {
    hud.replaceChildren(
      h('span', {}, `Puntaje: ${state.score}`),
      h('span', { 'aria-label': `${state.lives} vidas` }, '❤'.repeat(Math.max(state.lives, 0)) || '—'),
      h('span', {}, `Frase ${Math.min(state.index + 1, state.rounds.length)}/${state.rounds.length}`),
    );
  }

  function setFeedback(text: string, kind: 'ok' | 'bad' | '' = '') {
    feedback.textContent = text;
    feedback.className = `feedback ${kind}`;
  }

  function finish() {
    sequence?.stop();
    const isRecord = progress.saveScore(scoreKey(variant, tema), state.score);
    setLastResult({
      result: { tema, score: state.score, correct: state.correct, total: state.rounds.length, livesLeft: state.lives },
      isRecord,
      label: `Construye la frase · ${temaLabel(tema)} · ${VARIANTS[variant]}`,
      playAgainHref: playHref(tema, variant),
      review: { href: '#/frases', label: 'Otras frases' },
    });
    navigate('/resultados');
  }

  function next() {
    if (state.finished) finish();
    else renderRound();
  }

  function skipButton(): HTMLButtonElement {
    return h(
      'button',
      {
        class: 'btn btn-link',
        type: 'button',
        onclick: () => {
          const round = currentSentence(state);
          if (!round) return;
          const frase = round.sentence.frase;
          state = skipSentence(state);
          lockInputs();
          actions.replaceChildren();
          setFeedback(`La frase era: «${frase}»`);
          renderHud();
          later(next);
        },
      },
      'Saltar frase',
    );
  }

  function lockInputs() {
    for (const btn of screen.querySelectorAll<HTMLButtonElement>('.token, .option')) btn.disabled = true;
  }

  function renderRound() {
    renderHud();
    const round = currentSentence(state);
    if (!round) return finish();
    sequence?.stop();
    sequence = createSignSequence(round.words);
    sequenceSlot.replaceChildren(sequence.element);
    setFeedback('');
    actions.replaceChildren();
    if (variant === 'ordenar') renderOrder();
    else renderOptions();
    void sequence.play();
  }

  function renderOrder() {
    const round = currentSentence(state)!;
    let chosen: Token[] = [];
    let locked = false;
    prompt.textContent = 'Toca las palabras en el orden de las señas.';

    const draw = () => {
      answerRow.replaceChildren(
        ...chosen.map((token) =>
          h(
            'button',
            {
              class: 'btn token placed',
              type: 'button',
              disabled: locked,
              title: 'Quitar',
              onclick: () => {
                chosen = chosen.filter((t) => t !== token);
                draw();
              },
            },
            token.text,
          ),
        ),
        ...Array.from({ length: round.tokens.length - chosen.length }, () => h('span', { class: 'slot' })),
      );
      bank.replaceChildren(
        ...round.tokens.map((token) =>
          h(
            'button',
            {
              class: `btn token${chosen.includes(token) ? ' used' : ''}`,
              type: 'button',
              disabled: locked || chosen.includes(token),
              onclick: () => {
                chosen = [...chosen, token];
                draw();
                if (chosen.length === round.tokens.length) evaluate();
              },
            },
            token.text,
          ),
        ),
      );
    };

    const evaluate = () => {
      const texts = chosen.map((t) => t.text);
      const marks = checkOrder(round, texts);
      const result = submitSentence(state, isCorrectOrder(round, texts));
      state = result.state;
      locked = true;
      draw();
      answerRow.querySelectorAll('.token').forEach((btn, i) => btn.classList.add(marks[i] ? 'correct' : 'wrong'));
      renderHud();
      if (result.isCorrect) {
        setFeedback(`¡Correcto! «${round.sentence.frase}»`, 'ok');
        later(next);
      } else if (state.finished) {
        actions.replaceChildren();
        setFeedback(`Sin vidas. La frase era: «${round.sentence.frase}»`, 'bad');
        later(finish);
      } else {
        setFeedback('Ese no es el orden. Pierdes una vida.', 'bad');
        actions.replaceChildren(
          h(
            'button',
            {
              class: 'btn btn-primary',
              type: 'button',
              onclick: () => {
                chosen = [];
                locked = false;
                setFeedback('');
                actions.replaceChildren();
                draw();
              },
            },
            'Reintentar',
          ),
          skipButton(),
        );
      }
    };

    draw();
  }

  function renderOptions() {
    const round = currentSentence(state)!;
    prompt.textContent = '¿Qué significa la secuencia de señas?';
    options.replaceChildren(
      ...round.options.map((option) =>
        h(
          'button',
          {
            class: 'btn option',
            type: 'button',
            onclick: (e) => {
              const button = e.currentTarget as HTMLButtonElement;
              const result = submitSentence(state, option === round.sentence.frase);
              state = result.state;
              renderHud();
              if (result.isCorrect) {
                button.classList.add('correct');
                lockInputs();
                actions.replaceChildren();
                setFeedback('¡Correcto!', 'ok');
                later(next);
              } else {
                button.classList.add('wrong');
                button.disabled = true;
                if (state.finished) {
                  lockInputs();
                  actions.replaceChildren();
                  setFeedback(`Sin vidas. La frase era: «${round.sentence.frase}»`, 'bad');
                  later(finish);
                } else {
                  setFeedback('No es esa. Pierdes una vida; intenta de nuevo.', 'bad');
                  actions.replaceChildren(skipButton());
                }
              }
            },
          },
          option,
        ),
      ),
    );
  }

  renderRound();
};
