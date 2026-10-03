import type { Severity } from './attack';

/** Plateformes d'entraînement : valeur du champ `platform` → nom affiché. */
export const PLATFORMS = {
  tryhackme: 'TryHackMe',
  hackthebox: 'HackTheBox',
  cyberdefenders: 'CyberDefenders',
  letsdefend: 'LetsDefend',
  autre: 'Autre',
} as const;

export type Platform = keyof typeof PLATFORMS;

/** Difficulté : valeur du champ `difficulty` → libellé et couleur de sévérité associée. */
export const DIFFICULTIES = {
  facile: { label: 'Facile', severity: 'low' },
  moyen: { label: 'Moyen', severity: 'med' },
  difficile: { label: 'Difficile', severity: 'high' },
} as const satisfies Record<string, { label: string; severity: Severity }>;

export type Difficulty = keyof typeof DIFFICULTIES;
