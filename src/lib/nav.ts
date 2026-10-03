import { TACTICS } from '../data/attack';
import type { Section } from '../data/sections';
import { SITE } from '../data/site';
import { DIFFICULTIES, PLATFORMS } from '../data/writeups';
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
      return `${PLATFORMS[data.platform]} · ${DIFFICULTIES[data.difficulty].label.toLowerCase()}`;
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

export interface NavSection {
  section: Section;
  href: string | undefined;
  /** Vrai si la page courante est l'index de la section ou l'une de ses pages. */
  active: boolean;
  current: boolean;
  children: NavItem[];
}

export function getNavSections(docs: Doc[], currentId: string | undefined): NavSection[] {
  return getSectionTrees(docs).map(({ section, index, entries }) => ({
    section,
    href: index ? docUrl(index.id) : undefined,
    active: currentId?.split('/')[0] === section.dir,
    current: currentId === section.dir,
    children: entries.map((doc) => ({
      id: doc.id,
      label: doc.data.title,
      meta: docMeta(doc),
      href: docUrl(doc.id),
      current: doc.id === currentId,
    })),
  }));
}

export interface Crumb {
  label: string;
  href?: string;
}

/** Fil d'Ariane : accueil, section, regroupement éventuel (tactique ou plateforme), page courante. */
export function getCrumbs(doc: Doc): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Accueil', href: docUrl('') }];
  const section = sectionOf(doc);
  if (!section) return [...crumbs, { label: doc.data.title }];

  const sectionLabel = `${section.num} ${section.title}`;
  if (doc.id === section.dir) return [...crumbs, { label: sectionLabel }];
  crumbs.push({ label: sectionLabel, href: docUrl(section.dir) });

  const { data } = doc;
  if (data.type === 'technique') {
    const tactic = TACTICS.find((t) => t.slug === data.tactic);
    if (tactic) crumbs.push({ label: `${tactic.id} ${tactic.name}` });
    crumbs.push({ label: data.attack_id });
  } else {
    if (data.type === 'writeup') crumbs.push({ label: PLATFORMS[data.platform] });
    crumbs.push({ label: data.title });
  }
  return crumbs;
}

/** Chemin affiché dans la barre d'état. */
export function getStatusPath(doc: Doc | undefined): string {
  if (!doc) return `${SITE.name} / accueil`;
  return [SITE.name, ...getCrumbs(doc).slice(1).map((c) => c.label)].join(' / ');
}

/** Résumé de la base : « 12 fiches · 3 write-ups · maj 03/10/2026 ». */
export function getStatsParts(docs: Doc[]): { counts: string; updated: string } {
  const stats = getStats(docs);
  const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;
  return {
    counts: `${plural(stats.pages, 'fiche')} · ${plural(stats.writeups, 'write-up')}`,
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
  return section ? `${section.num} ${section.title}` : '';
}

/** Titre d'une page voisine : « T1558.003 · Kerberoasting » pour une technique. */
export function neighborLabel(doc: Doc): string {
  const { data } = doc;
  if (data.type === 'technique') return `${data.attack_id} · ${data.title}`;
  if (data.type === 'writeup') return `${data.title} · ${PLATFORMS[data.platform]}`;
  return data.title;
}
