// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Il sito è pubblicato con GitHub Pages sul sottodominio https://binary.rainbowbits.cloud/
export default defineConfig({
  site: 'https://binary.rainbowbits.cloud',
  base: '/',
  trailingSlash: 'always',
  integrations: [react(), mdx()],
  i18n: {
    // L'inglese verrà aggiunto a `locales` quando i contenuti saranno tradotti.
    locales: ['it'],
    defaultLocale: 'it',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
