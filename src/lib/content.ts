import { getCollection, type CollectionEntry } from 'astro:content';
import { TACTICS, type Tactic } from '../data/attack';
import { SECTIONS, type Section } from '../data/sections';
import { bodyLinkIds } from '../plugins/internal-links.mjs';

export type Doc = CollectionEntry<'docs'>;
export type DocType = Doc['data']['type'];
export type DocOf<T extends DocType> = Doc & { data: Extract<Doc['data'], { type: T }> };

const CONTENT_DIR = 'src/content/docs';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const byTitle = (a: Doc, b: Doc) => a.data.title.localeCompare(b.data.title, 'fr');

/** Toutes les pages publiées. Les brouillons ne sont visibles qu'en développement. */
export async function getDocs(): Promise<Doc[]> {
  return getCollection('docs', ({ data }) => import.meta.env.DEV || !data.draft);
}

export function isType<T extends DocType>(doc: Doc, type: T): doc is DocOf<T> {
  return doc.data.type === type;
}

/** URL d'une page à partir de son identifiant (chaîne vide = accueil). */
export function docUrl(id: string): string {
  return id ? `${BASE}/${id}/` : `${BASE}/`;
}

export function sectionOf(doc: Doc): Section | undefined {
  const dir = doc.id.split('/')[0];
  return SECTIONS.find((s) => s.dir === dir);
}

export interface SectionTree {
  section: Section;
  /** Page d'accueil de la section (`index.md`). */
  index: Doc | undefined;
  /** Pages de la section hors index, triées par titre. */
  entries: Doc[];
}

export function getSectionTrees(docs: Doc[]): SectionTree[] {
  return SECTIONS.map((section) => {
    const inSection = docs.filter((d) => d.id.split('/')[0] === section.dir);
    return {
      section,
      index: inSection.find((d) => d.id === section.dir),
      entries: inSection.filter((d) => d.id !== section.dir).sort(byTitle),
    };
  });
}

/** Ordre de lecture : section par section, l'index d'abord puis les pages par titre. */
export function getReadingOrder(docs: Doc[]): Doc[] {
  return getSectionTrees(docs).flatMap(({ index, entries }) => (index ? [index, ...entries] : entries));
}

export function getNeighbors(docs: Doc[], doc: Doc): { prev: Doc | undefined; next: Doc | undefined } {
  const order = getReadingOrder(docs);
  const i = order.findIndex((d) => d.id === doc.id);
  return { prev: i > 0 ? order[i - 1] : undefined, next: i >= 0 ? order[i + 1] : undefined };
}

/** Identifiants des pages vers lesquelles `doc` pointe : liens du corps et références du frontmatter. */
export function getOutgoingIds(doc: Doc): Set<string> {
  const ids = new Set<string>();
  const { data } = doc;
  const refs =
    data.type === 'technique' ? [...data.writeups, ...data.related] : data.type === 'writeup' ? data.enriched : [];
  for (const ref of refs) ids.add(ref.id);

  if (doc.body && doc.filePath) {
    for (const id of bodyLinkIds(doc.filePath, doc.body, CONTENT_DIR)) ids.add(id);
  }
  ids.delete(doc.id);
  return ids;
}

/** Pages qui pointent vers `doc`, triées par titre. */
export function getBacklinks(docs: Doc[], doc: Doc): Doc[] {
  return docs.filter((other) => other.id !== doc.id && getOutgoingIds(other).has(doc.id)).sort(byTitle);
}

/** Fait échouer le build si un lien du corps ou une référence du frontmatter ne mène à aucune page publiée. */
export function assertLinks(docs: Doc[]): void {
  const known = new Set(docs.map((d) => d.id));
  for (const doc of docs) {
    for (const id of getOutgoingIds(doc)) {
      if (!known.has(id)) {
        throw new Error(`Lien vers une page non publiée « ${id} » dans ${doc.filePath ?? doc.id}.`);
      }
    }
  }
}

export interface Stats {
  /** Pages de contenu, hors index de section. */
  pages: number;
  techniques: number;
  writeups: number;
  cheatsheets: number;
  lastUpdated: Date | undefined;
}

export function getStats(docs: Doc[]): Stats {
  const sectionIds = new Set<string>(SECTIONS.map((s) => s.dir));
  const content = docs.filter((d) => !sectionIds.has(d.id));
  const count = (type: DocType) => content.filter((d) => d.data.type === type).length;
  const latest = content.reduce<Date | undefined>(
    (max, d) => (!max || d.data.updated > max ? d.data.updated : max),
    undefined,
  );
  return {
    pages: content.length,
    techniques: count('technique'),
    writeups: count('writeup'),
    cheatsheets: count('cheatsheet'),
    lastUpdated: latest,
  };
}

export interface TacticCoverage {
  tactic: Tactic;
  techniques: DocOf<'technique'>[];
}

/** Techniques documentées par tactique ATT&CK, dans l'ordre de la matrice. */
export function getAttackCoverage(docs: Doc[]): TacticCoverage[] {
  const techniques = docs.filter((d): d is DocOf<'technique'> => d.data.type === 'technique');
  return TACTICS.map((tactic) => ({
    tactic,
    techniques: techniques.filter((t) => t.data.tactic === tactic.slug).sort(byTitle),
  }));
}

/** Dernières pages mises à jour, hors index de section. */
export function getRecentDocs(docs: Doc[], limit: number): Doc[] {
  const sectionIds = new Set<string>(SECTIONS.map((s) => s.dir));
  return docs
    .filter((d) => !sectionIds.has(d.id))
    .sort((a, b) => b.data.updated.getTime() - a.data.updated.getTime())
    .slice(0, limit);
}
