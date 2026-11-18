import { createSignMedia } from '../components/signMedia';
import { createThemeList } from '../components/themeList';
import { h } from '../dom';
import { navigate, type Screen } from '../router';
import { progress } from '../services/progress';
import {
  assetUrl,
  lessonLabel,
  loadThemes,
  signFor,
  themeLabel,
  type SignStyle,
} from '../services/words';
import type { Word } from '../types';

export const learnIndexScreen: Screen = async (root) => {
  const themes = await loadThemes();
  root.append(
    h(
      'section',
      { class: 'screen' },
      h('a', { class: 'back', href: '#/' }, '← Menú'),
      h('span', { class: 'eyebrow' }, 'Aprendizaje libre · a tu ritmo'),
      h('h2', {}, 'Explora las señas'),
      h(
        'p',
        { class: 'muted' },
        'Elige un tema para repasar sus señas. Las imágenes aparecen primero y puedes alternar a video cuando esté disponible. Completar un tema desbloquea los modos de juego.',
      ),
      createThemeList(themes),
    ),
  );
};

function wordCard(word: Word, estilo: SignStyle): HTMLElement {
  return h(
    'article',
    { class: 'word-card' },
    h('div', { class: 'sign-frame' }, createSignMedia(signFor(word, estilo), `Seña de ${word.espanol}`)),
    word.figure
      ? h('img', { class: 'figure', src: assetUrl(word.figure), alt: `Dibujo de ${word.espanol}` })
      : null,
    h('h3', { class: 'word' }, word.espanol),
    h('p', { class: 'muted' }, lessonLabel(word.leccion)),
  );
}

export const learnThemeScreen: Screen = async (root, { tema }) => {
  const theme = (await loadThemes()).find((t) => t.id === tema);
  if (!theme) return navigate('/aprende');

  let estilo: SignStyle = 'imagen';
  let index = 0;
  const cardSlot = h('div', { class: 'card-slot' });
  const counter = h('span', { class: 'counter' });
  const prev = h('button', { class: 'btn', onclick: () => show(index - 1) }, '← Anterior');
  const next = h('button', { class: 'btn', onclick: () => show(index + 1) }, 'Siguiente →');
  const styleToggle = h(
    'button',
    {
      class: 'btn',
      type: 'button',
      onclick: () => {
        estilo = estilo === 'imagen' ? 'video' : 'imagen';
        show(index);
      },
    },
    '🎬 Ver video',
  );
  const finish = h(
    'button',
    {
      class: 'btn btn-primary',
      onclick: () => {
        progress.markLearned(theme.id);
        navigate('/aprende');
      },
    },
    'Terminé de aprender',
  );

  function show(i: number) {
    index = Math.max(0, Math.min(theme!.words.length - 1, i));
    const word = theme!.words[index];
    const showingVideo = estilo === 'video' && Boolean(word.signAnimated);
    progress.markSeen(theme!.id, word.id);
    cardSlot.replaceChildren(wordCard(word, estilo));
    counter.textContent = `${index + 1} / ${theme!.words.length}`;
    styleToggle.textContent = showingVideo ? '🖼 Ver imagen' : '🎬 Ver video';
    styleToggle.disabled = !word.signAnimated;
    styleToggle.title = word.signAnimated ? '' : 'Esta seña no tiene video';
    styleToggle.setAttribute('aria-pressed', String(showingVideo));
    prev.disabled = index === 0;
    next.disabled = index === theme!.words.length - 1;
    const seen = progress.get(theme!.id).seen;
    finish.disabled = !theme!.words.every((w) => seen.includes(w.id));
    finish.title = finish.disabled ? 'Revisa todas las señas del tema' : '';
  }

  root.append(
    h(
      'section',
      { class: 'screen' },
      h('a', { class: 'back', href: '#/aprende' }, '← Temas'),
      h('h2', {}, `Aprende: ${themeLabel(theme.id)}`),
      cardSlot,
      h('div', { class: 'pager' }, prev, counter, next),
      h('div', { class: 'actions center' }, styleToggle),
      h('div', { class: 'actions center' }, finish),
    ),
  );
  show(0);
};
