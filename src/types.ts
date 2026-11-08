/** Entrada de public/data/words.json. Las rutas son relativas a public/. */
export interface Word {
  id: string;
  tema: string;
  leccion: number;
  espanol: string;
  sign: string;
  figure?: string | null;
}

export interface Theme {
  id: string;
  words: Word[];
}

export interface GameResult {
  tema: string;
  score: number;
  correct: number;
  total: number;
  livesLeft: number;
}
