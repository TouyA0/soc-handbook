import { TACTICS } from '../data/attack';
import type { Section } from '../data/sections';
import { SITE } from '../data/site';
import { DIFFICULTIES, DOMAINS, PLATFORMS, domainOf } from '../data/writeups';
import { docUrl, getSectionTrees, getStats, sectionOf, type Doc } from './content';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

/** Date au format jj/mm/aaaa. */
export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

/** Durée en minutes → « 3 h 10 » ou « 45 min ». */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

/** Courte mention affichée sous ou à côté d'un titre de page dans la navigation. */
export function docMeta(doc: Doc): string {
  const { data } = doc;
  switch (data.type) {
    case 'technique':
      return data.attack_id;
    case 'cheatsheet':
      return 'cheat sheet';
    case 'writeup':
      return `${PLATFORMS[data.platform]}, ${DIFFICULTIES[data.difficulty].label.toLowerCase()}`;
    default:
      return '';
  }
}

/** Libellé du type de page, pour les liens entrants. */
export function docTypeLabel(doc: Doc): string {
  switch (doc.data.type) {
    case 'technique':
      return 'Technique';
    case 'cheatsheet':
      return 'Cheat sheet';
    case 'writeup':
      return 'Write-up';
    default:
      return sectionOf(doc)?.title ?? 'Page';
  }
}

export interface NavItem {
  id: string;
  label: string;
  meta: string;
  href: string;
  current: boolean;
}

/**
 * Regroupement d'une section dans la barre latérale : une tactique ATT&CK (techniques) ou un domaine (write-ups).
 * `label` vide : pages sans regroupement, affichées à plat.
 */
export interface NavGroup {
  /** Identifiant unique dans la section, utilisé pour l'id de la liste : « TA0001 », « siem ». */
  key: string;
  label: string;
  /** Déplié : le groupe contient la page courante. */
  open: boolean;
  items: NavItem[];
}

export interface NavSection {
  section: Section;
  href: string | undefined;
  /** Vrai si la page courante est l'index de la section ou l'une de ses pages. */
  active: boolean;
  current: boolean;
  count: number;
  groups: NavGroup[];
}

/** Regroupement d'une page : la tactique d'une technique, le domaine d'un write-up. */
function navGroupOf(doc: Doc): { key: string; label: string } {
  const { data } = doc;
  if (data.type === 'technique') {
    const tactic = TACTICS.find((t) => t.slug === data.tactic);
    if (tactic) return { key: tactic.id, label: tactic.name };
  }
  if (data.type === 'writeup') {
    const domain = domainOf(doc.id);
    return { key: domain, label: DOMAINS[domain].label };
  }
  return { key: '', label: '' };
}

/** Mention sous le titre dans un groupe : le regroupement dit déjà la tactique d'une technique. */
function groupedMeta(doc: Doc): string {
  return doc.data.type === 'technique' ? '' : docMeta(doc);
}

export function getNavSections(docs: Doc[], currentId: string | undefined): NavSection[] {
  return getSectionTrees(docs).map(({ section, index, entries }) => {
    // Les pages arrivent déjà triées par regroupement (getSectionTrees) : on coupe aux changements de groupe.
    const groups: NavGroup[] = [];
    for (const doc of entries) {
      const group = navGroupOf(doc);
      let last = groups[groups.length - 1];
      if (!last || last.key !== group.key) {
        last = { ...group, open: false, items: [] };
        groups.push(last);
      }
      const current = doc.id === currentId;
      last.items.push({
        id: doc.id,
        label: doc.data.title,
        meta: group.label ? groupedMeta(doc) : docMeta(doc),
        href: docUrl(doc.id),
        current,
      });
      if (current) last.open = true;
    }
    return {
      section,
      href: index ? docUrl(index.id) : undefined,
      active: currentId?.split('/')[0] === section.dir,
      current: currentId === section.dir,
      count: entries.length,
      groups,
    };
  });
}

export interface Crumb {
  label: string;
  href?: string;
  /** Numéro de section : affiché en pastille de ligne devant le libellé. */
  num?: string;
}

/** Fil d'Ariane : accueil, section, regroupement éventuel (tactique ou domaine), page courante. */
export function getCrumbs(doc: Doc): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Accueil', href: docUrl('') }];
  const section = sectionOf(doc);
  if (!section) return [...crumbs, { label: doc.data.title }];

  if (doc.id === section.dir) return [...crumbs, { label: section.title, num: section.num }];
  crumbs.push({ label: section.title, href: docUrl(section.dir), num: section.num });

  // Le regroupement renvoie à son titre sur la page de la section (ancres posées par SectionListing).
  const { data } = doc;
  if (data.type === 'technique') {
    const tactic = TACTICS.find((t) => t.slug === data.tactic);
    if (tactic) crumbs.push({ label: `${tactic.id} ${tactic.name}`, href: `${docUrl(section.dir)}#${tactic.id}` });
    crumbs.push({ label: data.attack_id });
  } else {
    if (data.type === 'writeup') {
      const { label } = DOMAINS[domainOf(doc.id)];
      crumbs.push({ label, href: `${docUrl(section.dir)}#${groupAnchor(label)}` });
    }
    crumbs.push({ label: data.title });
  }
  return crumbs;
}

/** Ancre d'un titre de regroupement sur la page d'une section : « TA0006 », « siem-et-journaux ». */
export function groupAnchor(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^ta(\d{4})$/, 'TA$1');
}

/** Chemin affiché dans la barre d'état. `fallback` remplace « accueil » sur une page sans fiche (404). */
export function getStatusPath(doc: Doc | undefined, fallback = 'accueil'): string {
  if (!doc) return `${SITE.name} / ${fallback}`;
  return [SITE.name, ...getCrumbs(doc).slice(1).map((c) => (c.num ? `${c.num} ${c.label}` : c.label))].join(' / ');
}

/** Résumé de la base : « 12 fiches, 3 write-ups » et « maj 03/10/2026 ». */
export function getStatsParts(docs: Doc[]): { counts: string; updated: string } {
  const stats = getStats(docs);
  const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;
  return {
    counts: `${plural(stats.pages, 'fiche')}, ${plural(stats.writeups, 'write-up')}`,
    updated: stats.lastUpdated ? `maj ${formatDate(stats.lastUpdated)}` : '',
  };
}

/** Temps de lecture estimé, à 200 mots par minute. */
export function readingTime(body: string | undefined): string {
  const words = (body ?? '').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min de lecture`;
}

/** Contexte affiché au-dessus du titre d'une page voisine. */
export function neighborContext(doc: Doc): string {
  const { data } = doc;
  if (data.type === 'technique') return TACTICS.find((t) => t.slug === data.tactic)?.name ?? '';
  const section = sectionOf(doc);
  if (!section) return '';
  // La pastille porte déjà le numéro ; sur la page d'une section, le titre répéterait le contexte.
  return doc.id === section.dir ? 'Page de section' : section.title;
}

/** Titre d'une page voisine : « Kerberoasting (T1558.003) » pour une technique. */
export function neighborLabel(doc: Doc): string {
  const { data } = doc;
  if (data.type === 'technique') return `${data.title} (${data.attack_id})`;
  if (data.type === 'writeup') return `${data.title} (${PLATFORMS[data.platform]})`;
  return data.title;
}
