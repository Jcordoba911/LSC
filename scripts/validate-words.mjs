#!/usr/bin/env node
// Verifica que public/data/words.json tenga el esquema esperado y que cada
// ruta de "sign" y "figure" exista dentro de public/.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const wordsPath = join(publicDir, 'data', 'words.json');

const SIGN_EXT = ['.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg', '.mp4', '.webm', '.ogv', '.mov'];
const FIGURE_EXT = ['.png', '.webp', '.jpg', '.jpeg', '.gif', '.svg'];

const errors = [];
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
  if (!Number.isInteger(word.leccion) || word.leccion < 1) {
    errors.push(`${where}: "leccion" debe ser un entero >= 1`);
  }
  if (ids.has(word.id)) errors.push(`${where}: id duplicado`);
  ids.add(word.id);
  checkPath('sign', word.sign, SIGN_EXT, where);
  if (word.figure != null) checkPath('figure', word.figure, FIGURE_EXT, where);
});

if (errors.length) {
  console.error(`✖ words.json tiene ${errors.length} error(es):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✔ words.json válido: ${words.length} palabras, todas las rutas existen.`);
