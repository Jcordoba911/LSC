# LSC · Juego de Lengua de Señas Colombiana

Juego web para aprender vocabulario de **Lengua de Señas Colombiana (LSC)**. Cada tema tiene
una sección **Aprende** con tarjetas de vocabulario (seña, dibujo de apoyo y palabra en español);
al completarla se desbloquea el juego del tema. El primer modo de juego es **seña a palabra**:
se muestra una seña y hay que elegir la palabra correcta, con puntaje y vidas. El progreso se
guarda en el navegador (`localStorage`).

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
| `npm run validate`   | Verifica `words.json` y que todas sus rutas existan en disco  |

## Estructura

```
public/
  assets/signs/     Imágenes (o videos) de señas
  assets/figures/   Dibujos de apoyo
  data/words.json   Vocabulario
src/
  screens/          Menú, Aprende, Juego, Resultados
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
  "figure": null
}
```

- `sign`: `.png`/`.webp` sin texto encima, idealmente con flechas de movimiento como en el libro de LSC.
  Si la extensión es `.mp4`/`.webm` se muestra como video automáticamente.
- `figure`: ruta a un dibujo de apoyo en `assets/figures/`, o `null` si no hay.

Después de editar, ejecuta `npm run validate`. CI también lo ejecuta en cada PR y antes de desplegar.

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

Equipo:

- Joseph Córdoba ([@Jcordoba911](https://github.com/Jcordoba911))
- _(agregar integrantes del equipo)_

Las señas de referencia se basan en el libro de LSC utilizado por el equipo.
