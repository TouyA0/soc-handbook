// @ts-check
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://touya0.github.io',
  base: '/soc-handbook',
  trailingSlash: 'always',
  // Expressive Code doit précéder MDX pour traiter les blocs de code des fichiers .mdx.
  integrations: [expressiveCode(), mdx()],
});
