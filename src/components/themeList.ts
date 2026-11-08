import { h } from '../dom';
import { progress } from '../services/progress';
import { themeLabel } from '../services/words';
import type { Theme } from '../types';

/** Lista de temas con botón "Aprende" y botón "Jugar" bloqueado hasta completar Aprende. */
export function createThemeList(themes: Theme[]): HTMLElement {
  return h(
    'ul',
    { class: 'theme-list' },
    ...themes.map((theme) => {
      const p = progress.get(theme.id);
      const seen = theme.words.filter((w) => p.seen.includes(w.id)).length;
      const playButton = p.learned
        ? h('a', { class: 'btn btn-primary', href: `#/jugar/${encodeURIComponent(theme.id)}` }, 'Jugar')
        : h(
            'button',
            { class: 'btn', disabled: true, title: 'Completa "Aprende" para desbloquear' },
            '🔒 Jugar',
          );
      return h(
        'li',
        { class: 'theme-card' },
        h('h3', {}, themeLabel(theme.id)),
        h(
          'p',
          { class: 'muted' },
          p.learned ? '✔ Aprendido' : `${seen}/${theme.words.length} señas vistas`,
          p.bestScore > 0 ? ` · Mejor puntaje: ${p.bestScore}` : '',
        ),
        h(
          'div',
          { class: 'actions' },
          h('a', { class: 'btn', href: `#/aprende/${encodeURIComponent(theme.id)}` }, 'Aprende'),
          playButton,
        ),
      );
    }),
  );
}
