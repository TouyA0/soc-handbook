# soc.kb — base de connaissances SOC

Base de connaissances personnelle orientée analyste SOC (blue team), publiée sous forme de site statique :
concepts, cheat sheets d'outils, techniques d'attaque et leur détection (organisées selon MITRE ATT&CK),
playbooks d'investigation et write-ups.

Site : <https://touya0.github.io/soc-handbook/>

## Ce qu'on y trouve

- **Fiches techniques** : ce qu'on observe, comment on le détecte (Wireshark, SPL, KQL, Sigma), les faux positifs, la réponse.
- **Cheat sheets** : filtres et commandes copiables d'un clic, avec filtre local.
- **Write-ups** : la démarche d'investigation étape par étape, sans flag ni réponse directe.
- **Recherche** (`Ctrl K`) : pages, Event IDs, filtres et requêtes, avec les préfixes `t:` `id:` `f:` `q:` `wu:` `pb:` et `#tag`.

## Organisation

| Dossier | Rôle |
| --- | --- |
| `src/content/docs/` | Le contenu, en Markdown, réparti en neuf sections numérotées de `00` à `08` |
| `src/components/`, `src/layouts/` | Composants et gabarits de page |
| `src/styles/tokens.css` | Couleurs, typographie, espacements : toutes les valeurs de style passent par ces variables |
| `src/plugins/` | Blocs Markdown (`:::astuce`…), vérification des liens internes, index de recherche |
| `src/data/profile.ts` | Informations personnelles affichées sur l'accueil |
| `docs/` | [Arborescence du contenu](docs/arborescence.md), [guide de rédaction](docs/redaction.md), [modèles de page](docs/modeles/) |

## Développement

Prérequis : Node.js 22.12 ou plus récent.

```bash
npm install        # installer les dépendances
npm run dev        # serveur de développement
npm run build      # vérification des types, build de production, index de recherche
npm run preview    # prévisualiser le build (nécessaire pour tester la recherche)
```

Le build échoue si une page ne respecte pas son schéma, si un lien interne est cassé ou si un bloc Markdown est mal formé.

Le site est construit avec [Astro](https://astro.build), la recherche avec [Pagefind](https://pagefind.app).
Il est déployé sur GitHub Pages par GitHub Actions à chaque poussée sur `main`.

## Licence

Code sous licence [MIT](LICENSE). Polices : voir [src/assets/fonts/LICENCE.md](src/assets/fonts/LICENCE.md).
