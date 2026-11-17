import { h } from '../dom';
import { progress } from '../services/progress';
import { themeLabel } from '../services/words';
import type { Theme } from '../types';

function themeCard(theme: Theme, mode: 'learn' | 'play'): HTMLElement {
  const p = progress.get(theme.id);
  const seen = theme.words.filter((word) => p.seen.includes(word.id)).length;
  const learned = progress.isLearned(theme.id, theme.words.map((word) => word.id));
  const progressLabel = learned ? '✔ Aprendido' : `${seen}/${theme.words.length} señas vistas`;
  const action =
    mode === 'learn'
      ? h('a', { class: 'btn btn-card', href: `#/aprende/${encodeURIComponent(theme.id)}` }, 'Aprende')
      : learned
        ? h(
            'a',
            { class: 'btn btn-card', href: `#/jugar/${encodeURIComponent(theme.id)}` },
            'Jugar →',
          )
        : h(
            'button',
            { class: 'btn btn-card', disabled: true, title: 'Completa Aprendizaje para desbloquear' },
            '🔒 Bloqueado',
          );
  const progressPercent = Math.round((seen / theme.words.length) * 100);

  return h(
    'li',
    { class: 'theme-card' },
    h('span', { class: 'theme-icon', 'aria-hidden': 'true' }, themeIcon(theme.id)),
    h('div', { class: 'theme-card-copy' }, h('h3', {}, themeLabel(theme.id)), h('p', { class: 'muted' }, progressLabel)),
    h(
      'div',
      {
        class: 'progress-track',
        role: 'progressbar',
        'aria-label': `Progreso de ${themeLabel(theme.id)}`,
        'aria-valuemin': '0',
        'aria-valuemax': String(theme.words.length),
        'aria-valuenow': String(seen),
      },
      h('span', { style: `width: ${progressPercent}%` }),
    ),
    p.bestScore > 0 && mode === 'play'
      ? h('p', { class: 'theme-best muted' }, `Mejor puntaje: ${p.bestScore}`)
      : null,
    action,
  );
}

function themeIcon(theme: string): string {
  if (theme.includes('anim')) return '🐾';
  if (theme.includes('alimento')) return '🍊';
  if (theme.includes('prenda')) return '👕';
  if (theme.includes('color')) return '🎨';
  if (theme.includes('pronombre')) return '🫶';
  if (theme.includes('verbo')) return '💬';
  return '🤟';
}

function createList(themes: Theme[], mode: 'learn' | 'play'): HTMLElement {
  return h(
    'ul',
    { class: `theme-list ${mode === 'learn' ? 'learning-themes' : 'playing-themes'}` },
    ...themes.map((theme) => themeCard(theme, mode)),
  );
}

/** Temas para repasar; aquí no se ofrecen acciones de juego. */
export function createThemeList(themes: Theme[]): HTMLElement {
  return createList(themes, 'learn');
}

/** Temas para jugar; cada tema queda bloqueado hasta completar Aprendizaje. */
export function createPlayThemeList(themes: Theme[]): HTMLElement {
  return createList(themes, 'play');
}
