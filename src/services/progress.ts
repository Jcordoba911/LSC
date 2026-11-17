const STORAGE_KEY = 'lsc-progress-v1';

export interface ThemeProgress {
  learned: boolean;
  seen: string[];
  bestScore: number;
}

export type Progress = Record<string, ThemeProgress>;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function emptyTheme(): ThemeProgress {
  return { learned: false, seen: [], bestScore: 0 };
}

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    const candidate = globalThis.localStorage;
    if (candidate) return candidate;
  }
  return null;
}

function read(storage: StorageLike | null): Progress {
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Progress) : {};
  } catch {
    return {};
  }
}

export function createProgressService(storage?: StorageLike) {
  const store = getStorage(storage);

  const update = (tema: string, fn: (p: ThemeProgress) => void) => {
    if (!store) return;
    const all = read(store);
    const theme = { ...emptyTheme(), ...all[tema] };
    fn(theme);
    all[tema] = theme;
    store.setItem(STORAGE_KEY, JSON.stringify(all));
  };

  return {
    get(tema: string): ThemeProgress {
      const all = read(store);
      return { ...emptyTheme(), ...all[tema] };
    },
    /** Aprendido solo si se marcó y además se vieron todas las palabras actuales del tema. */
    isLearned(tema: string, wordIds: readonly string[]): boolean {
      const p = this.get(tema);
      return p.learned && wordIds.every((id) => p.seen.includes(id));
    },
    markSeen(tema: string, wordId: string): void {
      update(tema, (p) => {
        if (!p.seen.includes(wordId)) p.seen.push(wordId);
      });
    },
    markLearned(tema: string): void {
      update(tema, (p) => {
        p.learned = true;
      });
    },
    saveScore(tema: string, score: number): boolean {
      let isRecord = false;
      update(tema, (p) => {
        isRecord = score > p.bestScore;
        p.bestScore = Math.max(p.bestScore, score);
      });
      return isRecord;
    },
    reset(): void {
      if (!store) return;
      store.removeItem(STORAGE_KEY);
    },
  };
}

export const progress = createProgressService();
