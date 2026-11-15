#!/usr/bin/env node
// Verifica public/data/words.json (esquema y que cada ruta de "sign",
// "signAnimated" y "figure" exista dentro de public/) y public/data/sentences.json
// (esquema y que cada id de "palabras" exista en words.json).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const wordsPath = join(publicDir, 'data', 'words.json');
const sentencesPath = join(publicDir, 'data', 'sentences.json');

const SIGN_EXT = ['.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg', '.mp4', '.webm', '.ogv', '.mov'];
const ANIMATED_EXT = ['.webm', '.mp4', '.gif'];
const FIGURE_EXT = ['.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg'];

const errors = [];
const warnings = [];
let words;
try {
  words = JSON.parse(readFileSync(wordsPath, 'utf8'));
} catch (err) {
  console.error(`✖ No se pudo leer ${wordsPath}: ${err.message}`);
  process.exit(1);
}
if (!Array.isArray(words)) {
  console.error('✖ words.json debe ser un arreglo');
  process.exit(1);
}

const ids = new Set();
const checkPath = (label, value, allowed, where) => {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${where}: "${label}" debe ser una ruta no vacía`);
    return;
  }
  if (!allowed.includes(extname(value).toLowerCase())) {
    errors.push(`${where}: "${label}" tiene extensión no soportada (${value})`);
  }
  const abs = resolve(publicDir, value.replace(/^\/+/, ''));
  if (!abs.startsWith(publicDir)) {
    errors.push(`${where}: "${label}" apunta fuera de public/ (${value})`);
  } else if (!existsSync(abs)) {
    errors.push(`${where}: no existe public/${value.replace(/^\/+/, '')}`);
  }
};

words.forEach((word, i) => {
  const where = `#${i} (${word?.id ?? 'sin id'})`;
  for (const key of ['id', 'tema', 'espanol']) {
    if (typeof word[key] !== 'string' || word[key].trim() === '') {
      errors.push(`${where}: "${key}" debe ser un texto no vacío`);
    }
  }
  const lessonOk =
    (Number.isInteger(word.leccion) && word.leccion >= 1) ||
    (typeof word.leccion === 'string' && word.leccion.trim() !== '');
  if (!lessonOk) {
    errors.push(`${where}: "leccion" debe ser un entero >= 1 o una etiqueta de texto`);
  }
  if (ids.has(word.id)) errors.push(`${where}: id duplicado`);
  ids.add(word.id);
  checkPath('sign', word.sign, SIGN_EXT, where);
  if (word.signAnimated != null) checkPath('signAnimated', word.signAnimated, ANIMATED_EXT, where);
  if (word.figure != null) checkPath('figure', word.figure, FIGURE_EXT, where);
});

const wordsById = new Map(words.map((w) => [w.id, w]));
let sentences = [];
try {
  sentences = JSON.parse(readFileSync(sentencesPath, 'utf8'));
  if (!Array.isArray(sentences)) {
    errors.push('sentences.json: debe ser un arreglo');
    sentences = [];
  }
} catch (err) {
  errors.push(`sentences.json: no se pudo leer (${err.message})`);
}

const sentenceIds = new Set();
let playable = 0;
sentences.forEach((sentence, i) => {
  const where = `sentences.json #${i} (${sentence?.id ?? 'sin id'})`;
  for (const key of ['id', 'tema', 'frase']) {
    if (typeof sentence[key] !== 'string' || sentence[key].trim() === '') {
      errors.push(`${where}: "${key}" debe ser un texto no vacío`);
    }
  }
  if (!Number.isInteger(sentence.leccion) || sentence.leccion < 1) {
    errors.push(`${where}: "leccion" debe ser un entero >= 1`);
  }
  if (sentenceIds.has(sentence.id)) errors.push(`${where}: id duplicado`);
  sentenceIds.add(sentence.id);
  if (!Array.isArray(sentence.palabras) || sentence.palabras.length === 0) {
    errors.push(`${where}: "palabras" debe ser una lista no vacía de ids de words.json`);
    return;
  }
  const missing = sentence.palabras.filter((id) => !wordsById.has(id));
  for (const id of missing) errors.push(`${where}: la palabra "${id}" no existe en words.json`);
  const noAnimated = sentence.palabras.filter((id) => wordsById.has(id) && !wordsById.get(id).signAnimated);
  if (noAnimated.length) {
    warnings.push(`${where}: no se jugará, falta "signAnimated" en: ${noAnimated.join(', ')}`);
  } else if (missing.length === 0) {
    playable++;
  }
});

for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  console.error(`✖ El contenido tiene ${errors.length} error(es):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
const animated = words.filter((w) => w.signAnimated != null).length;
console.log(`✔ words.json válido: ${words.length} palabras (${animated} con seña animada), todas las rutas existen.`);
console.log(`✔ sentences.json válido: ${sentences.length} frases (${playable} jugables).`);
