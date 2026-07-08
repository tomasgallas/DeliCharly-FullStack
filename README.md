# DeliCharly Fullstack

Sistema de despacho interno profesional para pizzerías.

## Configuración de Entorno

Este proyecto utiliza variables de entorno para conectarse con Supabase. Debes crear un archivo `.env` en la raíz del proyecto con la siguiente estructura:

```env
PUBLIC_SUPABASE_URL=tu_url_de_supabase
PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

**Nota de Seguridad:** El archivo `.env` está incluido en `.gitignore` para evitar que los tokens sean subidos al repositorio. GitHub Pages permite configurar estas variables mediante "Environment Variables" en los settings del repositorio o, al ser tokens públicos de Supabase, puedes configurarlos en el proceso de construcción de GitHub Actions si deseas automatizarlo.

## Comandos Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Genera los archivos estáticos para producción.
- `npm run preview`: Previsualiza la build localmente.

## Despliegue en GitHub Pages

Para desplegar:

1. Asegúrate de tener configurado `site` y `base` en `astro.config.mjs` según tu repositorio de GitHub.
2. Utiliza GitHub Actions para automatizar el build y deploy. Un flujo típico incluye:
   - Configurar `Node.js`.
   - Ejecutar `npm install`.
   - Ejecutar `npm run build`.
   - Subir el contenido de la carpeta `dist/` a la rama `gh-pages`.
