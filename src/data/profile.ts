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
  intro: '',
  links: {
    cv: '',
    linkedin: '',
    github: 'https://github.com/TouyA0',
    contact: 'quentin@gir-lg.fr',
  },
  /** Certification ou formation en cours, affichée sous l'état de la base. */
  inProgress: '',
  formation: [] as Formation[],
} as const;
