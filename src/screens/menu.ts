import { h } from '../dom';
import type { Screen } from '../router';
import { progress } from '../services/progress';

export const menuScreen: Screen = (root) => {
  root.append(
    h(
      'section',
      { class: 'screen menu' },
      h('h1', {}, 'LSC'),
      h('p', { class: 'subtitle' }, 'Aprende Lengua de Señas Colombiana jugando'),
      h(
        'nav',
        { class: 'menu-buttons' },
        h('a', { class: 'btn btn-primary btn-lg', href: '#/aprende' }, 'Aprende'),
        h('a', { class: 'btn btn-lg', href: '#/jugar' }, 'Jugar'),
      ),
      h(
        'button',
        {
          class: 'btn btn-link',
          onclick: () => {
            if (confirm('¿Borrar todo tu progreso?')) progress.reset();
          },
        },
        'Reiniciar progreso',
      ),
    ),
  );
};
