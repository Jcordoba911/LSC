# LSC · Juego de Lengua de Señas Colombiana

Juego web para aprender vocabulario de **Lengua de Señas Colombiana (LSC)**. Cada tema tiene
una sección **Aprende** con tarjetas de vocabulario (seña, dibujo de apoyo y palabra en español);
al completarla se desbloquea el juego del tema. El primer modo de juego es **seña a palabra**:
se muestra una seña y hay que elegir la palabra correcta, con puntaje y vidas. El progreso se
guarda en el navegador (`localStorage`).

### Modo "Construye la frase"

Desde el menú principal (**Construye la frase**, ruta `#/frases`) se elige un tema o "Todas las frases"
y una variante:

- **Ordenar palabras**: se reproducen en secuencia los videos/GIFs de las señas de una frase
  (con botón **↻ Repetir señas**) y debajo aparecen sus palabras desordenadas. Se tocan en el orden
  de las señas; al completar la frase se valida contra `sentences.json`. Acierto: verde y siguiente
  frase. Error: las posiciones incorrectas se marcan en rojo, se pierde una vida y se puede
  **Reintentar** o **Saltar frase**.
- **Elegir el significado**: misma secuencia de señas, pero se elige la frase completa entre opciones.

Puntaje: 10 puntos por palabra de la frase (la mitad si se acierta después de fallar). 3 vidas por
partida. Solo participan las frases cuyas palabras tienen `signAnimated`.

Hecho con [Vite](https://vite.dev) + TypeScript, sin frameworks.

## Cómo ejecutar

Requiere Node.js 20 o superior (ver `.nvmrc`).

```bash
npm install && npm run dev
```

Otros scripts:

| Comando              | Descripción                                                   |
| -------------------- | ------------------------------------------------------------- |
| `npm run build`      | Verifica tipos y genera el sitio estático en `dist/`          |
| `npm run preview`    | Sirve localmente el build de `dist/`                          |
| `npm test`           | Pruebas unitarias de la lógica del juego (Vitest)             |
| `npm run validate`   | Verifica `words.json`, `sentences.json` y que las rutas existan |

## Estructura

```
public/
  assets/signs/           Imágenes (o videos) de señas
  assets/signs/animated/  Videos/GIFs de señas para "Construye la frase"
  assets/figures/         Dibujos de apoyo
  data/words.json         Vocabulario
  data/sentences.json     Frases del modo "Construye la frase"
src/
  screens/          Menú, Aprende, Juego, Construye la frase, Resultados
  game/             Lógica de los modos de juego
  services/         Carga de vocabulario y progreso (localStorage)
  components/       Seña (<img>/<video>), lista de temas
  router.ts         Router por hash
scripts/            Script de validación de contenido
docs/               Plan e informe
```

## Agregar vocabulario

Cada entrada de `public/data/words.json` tiene este esquema (rutas relativas a `public/`):

```json
{
  "id": "perro",
  "tema": "animales",
  "leccion": 1,
  "espanol": "perro",
  "sign": "assets/signs/perro.png",
  "signAnimated": "assets/signs/animated/perro.mp4",
  "figure": null
}
```

- `sign`: `.png`/`.webp` sin texto encima, idealmente con flechas de movimiento como en el libro de LSC.
  Si la extensión es `.mp4`/`.webm` se muestra como video automáticamente.
- `signAnimated` (opcional): video o GIF de la seña (`.webm`, `.mp4` o `.gif`) en `assets/signs/animated/`.
  Las palabras sin este campo no participan en "Construye la frase". Los archivos van sueltos en el repo
  (no en zip): GitHub Pages sirve cada archivo estático por separado. Recomendado: `.mp4` (H.264) cuadrado,
  sin audio y de pocos segundos; los videos se reproducen con `loop`, `muted`, `autoplay` y `playsinline`
  (necesarios para el autoplay en móviles).
- `figure`: ruta a un dibujo de apoyo en `assets/figures/`, o `null` si no hay.

## Agregar frases

Cada entrada de `public/data/sentences.json` tiene este esquema:

```json
{
  "id": "s01",
  "tema": "animales",
  "leccion": 10,
  "palabras": ["perro", "negro"],
  "frase": "El perro es negro"
}
```

- `palabras`: ids de `words.json` **en el orden de la frase en LSC** (es el orden que se valida).
- `frase`: la frase en español que se muestra como respuesta y en la variante de opciones.

> Los videos actuales de `assets/signs/animated/` son **provisionales**: se generaron a partir de las
> imágenes estáticas (con un leve zoom) para poder probar el modo. Reemplázalos por videos reales
> de las señas manteniendo el mismo nombre, o cambia la ruta en `signAnimated`.

Después de editar, ejecuta `npm run validate`: verifica el esquema de ambos archivos, que existan las rutas
de `sign`, `signAnimated` y `figure`, y que cada id de `palabras` exista en `words.json` (avisa si una frase no
se puede jugar por falta de `signAnimated`). CI también lo ejecuta en cada PR y antes de desplegar.

## Despliegue

El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) despliega a
**GitHub Pages** en cada push a `main`: valida el contenido, corre las pruebas y hace el build de
Vite con `BASE_PATH=/<nombre-del-repo>/`.

Configuración única: en GitHub, **Settings → Pages → Build and deployment → Source: GitHub Actions**.
El sitio queda en `https://<usuario>.github.io/LSC/`.

Para probar el build con el base path localmente:

```bash
BASE_PATH=/LSC/ npm run build && BASE_PATH=/LSC/ npm run preview
```

## Créditos

Desarrollo:

- Joseph Córdoba ([@Jcordoba911](https://github.com/Jcordoba911))

Las imágenes de las señas provienen del libro de LSC.
