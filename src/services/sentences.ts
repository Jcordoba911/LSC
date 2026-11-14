import type { Sentence, Word } from '../types';
import { assetUrl } from './words';

let cache: Promise<Sentence[]> | null = null;

export function loadSentences(): Promise<Sentence[]> {
  cache ??= fetch(assetUrl('data/sentences.json')).then((res) => {
    if (!res.ok) throw new Error(`No se pudo cargar sentences.json (${res.status})`);
    return res.json() as Promise<Sentence[]>;
  }).catch((err: unknown) => {
    cache = null;
    throw err;
  });
  return cache;
}

/** Frase lista para jugar: sus palabras existen y todas tienen seña animada. */
export interface PlayableSentence {
  sentence: Sentence;
  words: (Word & { signAnimated: string })[];
}

export function playableSentences(sentences: readonly Sentence[], words: readonly Word[]): PlayableSentence[] {
  const byId = new Map(words.map((w) => [w.id, w]));
  const result: PlayableSentence[] = [];
  for (const sentence of sentences) {
    const list = sentence.palabras.map((id) => byId.get(id));
    if (list.length > 0 && list.every((w) => w?.signAnimated)) {
      result.push({ sentence, words: list as PlayableSentence['words'] });
    }
  }
  return result;
}
