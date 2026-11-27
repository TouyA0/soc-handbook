---
title: "Méthodologie SOC"
description: "Le travail autour d'une alerte : triage, contexte, rapport et escalade, triage et rapports L2, réponse à incident et métriques."
tags: []
updated: 2026-11-12
draft: false
---

Ce que fait un analyste SOC autour d'une alerte, de son arrivée dans la file jusqu'à la réponse à l'incident. Les fiches suivent le parcours d'une alerte et se lisent dans l'ordre :

:::etapes
1. **Trier**
   Lire l'alerte, choisir laquelle traiter en premier, l'investiguer et rendre un verdict.
2. **Contextualiser**
   Pendant l'investigation : savoir qui est l'utilisateur, à quoi sert la machine, à quoi correspond l'IP, et suivre le workbook.
3. **Rapporter et escalader**
   Documenter l'alerte et la confier au L2 quand elle le demande.
4. **Approfondir (L2)**
   Reprendre l'alerte escaladée : analyse détaillée des journaux, vérification de l'activité, réponse et clôture du cas.
5. **Rendre compte (L2)**
   Rédiger pour la direction, le client ou l'équipe DFIR : rapport initial, rapport final, notes de passation.
6. **Répondre**
   Si c'est un incident, le traiter selon un cadre établi : confiner, éradiquer, restaurer, en tirer les leçons.
:::

Les métriques mesurent la qualité et la rapidité de toute cette chaîne.
