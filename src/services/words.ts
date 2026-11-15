import type { Theme, Word } from '../types';

let cache: Promise<Word[]> | null = null;

/** Convierte una ruta relativa a public/ en URL respetando el base path de Vite. */
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '');
}

export function loadWords(): Promise<Word[]> {
  cache ??= fetch(assetUrl('data/words.json')).then((res) => {
    if (!res.ok) throw new Error(`No se pudo cargar words.json (${res.status})`);
    return res.json() as Promise<Word[]>;
  }).catch((err: unknown) => {
    cache = null;
    throw err;
  });
  return cache;
}

export function groupByTheme(words: Word[]): Theme[] {
  const themes = new Map<string, Word[]>();
  for (const word of words) {
    const list = themes.get(word.tema) ?? [];
    list.push(word);
    themes.set(word.tema, list);
  }
  return [...themes]
    .map(([id, list]) => ({ id, words: list.sort(byLesson) }))
    .sort((a, b) => byLesson(a.words[0], b.words[0]));
}

/** Lecciones numéricas en orden; las etiquetadas (p. ej. "vocabulario") al final. */
function byLesson(a: Word, b: Word): number {
  const x = a.leccion;
  const y = b.leccion;
  if (typeof x === 'number' && typeof y === 'number') return x - y;
  if (typeof x === 'number') return -1;
  if (typeof y === 'number') return 1;
  return x.localeCompare(y, 'es');
}

export function lessonLabel(leccion: Word['leccion']): string {
  return typeof leccion === 'number' ? `Lección ${leccion}` : themeLabel(leccion);
}

export async function loadThemes(): Promise<Theme[]> {
  return groupByTheme(await loadWords());
}

export function themeLabel(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
