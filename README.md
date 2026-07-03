# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Deploy en Firebase Hosting

Este proyecto ya incluye una configuración base para Firebase Hosting en `firebase.json`.

### Requisitos

- Tener instalado Node.js y npm
- Tener acceso al proyecto de Firebase

### Pasos

```bash
npm install
npx firebase-tools login
npx firebase-tools use --add
npm run deploy
```

Si prefieres ejecutar los comandos por separado:

```bash
npm run build
npx firebase-tools deploy --only hosting
```

### Notas

- La carpeta publicada es `dist`, que es la salida por defecto de Vite.
- El archivo `firebase.json` ya incluye el rewrite para que las rutas de Vue Router funcionen al recargar páginas.
- La primera vez que vincules el proyecto, `firebase use --add` te generará el archivo `.firebaserc` con tu proyecto real.

