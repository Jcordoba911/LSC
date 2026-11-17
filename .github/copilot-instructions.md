# Instrucciones para Copilot en LSC

## Repositorio y arquitectura

REPO: `Jcordoba911/LSC`, juego web educativo de Lengua de Señas Colombiana.

- Vite + TypeScript vanilla, sin framework.
- Navegación con router propio por hash en `src/router.ts`; usar `navigate()`.
- Crear nodos DOM con `h()` de `src/dom.ts`.
- Despliegue a GitHub Pages mediante `.github/workflows/deploy.yml`: `validate` → `test` → `build` → `deploy-pages`.
- Mantener compatibilidad con `BASE_PATH`, `import.meta.env.BASE_URL` y GitHub Pages.
- Mantener la separación entre UI (`src/screens/`) y lógica pura (`src/game/`).
- El router compone una cabecera y un pie comunes; conservarlos al crear o cambiar pantallas.
- Usar `src/components/siteShell.ts` para la navegación global, sin duplicar navbars por pantalla.

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

## Navegación y rutas requeridas

Registrar en `src/main.ts`:

- `/modos` → `modesScreen`
- `/aprende/:tema/:estilo` → `learnThemeScreen`
- `/jugar/:tema/:estilo` → `gameScreen`
- `/memoria` → `memoryIndexScreen`
- `/memoria/:tema` → `memoryScreen`
- `/memoria/:tema/:estilo` → `memoryScreen`

Mantener también las rutas existentes sin `:estilo`, que muestran el selector cuando aplica.

La portada ofrece únicamente **Aprendizaje** (`#/aprende`) y **Modos de Juego** (`#/modos`).
El hub de modos enlaza a `#/jugar`, `#/frases` y `#/memoria`. Los índices de Jugar, frases y
Memoria vuelven a `#/modos`; el índice de Aprendizaje vuelve a `#/`.

En `src/components/themeList.ts`, `createThemeList(themes)` muestra solo repaso y progreso;
`createPlayThemeList(themes)` muestra acciones de juego bloqueadas hasta completar Aprendizaje.
Aprendizaje sirve para repasar, no para iniciar juegos directamente desde cada tarjeta.
El índice de frases bloquea cada tema hasta completar su Aprendizaje; "Todas las frases" requiere
que estén aprendidos todos los temas que participan en frases. Mantener el bloqueo también al
abrir una ruta de partida directamente.

## Contenido de vocabulario

- Unificar el tema de las palabras `tener`, `hablar`, `necesitar`, `gustar`, `ayudar`, `entender`,
  `aprender`, `explicar`, `preguntar` y `gracias` como `verbos y expresiones`.
- No incluir `por_favor` en `words.json` ni conservar su asset si queda sin referencias.
- No migrar progreso de los ids de tema anteriores en `localStorage`; el cambio de id inicia ese
  tema con progreso nuevo.
- Mantener `sentences.json` y sus ids de palabras válidos al retirar vocabulario.

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
- La entrada a Memoria está en el hub `#/modos`, no como acceso directo en la portada.

## Estilos y documentación

- Agregar estilos de selector (`.style-picker` o el nombre compartido existente) con dos botones grandes centrados.
- Agregar estilos para `.memory-grid`, `.memory-card`, `.card-inner`, `.card-inner.flipped`, `.card-front`, `.card-back` y `.memory-card.matched`.
- Las cartas deben usar perspectiva, `preserve-3d`, transición de aproximadamente `0.4s`, `backface-visibility: hidden`, proporción `3/4` y borde verde para los pares.
- Actualizar `README.md` para documentar Memoria y la selección imagen/video.
- Mantener una identidad visual alegre, inclusiva y accesible en todas las rutas: fondos claros,
  acentos cálidos y vivos (amarillo, coral, naranja, turquesa y azul), tarjetas redondeadas,
  sombras suaves, iconografía coherente y animaciones sutiles.
- La portada tiene un hero motivador con un CTA a Aprendizaje y acceso secundario a Modos; usar
  recursos visuales relacionados con manos, señas y comunicación. El hub presenta los tres modos.
- Mantener navegación global accesible, diseño responsive, contraste y foco visible; respetar
  `prefers-reduced-motion`. Evitar un tono de curso obligatorio o una estética corporativa fría.

## Flujo de trabajo y commits previstos

Para el cambio de organización de temas y navegación, trabajar en la rama
`feature/aprendizaje-y-modos` y abrir un PR hacia `main`. Separar estos cambios en commits:

1. `data: fusionar tema expresiones en verbos y expresiones, quitar por_favor`
2. `feat: menú con Aprendizaje y hub de Modos de Juego` (incluye la identidad visual y navegación compartidas)
3. `feat: separar listas de temas para aprender vs jugar`
4. `fix: back links de índices de juegos apuntan a /modos`

## Verificación

Antes de finalizar cambios funcionales, ejecutar:

```bash
npm run validate
npm test
npm run build
```

El workflow de deploy debe seguir validando contenido, ejecutando pruebas y build antes de desplegar a GitHub Pages.
