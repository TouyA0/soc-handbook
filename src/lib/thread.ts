import type { MarkdownHeading } from 'astro';
import type { ThreadStep } from '../components/KnowledgeThread.astro';
import { PLATFORMS } from '../data/writeups';
import { docUrl, sectionOf, type Doc, type DocOf } from './content';

const sectionLabel = (doc: Doc) => {
  const section = sectionOf(doc);
  return section ? `${section.num} ${section.title}` : '';
};

/** Titre de niveau 2 dont le texte commence par `start` (sans tenir compte de la casse). */
export function findSection(headings: MarkdownHeading[], start: string): MarkdownHeading | undefined {
  return headings.find((h) => h.depth === 2 && h.text.trim().toLowerCase().startsWith(start.toLowerCase()));
}

/** Sous-titres de niveau 3 placés sous un titre de niveau 2 donné. */
function subsections(headings: MarkdownHeading[], parent: MarkdownHeading): MarkdownHeading[] {
  const start = headings.indexOf(parent) + 1;
  const end = headings.findIndex((h, i) => i >= start && h.depth <= 2);
  return headings.slice(start, end === -1 ? undefined : end).filter((h) => h.depth === 3);
}

/** « Splunk — SPL » → « SPL » : le nom court d'un outil de détection. */
const shortTool = (text: string) => text.split(' — ').pop()!.trim();

/**
 * Fil de connaissance d'une technique : concept → technique → détection → réponse → pratique.
 * Une étape sans matière (pas de page de concept, pas de write-up…) est omise.
 */
export function buildThread(
  doc: DocOf<'technique'>,
  docs: Doc[],
  headings: MarkdownHeading[],
  writeups: DocOf<'writeup'>[],
  practiceAnchor: string,
): ThreadStep[] {
  const byId = (id: string | undefined) => docs.find((d) => d.id === id);
  const steps: ThreadStep[] = [];

  const concept = byId(doc.data.concept?.id);
  if (concept) {
    steps.push({ step: 'Concept', label: concept.data.title, meta: sectionLabel(concept), href: docUrl(concept.id) });
  }

  steps.push({ step: 'Technique', label: doc.data.title, meta: 'vous êtes ici', current: true });

  const detection = findSection(headings, 'Détection');
  if (detection) {
    const tools = subsections(headings, detection);
    steps.push({
      step: 'Détection',
      label: tools.length > 0 ? tools.map((h) => shortTool(h.text)).join(' · ') : 'Détection',
      meta: tools.length > 0 ? `${tools.length} outil${tools.length > 1 ? 's' : ''}` : 'sur cette page',
      href: `#${detection.slug}`,
    });
  }

  const playbook = byId(doc.data.playbook?.id);
  const response = findSection(headings, 'Réponse');
  if (playbook) {
    steps.push({ step: 'Réponse', label: playbook.data.title, meta: sectionLabel(playbook), href: docUrl(playbook.id) });
  } else if (response) {
    steps.push({ step: 'Réponse', label: 'Réponse', meta: 'sur cette page', href: `#${response.slug}` });
  }

  if (writeups.length > 0) {
    const platforms = [...new Set(writeups.map((w) => PLATFORMS[w.data.platform]))];
    steps.push({
      step: 'Pratique',
      label: `${writeups.length} write-up${writeups.length > 1 ? 's' : ''}`,
      meta: platforms.join(' · '),
      href: `#${practiceAnchor}`,
    });
  }

  return steps;
}
