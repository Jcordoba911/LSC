import { h } from '../dom';

function isActive(path: string, route: 'aprende' | 'modos'): boolean {
  return route === 'aprende'
    ? path.startsWith('/aprende')
    : ['/modos', '/jugar', '/memoria', '/frases'].some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
      );
}

export function createSiteHeader(path: string): HTMLElement {
  return h(
    'header',
    { class: 'site-header' },
    h(
      'a',
      { class: 'brand', href: '#/', 'aria-label': 'LSC, ir al inicio' },
      h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, '🤟'),
      h('span', {}, 'LSC', h('small', {}, 'Lengua de Señas Colombiana')),
    ),
    h(
      'nav',
      { class: 'site-nav', 'aria-label': 'Navegación principal' },
      h(
        'a',
        { href: '#/aprende', 'aria-current': isActive(path, 'aprende') ? 'page' : undefined },
        'Aprendizaje',
      ),
      h(
        'a',
        { href: '#/modos', 'aria-current': isActive(path, 'modos') ? 'page' : undefined },
        'Modos de Juego',
      ),
    ),
  );
}

export function createSiteFooter(): HTMLElement {
  return h(
    'footer',
    { class: 'site-footer' },
    h('span', {}, 'Hecho con las manos y el corazón 💛'),
    h('a', { href: '#/aprende' }, 'Explora a tu ritmo'),
  );
}
