import { h } from '../dom';
import { navigate, type Screen } from '../router';
import { themeLabel } from '../services/words';
import type { GameResult } from '../types';

interface LastResult {
  result: GameResult;
  isRecord: boolean;
  /** Título bajo el encabezado; por defecto el nombre del tema. */
  label?: string;
  playAgainHref?: string;
  review?: { href: string; label: string };
}

let last: LastResult | null = null;

export function setLastResult(value: LastResult): void {
  last = value;
}

export const resultsScreen: Screen = (root) => {
  if (!last) return navigate('/');
  const { result, isRecord } = last;
  const tema = encodeURIComponent(result.tema);
  const playAgainHref = last.playAgainHref ?? `#/jugar/${encodeURIComponent(tema)}`;
  const review = last.review ?? { href: `#/aprende/${encodeURIComponent(tema)}`, label: 'Repasar' };
  const won = result.livesLeft > 0;
  root.append(
    h(
      'section',
      { class: 'screen center results' },
      h('h2', {}, won ? '¡Muy bien!' : 'Sin vidas'),
      h('p', { class: 'muted' }, last.label ?? themeLabel(result.tema)),
      h('p', { class: 'big-score' }, String(result.score)),
      h('p', {}, `Aciertos: ${result.correct} de ${result.total}`),
      isRecord ? h('p', { class: 'record' }, '¡Nuevo récord!') : null,
      h(
        'div',
        { class: 'actions center' },
        h('a', { class: 'btn btn-primary', href: playAgainHref }, 'Jugar otra vez'),
        h('a', { class: 'btn', href: review.href }, review.label),
        h('a', { class: 'btn', href: '#/' }, 'Menú'),
      ),
    ),
  );
};
