/**
 * Informations personnelles affichées sur l'accueil.
 * Une valeur vide ou absente n'est pas affichée (lien) ou est remplacée par « À compléter » (texte).
 */
export interface Formation {
  /** Période ou état, ex. « 2025 – 28 », « en cours ». */
  period: string;
  title: string;
  detail: string;
}

export const PROFILE = {
  /** Pastille au-dessus du titre. */
  status: 'Recherche un stage — Analyste SOC',
  /** Une ou deux phrases de présentation : qui je suis, ma formation. */
  intro:
    "Je suis Quentin Guirlinger, étudiant en première année de Bachelor Cybersécurité à Ynov Campus, après deux ans de licence informatique à l'université Paul Sabatier. Je m'oriente vers la défense (blue team) et je documente ici ma progression vers le métier d'analyste SOC.",
  links: {
    cv: '',
    linkedin: 'https://www.linkedin.com/in/quentin-guirlinger',
    github: 'https://github.com/TouyA0',
    contact: 'quentin@gir-lg.fr',
  },
  /** Certification ou formation en cours, affichée sous l'état de la base. */
  inProgress: '',
  formation: [
    { period: '2026 – 29', title: 'Bachelor Cybersécurité', detail: 'Ynov Campus · 1re année en cours' },
    { period: '2024 – 26', title: 'Licence Informatique', detail: 'Université Paul Sabatier · deux années suivies' },
    { period: '2026', title: 'Cyber Security 101', detail: 'TryHackMe' },
    { period: '2025', title: 'SecNumacadémie', detail: 'ANSSI' },
    { period: '2025', title: 'Introduction to Cybersecurity', detail: 'Cisco Networking Academy' },
  ] as Formation[],
} as const;
