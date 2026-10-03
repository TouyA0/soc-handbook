// Index de recherche : à la fin du build, les enregistrements de search-records.json
// sont indexés par Pagefind dans dist/pagefind/, puis le fichier intermédiaire est supprimé.
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';

const RECORDS_FILE = 'search-records.json';

export function searchIndex() {
  return {
    name: 'soc-handbook-search-index',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const recordsUrl = new URL(RECORDS_FILE, dir);
        const records = JSON.parse(await fs.readFile(recordsUrl, 'utf8'));

        const { index, errors } = await pagefind.createIndex({ forceLanguage: 'fr' });
        if (!index) throw new Error(`Pagefind : création de l'index impossible. ${errors.join(' ')}`);
        for (const record of records) {
          const result = await index.addCustomRecord({ ...record, language: 'fr' });
          if (result.errors.length > 0) {
            throw new Error(`Pagefind : enregistrement refusé pour ${record.url}. ${result.errors.join(' ')}`);
          }
        }
        const written = await index.writeFiles({ outputPath: fileURLToPath(new URL('pagefind', dir)) });
        if (written.errors.length > 0) throw new Error(`Pagefind : écriture de l'index impossible. ${written.errors.join(' ')}`);
        await pagefind.close();

        await fs.rm(recordsUrl);
        logger.info(`${records.length} enregistrements indexés`);
      },
    },
  };
}
