# FerroLink

Aplicación web de FerroLink, construida con React y Vite.

## Desarrollo local

```sh
npm ci
npm run dev
```

Verifica los cambios con `npm run lint` y genera la versión de producción con `npm run build`.

## Publicación en GitHub Pages

El workflow [Deploy to GitHub Pages](./.github/workflows/deploy-pages.yml) ejecuta lint, compila la aplicación y publica `dist` al hacer push a `main` (o al iniciarlo manualmente desde Actions). Vite usa la ruta `/FerroLink/` para Pages y `/` en desarrollo local.

En GitHub, habilita Pages en **Settings → Pages → Build and deployment → Source: GitHub Actions**. Después del primer despliegue, la aplicación estará en:

<https://bt1141022012.github.io/FerroLink/>

El repositorio actualmente es privado. La disponibilidad de GitHub Pages para un repositorio privado depende del plan de GitHub; si Pages no permite activarlo, cambia la visibilidad del repositorio a pública o usa un plan compatible.

La aplicación guarda perfiles, productos e información de prueba en IndexedDB del navegador. Los datos no se publican junto al sitio ni se sincronizan entre dispositivos.
