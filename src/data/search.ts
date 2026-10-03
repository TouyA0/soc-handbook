/** Types de résultats de recherche ; l'ordre est celui des groupes dans la palette. */
export const RESULT_TYPES = ['technique', 'event', 'filter', 'query', 'writeup', 'playbook', 'page'] as const;
export type ResultType = (typeof RESULT_TYPES)[number];

/** Enregistrement de l'index de recherche, tel qu'il est indexé par Pagefind. */
export interface SearchRecord {
  /** Identifiant unique de l'enregistrement : Pagefind fusionne les enregistrements de même URL. */
  url: string;
  content: string;
  meta: {
    title: string;
    /** Adresse à ouvrir : la page, avec l'ancre de la section concernée. */
    href: string;
    /** Courte mention en police mono à droite du résultat (T-ID, Event ID, langage…). */
    mono: string;
    /** Chemin affiché sous le titre. */
    path: string;
    desc: string;
    /** Extrait copiable : filtre, requête. */
    snippet: string;
    /** Libellé du langage de l'extrait. */
    lang: string;
    tags: string;
  };
  filters: { type: [ResultType]; tag: string[] };
}
