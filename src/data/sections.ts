/** Sections de la base, dans l'ordre d'affichage. `dir` est le dossier sous `src/content/docs/`. */
export const SECTIONS = [
  { num: '00', dir: '00-methodologie', title: 'Méthodologie SOC' },
  { num: '01', dir: '01-fondamentaux', title: 'Fondamentaux' },
  { num: '02', dir: '02-outils', title: 'Outils' },
  { num: '03', dir: '03-menaces-detection', title: 'Menaces & détection' },
  { num: '04', dir: '04-playbooks', title: 'Playbooks' },
  { num: '05', dir: '05-threat-intel', title: 'Threat Intelligence' },
  { num: '06', dir: '06-write-ups', title: 'Write-ups' },
  { num: '07', dir: '07-lab', title: 'Lab' },
  { num: '08', dir: '08-ressources', title: 'Ressources' },
] as const;

export type Section = (typeof SECTIONS)[number];

/**
 * Chaque section est une « ligne » avec sa couleur (`--l00` à `--l08` dans tokens.css).
 * À poser en attribut `style` sur l'élément qui porte la ligne : ses pastilles, barres et liserés lisent `--line`.
 */
export const lineStyle = (num: string | undefined) => (num ? `--line: var(--l${num})` : undefined);
