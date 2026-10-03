# Guide de rédaction

Syntaxe propre au site, en plus du Markdown habituel. Les modèles vides de chaque type de page sont dans [`modeles/`](modeles/).

## Frontmatter

Commun à toutes les pages :

```yaml
title: "Kerberoasting"
description: "Courte description d'une phrase"
tags: [windows, active-directory, kerberos]
updated: 2026-10-03
draft: false
```

Le champ `type` choisit le gabarit ; sans lui, la page est générique.

| `type` | Champs propres |
| --- | --- |
| `technique` | `attack_id`, `tactic`, `severity` — puis en option `platforms`, `data_sources`, `detection_confidence`, `concept`, `playbook`, `writeups`, `related` |
| `writeup` | `platform`, `difficulty`, `date` — puis en option `duration` (minutes), `skills`, `enriched` |
| `cheatsheet` | `tool` — puis en option `tested_version` |

Valeurs admises :

- `tactic` : le nom du sous-dossier de tactique, voir [arborescence.md](arborescence.md).
- `severity` : `info`, `low`, `med`, `high`, `crit`.
- `platform` : `tryhackme`, `hackthebox`, `cyberdefenders`, `letsdefend`, `autre`.
- `difficulty` : `facile`, `moyen`, `difficile`.
- `concept`, `playbook`, `writeups`, `related`, `enriched` : identifiant de la page cible, c'est-à-dire son chemin
  sous `src/content/docs/` sans extension (`06-write-ups/tryhackme/boogeyman-1`).

Un titre contenant « — » est affiché en deux temps : la partie après le tiret est atténuée.

## Titres

- `##` pour les sections : leur numéro (`01`, `02`…) est ajouté à l'affichage, ne pas l'écrire.
- `###` pour les sous-sections (un outil sous « Détection », par exemple).

## Liens internes

Écrire un chemin **relatif vers le fichier Markdown** cible, avec une ancre éventuelle :

```md
Voir [les filtres DNS](../02-outils/wireshark.md#dns).
```

Le lien est réécrit vers l'URL du site. Un lien cassé fait échouer le build.

## Encadrés

```md
:::astuce
Texte de l'astuce.
:::
```

| Bloc | Titre affiché |
| --- | --- |
| `:::astuce` | Astuce |
| `:::piege` | Piège |
| `:::faux-positifs` | Faux positifs connus (y mettre une liste à puces) |
| `:::mon-erreur` | Mon erreur |
| `:::sans-spoiler` | Sans spoiler (ajouté automatiquement en tête des write-ups) |

## Blocs de code

````md
```spl title="≥ 5 SPN en RC4 / 10 min / compte"
index=…
```
````

Le langage et le titre s'affichent dans l'en-tête, avec le bouton « Copier ».
Langages utiles : `wireshark`, `bpf`, `spl`, `kql`, `sigma`, `yaml`, `bash`, `powershell`, `json`.

## Tableaux

Un tableau Markdown ordinaire. La première colonne est mise en avant comme identifiant (Event ID, champ).
Le code placé dans la première colonne est coloré.

```md
| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4769 | **Ticket de service demandé** · Security, DC<br>Ce qu'on cherche dans l'événement. |
```

Dans une cellule, une barre verticale s'écrit `\|` — y compris dans du code : `` `a \|\| b` ``.

## Étapes numérotées

```md
:::etapes
1. **Qualifier**
   Détail de l'étape, à la ligne sous le titre.
2. **Contenir**
   Détail.
:::
```

## Write-up : une étape

Sous le titre `##` de l'étape, dans cet ordre :

````md
## Triage de l'email

::attack[T1566.001]

:::question
La question à laquelle l'étape répond.
:::

:::demarche
Ce que j'ai fait pour y répondre.
:::

```bash title="ce que fait la commande"
commande
```

:::constat
Ce que j'ai constaté — sans flag ni réponse directe.
:::
````

Dans une phrase, `:attack[T1059.001]` affiche le même badge en ligne.

## Timeline

```md
:::timeline
| Heure | Événement | Source |
| --- | --- | --- |
| 09:12 | Ce qui s'est passé | d'où vient l'information |

:::
```

Laisser une **ligne vide** entre le tableau et le `:::` de fermeture, sinon le build échoue.

## Points clés

```md
:::points
- **L'idée en gras.** Son explication.
:::
```

## Cheat sheet

Une section `##` par catégorie, chacune avec un tableau :

```md
## DNS

| Filtre | Description | Fiche |
| --- | --- | --- |
| `dns.qry.name contains "exemple"` | Ce que fait le filtre. | [Fiche liée](../03-menaces-detection/…/fiche.md) |
```

Chaque ligne reçoit un bouton « Copier » (qui copie la première colonne) et entre dans le filtre local.
La troisième colonne est facultative. La ligne « Utilisé dans » en fin de page est générée à partir des
write-ups et des pages de lab qui pointent vers la cheat sheet.

## Ce qui est généré, à ne pas écrire

- Technique : badges, bandeau de métadonnées, fil de connaissance, cartes « Pratiqué dans » (depuis `writeups`),
  ligne « Techniques liées » (depuis `related`). Garder le titre `## Pratiqué dans` en dernière section : les cartes s'affichent dessous.
- Write-up : bandeau de métadonnées, compétences, encadré « Sans spoiler », ligne « Fiches enrichies » (depuis `enriched`).
- Toutes les pages : fil d'Ariane, temps de lecture, sommaire, liens entrants, précédent / suivant, dernière modification.
