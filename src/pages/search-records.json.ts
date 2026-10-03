// Fichier intermédiaire du build : lu par l'intégration d'indexation (src/plugins/search-index.mjs),
// qui le supprime une fois l'index Pagefind écrit. Il n'est pas publié.
import type { APIRoute } from 'astro';
import { render } from 'astro:content';
import { getDocs } from '../lib/content';
import { buildRecords } from '../lib/search-records';

export const GET: APIRoute = async () => {
  const docs = await getDocs();
  const records = await Promise.all(docs.map(async (doc) => buildRecords(doc, (await render(doc)).headings)));
  return new Response(JSON.stringify(records.flat()));
};
