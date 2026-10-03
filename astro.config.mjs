// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { internalLinks } from './src/plugins/internal-links.mjs';
import { markdownBlocks } from './src/plugins/markdown-blocks.mjs';

const BASE = '/soc-handbook';

export default defineConfig({
  site: 'https://touya0.github.io',
  base: BASE,
  trailingSlash: 'always',
  markdown: {
    shikiConfig: {
      // Couleurs fournies par les variables `--astro-code-*`, reliées aux tokens `--syn-*` dans content.css.
      theme: 'css-variables',
      langAlias: { spl: 'splunk', kql: 'kusto', sigma: 'yaml', wireshark: 'text', bpf: 'text' },
    },
  },
  integrations: [mdx(), markdownBlocks(), internalLinks({ base: BASE, contentDir: './src/content/docs' })],
});
