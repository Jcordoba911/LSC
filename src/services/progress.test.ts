import { describe, expect, it } from 'vitest';
import { createProgressService } from './progress';

function createMemoryStorage(initial = '') {
  const map = new Map<string, string>();
  if (initial) map.set('lsc-progress-v1', initial);
  return {
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    },
  } as Storage;
}

describe('createProgressService', () => {
  it('ignora payloads corruptos o no válidos', () => {
    const storage = createMemoryStorage('null');
    const progress = createProgressService(storage);

    expect(() => progress.saveScore('animales', 12)).not.toThrow();
    expect(progress.get('animales')).toMatchObject({ learned: false, seen: [], bestScore: 12 });

    const broken = createMemoryStorage('[]');
    expect(() => createProgressService(broken).markSeen('animales', 'perro')).not.toThrow();
  });
});
