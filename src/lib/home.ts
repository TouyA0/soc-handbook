// Données de l'accueil, calculées au build à partir du contenu.
import { SECTIONS } from '../data/sections';
import { docUrl, type Doc } from './content';

const sectionIds = new Set<string>(SECTIONS.map((s) => s.dir));
const isContent = (doc: Doc) => !sectionIds.has(doc.id);

export interface EventMemo {
  id: string;
  label: string;
  href: string;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim());

/**
 * Event IDs documentés : lignes des tableaux dont la première colonne s'intitule « ID ».
 * Le libellé est le texte en gras de la deuxième colonne, sinon son début.
 */
export function getEventMemo(docs: Doc[], limit: number): EventMemo[] {
  const memo = new Map<string, EventMemo>();
  for (const doc of docs.filter(isContent)) {
    const lines = (doc.body ?? '').split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      const header = cells(lines[i]!);
      if (header[0]?.toLowerCase() !== 'id' || !/^\s*\|?\s*:?-{3,}/.test(lines[i + 1]!)) continue;
      for (let j = i + 2; j < lines.length && lines[j]!.trim().startsWith('|'); j++) {
        const [id, detail = ''] = cells(lines[j]!);
        if (!id || memo.has(id)) continue;
        const label = /\*\*(.+?)\*\*/.exec(detail)?.[1] ?? detail.split(/<br\s*\/?>| · /)[0] ?? '';
        memo.set(id, { id, label: label.trim(), href: docUrl(doc.id) });
      }
    }
  }
  return [...memo.values()].slice(0, limit);
}

/** Nombre de requêtes SPL et KQL : blocs de code de ces langages dans toute la base. */
export function countQueries(docs: Doc[]): number {
  return docs
    .filter(isContent)
    .reduce((n, doc) => n + ((doc.body ?? '').match(/^```(?:spl|splunk|kql|kusto)\b/gim)?.length ?? 0), 0);
}

export interface TagUsage {
  tag: string;
  pages: number;
  writeups: number;
}

/** Tags les plus utilisés, avec le nombre de fiches et de write-ups qui les portent. */
export function getTopTags(docs: Doc[], limit: number): TagUsage[] {
  const usage = new Map<string, TagUsage>();
  for (const doc of docs.filter(isContent)) {
    const tags = doc.data.type === 'writeup' ? [...doc.data.tags, ...doc.data.skills] : doc.data.tags;
    for (const tag of new Set(tags)) {
      const entry = usage.get(tag) ?? { tag, pages: 0, writeups: 0 };
      if (doc.data.type === 'writeup') entry.writeups++;
      else entry.pages++;
      usage.set(tag, entry);
    }
  }
  return [...usage.values()]
    .sort((a, b) => b.pages + b.writeups - (a.pages + a.writeups) || a.tag.localeCompare(b.tag, 'fr'))
    .slice(0, limit);
}

/** « 3 fiches · 1 write-up » */
export function tagEvidence({ pages, writeups }: TagUsage): string {
  const parts = [];
  if (pages > 0) parts.push(`${pages} fiche${pages > 1 ? 's' : ''}`);
  if (writeups > 0) parts.push(`${writeups} write-up${writeups > 1 ? 's' : ''}`);
  return parts.join(' · ');
}
