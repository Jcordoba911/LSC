const STORAGE_KEY = 'lsc-progress-v1';

export interface ThemeProgress {
  learned: boolean;
  seen: string[];
  bestScore: number;
}

export type Progress = Record<string, ThemeProgress>;

function emptyTheme(): ThemeProgress {
  return { learned: false, seen: [], bestScore: 0 };
}

function read(storage: Storage): Progress {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Progress) : {};
  } catch {
    return {};
  }
}

export function createProgressService(storage: Storage = localStorage) {
  const update = (tema: string, fn: (p: ThemeProgress) => void) => {
    const all = read(storage);
    const theme = { ...emptyTheme(), ...all[tema] };
    fn(theme);
    all[tema] = theme;
    storage.setItem(STORAGE_KEY, JSON.stringify(all));
  };

  return {
    get(tema: string): ThemeProgress {
      return { ...emptyTheme(), ...read(storage)[tema] };
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
      storage.removeItem(STORAGE_KEY);
    },
  };
}

export const progress = createProgressService();
