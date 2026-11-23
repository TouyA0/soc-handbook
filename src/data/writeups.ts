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

/**
 * Domaines d'investigation : un sous-dossier de `06-write-ups/` par domaine, quelle que soit la plateforme.
 * La liste est fermée et son ordre est celui de la barre latérale et de la page de section ;
 * un write-up rangé dans un autre dossier fait échouer le build.
 */
export const DOMAINS = {
  phishing: { label: 'Phishing', description: "Analyser un e-mail suspect, ses en-têtes, ses liens et ses pièces jointes." },
  siem: { label: 'SIEM et journaux', description: 'Enquêter dans un SIEM ou dans les journaux bruts : Splunk, Elastic, journaux Windows et Linux.' },
  reseau: { label: 'Analyse réseau', description: 'Reconstituer une attaque à partir d\'une capture réseau ou des alertes d\'un IDS.' },
  forensics: { label: 'Forensics', description: "Investiguer sur un poste ou une image disque : artefacts, mémoire, chronologie." },
  'analyse-de-malware': { label: 'Analyse de malware', description: "Identifier un fichier suspect et en tirer des IOC, sans l'exécuter ou en bac à sable." },
  'threat-intel': { label: 'Threat intelligence', description: 'Enrichir des indicateurs et pivoter jusqu\'à une famille, une campagne, un rapport.' },
} as const satisfies Record<string, { label: string; description: string }>;

export type Domain = keyof typeof DOMAINS;

/** Domaine d'un write-up, lu dans son identifiant (`06-write-ups/<domaine>/<page>`). */
export function domainOf(id: string): Domain {
  const folder = id.split('/')[1] ?? '';
  if (!(folder in DOMAINS)) {
    throw new Error(
      `Write-up « ${id} » hors d'un dossier de domaine : le ranger dans 06-write-ups/<domaine>/, avec <domaine> parmi ${Object.keys(DOMAINS).join(', ')}.`,
    );
  }
  return folder as Domain;
}

/** Difficulté : valeur du champ `difficulty` → libellé et couleur de sévérité associée. */
export const DIFFICULTIES = {
  facile: { label: 'Facile', severity: 'low' },
  moyen: { label: 'Moyen', severity: 'med' },
  difficile: { label: 'Difficile', severity: 'high' },
} as const satisfies Record<string, { label: string; severity: Severity }>;

export type Difficulty = keyof typeof DIFFICULTIES;
