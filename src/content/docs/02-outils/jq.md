---
title: "jq — lire des journaux JSON"
description: "Parcourir des journaux au format JSON en ligne de commande avec jq : mise en forme, extraction de champs, tri par horodatage."
tags: [jq, json, ligne-de-commande, journaux]
updated: 2026-11-27
draft: false
type: cheatsheet
tool: jq
---

jq traite du JSON en ligne de commande, et se combine avec les autres outils texte (`grep`, `sed`, `awk`). Avant de filtrer, il faut connaître les champs d'un journal : afficher d'abord un événement en entier. Dans les exemples, `Field1` et `Field2` sont à remplacer par les noms de champs du fichier.

## Afficher et extraire

| Commande | Ce qu'elle fait |
| --- | --- |
| `cat powershell.json \| jq` | Affiche tout le JSON, mis en forme. |
| `cat powershell.json \| jq '.Field1'` | Affiche les valeurs d'un champ, sans le nom du champ. |
| `cat powershell.json \| jq '{Field1}'` | Affiche les valeurs d'un champ, avec son nom. |
| `cat powershell.json \| jq '{Field1, Field2}'` | Affiche plusieurs champs. |

## Trier par horodatage

| Commande | Ce qu'elle fait |
| --- | --- |
| `cat powershell.json \| jq -s -c 'sort_by(.Timestamp) \| .[]'` | Trie les journaux par `Timestamp`. |
| `cat powershell.json \| jq -s -c 'sort_by(.Timestamp) \| .[] \| {Field}'` | Trie par `Timestamp` et n'affiche que certains champs : on lit les événements dans l'ordre. |
