# Plan del proyecto

Juego web para aprender vocabulario básico de Lengua de Señas Colombiana (LSC).

## Objetivo

Que la persona usuaria primero **aprenda** las señas de un tema (tarjetas de vocabulario)
y luego las **practique** en minijuegos, con su progreso guardado en el navegador.

## Alcance del MVP

- Menú principal con navegación por hash (`#/`, `#/aprende`, `#/jugar`, `#/resultados`).
- Pantalla **Aprende**: tarjetas por tema (seña + dibujo de apoyo + palabra en español).
  Al revisar todas las tarjetas se habilita "Terminé de aprender".
- El botón **Jugar** de cada tema permanece bloqueado hasta completar su Aprende
  (estado en `localStorage`, clave `lsc-progress-v1`).
- Modo de juego **seña a palabra**: se muestra una seña y se elige la palabra correcta.
  10 puntos por acierto, 3 vidas, una ronda por palabra del tema.
- Pantalla de **resultados** con puntaje, aciertos y récord por tema.

## Contenido

- Vocabulario en `public/data/words.json` (`id`, `tema`, `leccion`, `espanol`, `sign`, `figure`).
- Señas en `public/assets/signs/` (`.png`/`.webp`, sin texto, con flechas de movimiento como en el libro de LSC).
  El componente de seña usa `<video>` si la extensión es `.mp4`/`.webm`, para migrar a video sin tocar la lógica.
- Dibujos de apoyo en `public/assets/figures/`.
- Vocabulario inicial: 50 señas en 4 temas (alimentos, animales, prendas, colores), lecciones 9–11 del libro.

## Próximos pasos

1. Ampliar el vocabulario por temas/lecciones y agregar dibujos de apoyo (`figure`).
2. Nuevos modos de juego: palabra a seña, memoria (parejas), contrarreloj.
3. Accesibilidad: navegación por teclado, alto contraste, lectura en voz.
4. Validación de contenido con personas sordas / intérpretes de LSC.
