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

## Administrador y búsqueda visual

En cada navegador se inicializa la cuenta `admin@gmail.com` con la contraseña temporal `A123456789`. El primer acceso exige cambiarla antes de abrir el portal de administración.

Desde **Modelo visual**, el administrador puede elegir productos disponibles y agregar al menos dos imágenes por producto, para dos o más productos. MobileNet genera características de cada foto y TensorFlow.js entrena el clasificador; los ejemplos, los metadatos y el modelo quedan en IndexedDB del navegador. La primera carga de MobileNet requiere conexión a internet.

Los clientes pueden buscar por foto desde el catálogo. Las sugerencias solo pueden incluir productos y modelos guardados en el mismo navegador: la aplicación no tiene servidor, por lo que cuentas, productos y modelos no se comparten ni sincronizan entre personas o dispositivos. La cuenta inicial no es una frontera de seguridad para datos compartidos en una aplicación pública sin autenticación de servidor.
