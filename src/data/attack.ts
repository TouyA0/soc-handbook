/** Tactiques MITRE ATT&CK (Enterprise), dans l'ordre de la matrice. `slug` est la valeur du champ `tactic`. */
export const TACTICS = [
  { id: 'TA0043', slug: 'reconnaissance', name: 'Reconnaissance' },
  { id: 'TA0042', slug: 'resource-development', name: 'Resource Development' },
  { id: 'TA0001', slug: 'initial-access', name: 'Initial Access' },
  { id: 'TA0002', slug: 'execution', name: 'Execution' },
  { id: 'TA0003', slug: 'persistence', name: 'Persistence' },
  { id: 'TA0004', slug: 'privilege-escalation', name: 'Privilege Escalation' },
  { id: 'TA0005', slug: 'defense-evasion', name: 'Defense Evasion' },
  { id: 'TA0006', slug: 'credential-access', name: 'Credential Access' },
  { id: 'TA0007', slug: 'discovery', name: 'Discovery' },
  { id: 'TA0008', slug: 'lateral-movement', name: 'Lateral Movement' },
  { id: 'TA0009', slug: 'collection', name: 'Collection' },
  { id: 'TA0011', slug: 'command-and-control', name: 'Command and Control' },
  { id: 'TA0010', slug: 'exfiltration', name: 'Exfiltration' },
  { id: 'TA0040', slug: 'impact', name: 'Impact' },
] as const;

export type Tactic = (typeof TACTICS)[number];
export type TacticSlug = Tactic['slug'];

export const TACTIC_SLUGS = TACTICS.map((t) => t.slug) as [TacticSlug, ...TacticSlug[]];

/** Sévérité : valeur du champ `severity` → libellé affiché. */
export const SEVERITIES = {
  info: 'Info',
  low: 'Faible',
  med: 'Moyen',
  high: 'Élevé',
  crit: 'Critique',
} as const;

export type Severity = keyof typeof SEVERITIES;
