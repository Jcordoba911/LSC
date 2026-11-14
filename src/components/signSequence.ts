import { h } from '../dom';
import type { Word } from '../types';
import { createSignMedia } from './signMedia';

const DEFAULT_MS = 2500;
const MIN_MS = 1800;
const MAX_MS = 6000;
const METADATA_TIMEOUT_MS = 3000;

function waitForMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    video.addEventListener('loadedmetadata', done, { once: true });
    video.addEventListener('error', done, { once: true });
    setTimeout(done, METADATA_TIMEOUT_MS);
  });
}

/** Tiempo que se muestra cada seña: una vuelta del video (acotada) o un tiempo fijo para imágenes/GIF. */
async function displayMs(media: HTMLElement): Promise<number> {
  if (!(media instanceof HTMLVideoElement)) return DEFAULT_MS;
  await waitForMetadata(media);
  const seconds = media.duration;
  if (!Number.isFinite(seconds) || seconds <= 0) return DEFAULT_MS;
  return Math.min(MAX_MS, Math.max(MIN_MS, seconds * 1000));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reproduce en secuencia las señas animadas de una frase, con indicador de
 * paso y botón "Repetir". Los elementos se crean una vez para precargarlos.
 */
export function createSignSequence(words: (Word & { signAnimated: string })[]) {
  const media = words.map((w, i) => createSignMedia(w.signAnimated, `Seña ${i + 1} de ${words.length}`));
  const stage = h('div', { class: 'sign-frame sequence-stage' });
  const dots = words.map(() => h('span', { class: 'dot' }));
  const step = h('div', { class: 'sequence-steps', 'aria-live': 'polite' }, ...dots);
  const repeat = h('button', { class: 'btn', type: 'button' }, '↻ Repetir señas');
  const element = h('div', { class: 'sequence' }, stage, h('div', { class: 'sequence-bar' }, step, repeat));

  let run = 0;

  async function play() {
    const current = ++run;
    repeat.disabled = true;
    for (let i = 0; i < media.length; i++) {
      if (current !== run || !element.isConnected) return;
      const item = media[i];
      stage.replaceChildren(item);
      dots.forEach((dot, j) => dot.classList.toggle('active', j === i));
      dots.forEach((dot, j) => dot.classList.toggle('done', j < i));
      step.setAttribute('aria-label', `Seña ${i + 1} de ${media.length}`);
      if (item instanceof HTMLVideoElement) {
        item.currentTime = 0;
        item.play().catch(() => {});
      }
      await sleep(await displayMs(item));
    }
    if (current !== run || !element.isConnected) return;
    dots.forEach((dot) => (dot.classList.remove('active'), dot.classList.add('done')));
    step.setAttribute('aria-label', 'Secuencia terminada');
    stage.replaceChildren(h('p', { class: 'sequence-end' }, '¿Qué dice la frase?'));
    repeat.disabled = false;
  }

  repeat.addEventListener('click', () => void play());

  return {
    element,
    play,
    stop() {
      run++;
      for (const item of media) if (item instanceof HTMLVideoElement) item.pause();
    },
  };
}
