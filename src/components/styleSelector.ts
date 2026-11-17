import { h } from '../dom';

type StyleRoute = 'aprende' | 'jugar';

export function createStyleSelector(route: StyleRoute, tema: string, videoCount: number): HTMLElement {
  const base = `#/${route}/${encodeURIComponent(tema)}`;
  const buttons = [
    h('a', { class: 'btn btn-primary btn-lg', href: `${base}/imagen` }, '🖼 Imágenes'),
  ];
  if (videoCount > 0) {
    buttons.push(
      h('a', { class: 'btn btn-lg', href: `${base}/video` }, `🎬 Videos (${videoCount} con seña animada)`),
    );
  }
  return h(
    'section',
    { class: 'screen style-selector' },
    h('a', { class: 'back', href: `#/${route}` }, '← Temas'),
    h('h2', {}, 'Elige cómo ver las señas'),
    h(
      'p',
      { class: 'muted' },
      videoCount > 0
        ? 'Los videos no disponibles para algunas palabras se mostrarán como imágenes.'
        : 'Este tema no tiene señas animadas; puedes continuar con imágenes.',
    ),
    h('div', { class: 'style-options' }, ...buttons),
  );
}
