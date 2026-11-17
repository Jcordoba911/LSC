import { createSignMedia } from '../components/signMedia';
import { createStyleSelector } from '../components/styleSelector';
import { createThemeList } from '../components/themeList';
import { h } from '../dom';
import { navigate, type Screen } from '../router';
import { progress } from '../services/progress';
import {
  assetUrl,
  isSignStyle,
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
      h('h2', {}, 'Aprende'),
      h('p', { class: 'muted' }, 'Elige un tema, un estilo y revisa todas sus señas para desbloquear el juego.'),
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

export const learnThemeScreen: Screen = async (root, { tema, estilo }) => {
  const theme = (await loadThemes()).find((t) => t.id === tema);
  if (!theme) return navigate('/aprende');
  if (!isSignStyle(estilo)) {
    root.append(createStyleSelector('aprende', tema, theme.words.filter((word) => word.signAnimated).length));
    return;
  }
  const selectedStyle = estilo;

  let index = 0;
  const cardSlot = h('div', { class: 'card-slot' });
  const counter = h('span', { class: 'counter' });
  const prev = h('button', { class: 'btn', onclick: () => show(index - 1) }, '← Anterior');
  const next = h('button', { class: 'btn', onclick: () => show(index + 1) }, 'Siguiente →');
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
    progress.markSeen(theme!.id, word.id);
    cardSlot.replaceChildren(wordCard(word, selectedStyle));
    counter.textContent = `${index + 1} / ${theme!.words.length}`;
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
      h('h2', {}, `Aprende: ${themeLabel(theme.id)} · ${selectedStyle === 'video' ? 'Videos' : 'Imágenes'}`),
      cardSlot,
      h('div', { class: 'pager' }, prev, counter, next),
      h('div', { class: 'actions center' }, finish),
    ),
  );
  show(0);
};
