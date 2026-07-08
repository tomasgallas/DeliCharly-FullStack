// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://tomasgallas.github.io',
  base: '/DeliCharly-FullStack', // Solo el nombre del repo con la barra inicial y la coma al final
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});