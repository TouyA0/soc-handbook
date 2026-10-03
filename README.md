# soc.kb — base de connaissances SOC

Base de connaissances personnelle orientée analyste SOC (blue team), publiée sous forme de site statique :
concepts, cheat sheets d'outils, techniques d'attaque et leur détection (organisées selon MITRE ATT&CK),
playbooks d'investigation et write-ups.

Site : <https://touya0.github.io/soc-handbook/>

> En cours de construction.

## Organisation

Le contenu vit dans `src/content/docs/`, réparti en neuf sections numérotées de `00` à `08`.
Le détail est dans [docs/arborescence.md](docs/arborescence.md).

## Développement

Prérequis : Node.js 22.12 ou plus récent.

```bash
npm install        # installer les dépendances
npm run dev        # serveur de développement
npm run build      # vérification des types puis build de production
npm run preview    # prévisualiser le build
```

Le site est construit avec [Astro](https://astro.build) et déployé sur GitHub Pages
par GitHub Actions à chaque poussée sur `main`.

## Licence

Code sous licence [MIT](LICENSE).
