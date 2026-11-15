/** Entrada de public/data/words.json. Las rutas son relativas a public/. */
export interface Word {
  id: string;
  tema: string;
  /** Número de lección o etiqueta (p. ej. "vocabulario"). */
  leccion: number | string;
  espanol: string;
  sign: string;
  /** Video/GIF de la seña (.webm/.mp4/.gif). Solo estas palabras participan en "Construye la frase". */
  signAnimated?: string | null;
  figure?: string | null;
}

/** Entrada de public/data/sentences.json: ids de palabras en el orden de la frase en LSC. */
export interface Sentence {
  id: string;
  tema: string;
  leccion: number;
  palabras: string[];
  frase: string;
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
