import { h } from '../dom';
import { navigate, type Screen } from '../router';
import { themeLabel } from '../services/words';
import type { GameResult } from '../types';

let last: { result: GameResult; isRecord: boolean } | null = null;

export function setLastResult(value: { result: GameResult; isRecord: boolean }): void {
  last = value;
}

export const resultsScreen: Screen = (root) => {
  if (!last) return navigate('/');
  const { result, isRecord } = last;
  const won = result.livesLeft > 0;
  root.append(
    h(
      'section',
      { class: 'screen center results' },
      h('h2', {}, won ? '¡Muy bien!' : 'Sin vidas'),
      h('p', { class: 'muted' }, themeLabel(result.tema)),
      h('p', { class: 'big-score' }, String(result.score)),
      h('p', {}, `Aciertos: ${result.correct} de ${result.total}`),
      isRecord ? h('p', { class: 'record' }, '¡Nuevo récord!') : null,
      h(
        'div',
        { class: 'actions center' },
        h('a', { class: 'btn btn-primary', href: `#/jugar/${encodeURIComponent(result.tema)}` }, 'Jugar otra vez'),
        h('a', { class: 'btn', href: `#/aprende/${encodeURIComponent(result.tema)}` }, 'Repasar'),
        h('a', { class: 'btn', href: '#/' }, 'Menú'),
      ),
    ),
  );
};
