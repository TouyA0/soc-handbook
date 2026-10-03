/** Informations générales du site. */
export const SITE = {
  name: 'soc.kb',
  tagline: 'Base de connaissances SOC',
  repo: 'https://github.com/TouyA0/soc-handbook',
  branch: 'main',
} as const;

/** Clés de stockage local, partagées entre le script d'amorçage du thème et les scripts de l'ossature. */
export const STORAGE = {
  theme: 'sockb-theme',
  sidebar: 'sockb-sidebar',
  pins: 'sockb-pins',
  recents: 'sockb-recents',
  searches: 'sockb-searches',
} as const;
