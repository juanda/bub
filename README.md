# Bubble Bobble (clone)

Un homenaje sencillo al clasico **Bubble Bobble** (Taito, 1986). En el juego original, Bub y Bob atrapaban enemigos dentro de burbujas y los explotaban para ganar puntos. Esta version toma esa idea y la adapta con graficos y mecanicas simples en HTML5 Canvas.

## Caracteristicas

- Juego 2D en Canvas con plataformas aleatorias por nivel.
- Enemigos que se pueden atrapar con burbujas.
- Frutas y puntos extra, vidas adicionales y niveles infinitos.
- Guardado local de los 3 mejores puntajes (localStorage).
- Compatible con teclado y controles tactiles en movil.
- PWA instalable con soporte offline basico.

## Como jugar

### Teclado (PC)

- `←` / `→`: moverse
- `↑`: saltar
- `Espacio`: disparar burbuja
- `R`: reiniciar cuando hay Game Over

### Movil

- Botones en pantalla: `IZQ`, `DER`, `SALTO`, `BURBUJA`, `REINICIAR`.
- Toca la pantalla para empezar.

## Puntuacion y records

- Al terminar la partida, si tu puntuacion entra en el Top 3, puedes guardar tu nombre.
- Los records se guardan en el navegador con `localStorage`.

## PWA (Aplicacion progresiva)

Este proyecto es una **PWA** (Progressive Web App). Eso significa que:

- Puedes instalarlo en el telefono o escritorio desde el navegador.
- Funciona offline una vez se ha cargado al menos una vez.
- Usa `manifest.json` y un `service-worker` para cachear archivos.

## Requisitos

- [Bun](https://bun.sh/) instalado.

## Desarrollo

Servidor de desarrollo (sirve la app bajo `/bubble_bobble/`):

```bash
bun run dev
```

Abrir:

```text
http://localhost:3000/bubble_bobble/
```

## Build para produccion

Genera una version estatica lista para subir al servidor:

```bash
bun run build
```

El resultado se guarda en `dist/`.

## Despliegue en GitHub Pages

Hay un workflow de GitHub Actions que construye y despliega automaticamente con `bun run build`. Asegurate de:

- Tener GitHub Pages habilitado desde **Settings > Pages**.
- Usar la rama `main` (o ajustar el workflow si usas otra).

## Estructura del proyecto

```text
.
├─ index.html
├─ style.css
├─ game.js
├─ manifest.json
├─ service-worker.js
├─ icons/
├─ dist/ (generado)
└─ .github/workflows/deploy-pages.yml
```

## Nota sobre rutas

El proyecto esta pensado para desplegarse bajo una ruta como:

```text
/bubble_bobble/
```

Por eso el `manifest.json` y el servidor local usan esa base. Si cambias la ruta publica, actualiza tambien el `start_url` y `scope` del manifest y ajusta el dev server.
