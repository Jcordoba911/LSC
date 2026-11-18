import { h } from '../dom';
import type { Screen } from '../router';

const modes = [
  {
    icon: '👀',
    title: 'Seña a palabra',
    description: 'Mira la seña y encuentra la palabra que le corresponde.',
    href: '#/jugar',
    className: 'mode-card-coral',
  },
  {
    icon: '🧩',
    title: 'Construye la frase',
    description: 'Sigue las señas y descubre cómo se ordenan las ideas.',
    href: '#/frases',
    className: 'mode-card-turquoise',
  },
  {
    icon: '🤟',
    title: 'Memoria: encuentra los pares',
    description: 'Une señas y palabras de todos los temas. Se desbloquea al completar Aprendizaje.',
    href: '#/memoria',
    className: 'mode-card-yellow',
  },
];

export const modesScreen: Screen = (root) => {
  root.append(
    h(
      'section',
      { class: 'screen modes-page' },
      h('a', { class: 'back', href: '#/' }, '← Menú'),
      h('span', { class: 'eyebrow' }, 'Aprender jugando'),
      h('h1', {}, 'Modos de Juego'),
      h(
        'p',
        { class: 'muted modes-intro' },
        'Elige cómo quieres practicar. Los juegos por tema se desbloquean al completar su Aprendizaje; Memoria requiere completar todos los temas.',
      ),
      h(
        'div',
        { class: 'mode-grid' },
        ...modes.map(({ icon, title, description, href, className }) =>
          h(
            'a',
            { class: `mode-card ${className}`, href },
            h('span', { class: 'mode-icon', 'aria-hidden': 'true' }, icon),
            h('h2', {}, title),
            h('p', {}, description),
          ),
        ),
      ),
    ),
  );
};
