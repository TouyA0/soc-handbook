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

/** Mention laissée dans une section encore vide (voir docs/redaction.md). */
export const PLACEHOLDER = 'À compléter.';

/**
 * Vrai si la section de niveau 2 `heading` n'a pas encore de contenu : rien, ou seulement « À compléter. »
 * (sous-titres et commentaires HTML mis à part).
 */
export function isPlaceholderSection(body: string | undefined, heading: MarkdownHeading): boolean {
  const lines = (body ?? '').split('\n');
  const start = lines.findIndex((l) => /^##\s/.test(l) && l.replace(/^##\s+/, '').trim() === heading.text.trim());
  if (start === -1) return false;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^##\s/.test(l));
  const text = rest
    .slice(0, end === -1 ? undefined : end)
    .join('\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^#{3,6}\s.*$/gm, '')
    .trim();
  return text === '' || text === PLACEHOLDER;
}

/** Sous-titres de niveau 3 placés sous un titre de niveau 2 donné. */
function subsections(headings: MarkdownHeading[], parent: MarkdownHeading): MarkdownHeading[] {
  const start = headings.indexOf(parent) + 1;
  const end = headings.findIndex((h, i) => i >= start && h.depth <= 2);
  return headings.slice(start, end === -1 ? undefined : end).filter((h) => h.depth === 3);
}

/** « Splunk — SPL » → « SPL » : le nom court d'un outil de détection. */
const shortTool = (text: string) => text.split(' — ').pop()!.trim();

/* Section dont chaque étape prend la couleur quand aucune fiche ne la porte encore. */
const LINE = { concept: '01', detection: '02', technique: '03', response: '04', practice: '06' } as const;

/**
 * Fil de connaissance d'une technique : concept → technique → détection → réponse → pratique.
 * Les cinq étapes sont toujours présentes : une étape sans fiche est marquée « prévue »,
 * pour montrer où le sujet s'inscrit même quand la base n'est pas encore complète.
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
    steps.push({
      step: 'Concept',
      label: concept.data.title,
      meta: sectionLabel(concept),
      href: docUrl(concept.id),
      num: sectionOf(concept)?.num ?? LINE.concept,
    });
  } else {
    steps.push({ step: 'Concept', label: 'Pas encore de fiche', meta: 'Fondamentaux, à venir', num: LINE.concept, planned: true });
  }

  steps.push({ step: 'Technique', label: doc.data.title, meta: 'cette fiche', current: true, num: sectionOf(doc)?.num ?? LINE.technique });

  // Une section restée à « À compléter. » ne compte pas : l'étape s'affiche en creux.
  const filled = (h: MarkdownHeading | undefined) => (h && !isPlaceholderSection(doc.body, h) ? h : undefined);
  const detection = filled(findSection(headings, 'Détection'));
  if (detection) {
    const tools = subsections(headings, detection);
    steps.push({
      step: 'Détection',
      label: tools.length > 0 ? tools.map((h) => shortTool(h.text)).join(', ') : 'Détection',
      meta: tools.length > 0 ? `${tools.length} outil${tools.length > 1 ? 's' : ''}, sur cette fiche` : 'sur cette fiche',
      href: `#${detection.slug}`,
      num: LINE.detection,
    });
  } else {
    steps.push({ step: 'Détection', label: 'Pas encore de requête', meta: 'à compléter', num: LINE.detection, planned: true });
  }

  const playbook = byId(doc.data.playbook?.id);
  const response = filled(findSection(headings, 'Réponse'));
  if (playbook) {
    steps.push({
      step: 'Réponse',
      label: playbook.data.title,
      meta: sectionLabel(playbook),
      href: docUrl(playbook.id),
      num: sectionOf(playbook)?.num ?? LINE.response,
    });
  } else if (response) {
    steps.push({ step: 'Réponse', label: 'Réponse', meta: 'sur cette fiche', href: `#${response.slug}`, num: LINE.response });
  } else {
    steps.push({ step: 'Réponse', label: 'Pas encore de réponse', meta: 'Playbooks, à venir', num: LINE.response, planned: true });
  }

  if (writeups.length > 0) {
    const platforms = [...new Set(writeups.map((w) => PLATFORMS[w.data.platform]))];
    steps.push({
      step: 'Pratique',
      label: `${writeups.length} write-up${writeups.length > 1 ? 's' : ''}`,
      meta: platforms.join(', '),
      href: `#${practiceAnchor}`,
      num: LINE.practice,
    });
  } else {
    steps.push({ step: 'Pratique', label: 'Aucun write-up encore', meta: 'Write-ups, à venir', num: LINE.practice, planned: true });
  }

  return steps;
}
