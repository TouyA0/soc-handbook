---
title: "Média amovible infecté"
description: "Un malware arrive sur une clé USB et compte sur l'utilisateur pour le lancer, puis se propage à d'autres clés."
tags: [windows, usb, sysmon]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1091
tactic: initial-access
severity: med
platforms: [Windows]
data_sources: [Sysmon]
related:
  - 03-menaces-detection/initial-access/piece-jointe-malveillante
---

## Description

Comme le phishing, une clé USB infectée passe le pare-feu, fonctionne même sans accès à Internet et peut continuer à se propager sans action de l'utilisateur. Elle arrive par un « cadeau », ou par un tiers déjà infecté : une imprimerie où l'on confie sa clé, qui la rend avec le ver.

Il existe des moyens de lancer un malware dès l'insertion de la clé, mais le plus souvent c'est l'utilisateur qui le lance, trompé par un déguisement :

| Déguisement | Exemple |
| --- | --- |
| Raccourci | Les vrais fichiers sont masqués, seul reste un `RECOVERY.lnk`. |
| Fausse icône | `Photos.exe`, un exécutable avec une icône de dossier. |
| Double extension | Une copie `photo_2024_1_12.jpg.exe` de chaque fichier. |

## Ce qu'on observe

Comme pour une [pièce jointe](piece-jointe-malveillante.md), l'utilisateur lance un exécutable par l'interface : `explorer.exe` est le parent, et il est difficile de savoir comment l'attaque a commencé. Ce qui peut trahir la clé :

- **Sysmon 1** : `Image` sur une autre lettre de lecteur que `C:`, par exemple `E:\malware.exe`.
- **Sysmon 11** : les fichiers que le malware dépose ensuite sur le disque, et ceux qu'il écrit sur une autre clé pour se propager.

## Détection

### Observateur d'événements

:::etapes
1. **Trouver le lancement depuis la clé**
   Journal Sysmon, Filter Current Log sur `1` : un `Image` sur une lettre de lecteur autre que `C:`.
2. **Suivre le processus**
   Find sur son `ProcessId` : fichiers créés (11), connexions (3). Méthode : [analyser un processus](../../01-fondamentaux/journaux-windows.md#analyser-un-processus).
3. **Chercher la propagation**
   Dans les événements 11, les fichiers écrits sur une autre lettre de lecteur : une autre clé infectée.
:::

## Faux positifs

À compléter.

## Réponse

À compléter.
