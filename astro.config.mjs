// @ts-check
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import { internalLinks } from './src/plugins/internal-links.mjs';

const BASE = '/soc-handbook';

export default defineConfig({
  site: 'https://touya0.github.io',
  base: BASE,
  trailingSlash: 'always',
  // Expressive Code doit précéder MDX pour traiter les blocs de code des fichiers .mdx.
  integrations: [expressiveCode(), mdx(), internalLinks({ base: BASE, contentDir: './src/content/docs' })],
});
