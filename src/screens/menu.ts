import { h } from '../dom';
import type { Screen } from '../router';
import { progress } from '../services/progress';

export const menuScreen: Screen = (root) => {
  root.append(
    h(
      'div',
      { class: 'screen home-page' },
      h(
        'section',
        { class: 'hero-panel' },
        h(
          'div',
          { class: 'hero-copy' },
          h('span', { class: 'eyebrow' }, 'Lengua de Señas Colombiana · para todos'),
          h('h1', {}, 'Las manos también cuentan historias.'),
          h(
            'p',
            { class: 'subtitle' },
            'Descubre la LSC jugando, mirando y explorando a tu manera. Un espacio abierto para aprender juntos, sin afán.',
          ),
          h(
            'div',
            { class: 'hero-actions' },
            h('a', { class: 'btn btn-primary btn-lg', href: '#/aprende' }, 'Empezar a explorar →'),
            h('a', { class: 'btn btn-quiet btn-lg', href: '#/modos' }, 'Conocer los juegos'),
          ),
          h('p', { class: 'hero-note' }, '✨ Gratis · a tu ritmo · con imágenes y videos'),
        ),
        h(
          'div',
          { class: 'hero-visual', 'aria-hidden': 'true' },
          h('span', { class: 'visual-spark spark-one' }, '✦'),
          h('span', { class: 'visual-spark spark-two' }, '✳'),
          h('div', { class: 'visual-orbit' }),
          h('div', { class: 'sign-bubble' }, '🤟'),
          h(
            'div',
            { class: 'speech-bubble' },
            h('span', { class: 'bubble-dots' }, '•••'),
            h('strong', {}, '¡Hola!'),
          ),
          h('span', { class: 'visual-caption' }, 'Una seña puede acercarnos'),
        ),
      ),
      h(
        'section',
        { class: 'discover-section', 'aria-labelledby': 'discover-title' },
        h('div', { class: 'section-heading' }, h('span', { class: 'eyebrow' }, 'Un mundo por descubrir'), h('h2', { id: 'discover-title' }, 'Aprende como más te guste')),
        h(
          'div',
          { class: 'discover-grid' },
          h(
            'a',
            { class: 'discover-card discover-learn', href: '#/aprende' },
            h('span', { class: 'discover-icon', 'aria-hidden': 'true' }, '🌱'),
            h('span', {}, h('strong', {}, 'Aprendizaje'), h('small', {}, 'Explora señas en imágenes o videos.')),
            h('span', { class: 'discover-arrow', 'aria-hidden': 'true' }, '↗'),
          ),
          h(
            'a',
            { class: 'discover-card discover-play', href: '#/modos' },
            h('span', { class: 'discover-icon', 'aria-hidden': 'true' }, '🎈'),
            h('span', {}, h('strong', {}, 'Modos de Juego'), h('small', {}, 'Practica con retos para todos.')),
            h('span', { class: 'discover-arrow', 'aria-hidden': 'true' }, '↗'),
          ),
        ),
      ),
      h(
        'div',
        { class: 'home-settings' },
        h('p', { class: 'muted' }, '¿Quieres empezar de nuevo?'),
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
    ),
  );
};
