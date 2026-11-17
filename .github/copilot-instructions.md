# Instrucciones para Copilot en LSC

## Repositorio y arquitectura

REPO: `Jcordoba911/LSC`, juego web educativo de Lengua de Señas Colombiana.

- Vite + TypeScript vanilla, sin framework.
- Navegación con router propio por hash en `src/router.ts`; usar `navigate()`.
- Crear nodos DOM con `h()` de `src/dom.ts`.
- Despliegue a GitHub Pages mediante `.github/workflows/deploy.yml`: `validate` → `test` → `build` → `deploy-pages`.
- Mantener compatibilidad con `BASE_PATH`, `import.meta.env.BASE_URL` y GitHub Pages.
- Mantener la separación entre UI (`src/screens/`) y lógica pura (`src/game/`).

## Datos y servicios existentes

`public/data/words.json` contiene palabras con esta forma:

```ts
{
  id: string;
  tema: string;
  leccion: number | string;
  espanol: string;
  sign: `assets/signs/${string}.png`;
  signAnimated?: `assets/signs/animated/${string}.mp4` | null;
  figure?: string | null;
}
```

- `src/services/words.ts`: `loadWords()`, `loadThemes()`, `assetUrl()` (prefija `BASE_URL`), `SignStyle` y `signFor(word, estilo)`.
- `src/services/progress.ts`: progreso en `localStorage` con clave `lsc-progress-v1`; ofrece `isLearned(tema, wordIds)`, `markSeen`, `markLearned`, `saveScore(tema, score)` y `reset()`.
- `src/components/signMedia.ts`: `createSignMedia(path, alt)` crea `<img>` o `<video>` y aplica `assetUrl()`. Los videos usan `muted`, `loop`, `autoplay` y `playsinline`. Pasar la ruta relativa del asset; **no** envolver `signFor(...)` en `assetUrl()` antes de llamar a `createSignMedia`, para evitar prefijar dos veces `BASE_URL`.
- `src/game/signToWord.ts` exporta `shuffle` y es el patrón para lógica pura testeable.
- `src/screens/results.ts` exporta `setLastResult()` y la pantalla `/resultados`.
- `public/data/sentences.json` contiene las frases y sus referencias a ids de palabras.

## Cambios de contenido y assets

- Reemplazar imágenes en `public/assets/signs/` con el nuevo stock proporcionado, conservando los mismos nombres `<id>.png` que usa `words.json`.
- No editar los archivos ZIP originales adjuntos. Extraer/copiar únicamente los assets requeridos al repositorio, conservando su estructura.
- Eliminar archivos de señas que no estén referenciados en `words.json`.
- Si se retiran palabras, eliminar sus entradas de `words.json` y verificar que `sentences.json` no referencie ids eliminados.
- Las rutas de `words.json` son relativas a `public/`; validar que todos los assets existan.
- `npm run validate` debe pasar después de cualquier cambio de contenido o assets.

## Estilos de señas

- El tipo es `SignStyle = 'imagen' | 'video'`.
- `signFor(word, estilo)` devuelve `word.signAnimated` cuando el estilo es `video` y existe video; en cualquier otro caso devuelve `word.sign`.
- En Aprende y Jugar, las rutas sin estilo deben mostrar un selector antes del contenido:
  - `#/aprende/<tema>/imagen` y `#/aprende/<tema>/video`
  - `#/jugar/<tema>/imagen` y `#/jugar/<tema>/video`
- Mostrar cuántas palabras del tema tienen video. Si ninguna tiene, ofrecer solo Imágenes.
- `createSignMedia()` aplica `assetUrl()` internamente: llamarlo con `signFor(word, estilo)` directamente.
- El progreso de Aprende se conserva por tema, sin separar claves por estilo.
- Jugar mantiene el bloqueo según `progress.isLearned(tema, wordIds)` y el puntaje general por tema con `progress.saveScore(tema, score)`.
- `src/screens/sentence.ts` ya es inherentemente de video mediante `signAnimated`; no agregar selector de estilo.

## Rutas requeridas

Registrar en `src/main.ts`:

- `/aprende/:tema/:estilo` → `learnThemeScreen`
- `/jugar/:tema/:estilo` → `gameScreen`
- `/memoria` → `memoryIndexScreen`
- `/memoria/:tema` → `memoryScreen`
- `/memoria/:tema/:estilo` → `memoryScreen`

Mantener también las rutas existentes sin `:estilo`, que muestran el selector cuando aplica.

## Modo Memoria

### Lógica

Implementar en `src/game/memory.ts`, sin dependencias de DOM:

- `createMemoryGame(tema, allWords, { pairs = 6, rng })` selecciona palabras aleatorias del tema; si hay menos de `pairs`, usa todas. Cada palabra genera una carta `{ wordId, kind: 'sign' }` y otra `{ wordId, kind: 'text' }`; barajar con `shuffle`.
- El estado contiene `tema`, `cards`, `flipped`, `matched`, `moves`, `score` y `finished`.
- `flip(state, index)` ignora índices inválidos, cartas ya volteadas y cartas emparejadas. Al voltear dos cartas, hay match cuando comparten `wordId` y son de distinto tipo. Incrementar `moves` por cada par de volteos.
- `unflip(state)` cierra las dos cartas de un intento fallido.
- Terminar al encontrar todos los pares.
- Puntaje: `max(0, pares * 20 - (movimientos - pares) * 2)`.

Agregar `src/game/memory.test.ts` con pruebas Vitest para cantidad de cartas, pares, barajado determinista con RNG, match/no-match, bloqueo de cartas emparejadas, finalización y movimientos.

### Pantallas y experiencia

- `memoryIndexScreen`: lista de temas, bloquea jugar hasta `progress.isLearned(tema, wordIds)` y muestra el récord con clave `memoria:<tema>`.
- `memoryScreen`: ofrece el selector de estilo cuando falta o es inválido; mantiene el bloqueo de Aprende.
- Tablero responsive: 4 columnas en escritorio y 3 en móvil.
- Cada carta es un botón con dos caras: reverso común `🤟`; frente con `createSignMedia(signFor(word, estilo), ...)` para `kind: 'sign'`, o `word.espanol` para `kind: 'text'`.
- Al hacer clic, llamar a `flip`; mostrar no-matches durante aproximadamente 1000 ms y luego llamar a `unflip`.
- Usar animación `rotateY` y dejar deshabilitadas/visibles las cartas emparejadas.
- Mostrar movimientos y pares en el HUD.
- Al terminar, guardar `progress.saveScore('memoria:' + tema, score)`, llamar a `setLastResult()` y navegar a `/resultados`. El enlace de volver a jugar conserva el estilo.
- Agregar al menú: `h('a', { class: 'btn btn-lg', href: '#/memoria' }, 'Memoria: encuentra los pares')`.

## Estilos y documentación

- Agregar estilos de selector (`.style-picker` o el nombre compartido existente) con dos botones grandes centrados.
- Agregar estilos para `.memory-grid`, `.memory-card`, `.card-inner`, `.card-inner.flipped`, `.card-front`, `.card-back` y `.memory-card.matched`.
- Las cartas deben usar perspectiva, `preserve-3d`, transición de aproximadamente `0.4s`, `backface-visibility: hidden`, proporción `3/4` y borde verde para los pares.
- Actualizar `README.md` para documentar Memoria y la selección imagen/video.

## Flujo de trabajo y commits previstos

Trabajar en la rama `feature/memoria-y-estilos` y abrir un PR hacia `main`. Separar los cambios en estos commits:

1. `assets: reemplazar imágenes de señas con nuevo stock`
2. `feat: helper signFor y selector de estilo en Aprende`
3. `feat: selector de estilo en modo Jugar`
4. `feat: lógica del juego de memoria con tests`
5. `feat: pantalla, rutas y estilos del modo Memoria`
6. `docs: actualizar README`

## Verificación

Antes de finalizar cambios funcionales, ejecutar:

```bash
npm run validate
npm test
npm run build
```

El workflow de deploy debe seguir validando contenido, ejecutando pruebas y build antes de desplegar a GitHub Pages.
