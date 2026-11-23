---
title: "Tâche planifiée"
description: "L'attaquant crée une tâche planifiée qui relance son malware au démarrage : la méthode de persistance la plus courante."
tags: [windows, persistance, schtasks, sysmon, event-id]
updated: 2026-11-23
draft: false
type: technique
attack_id: T1053.005
tactic: persistence
severity: high
platforms: [Windows]
data_sources: [Journal Security, Sysmon]
related:
  - 03-menaces-detection/persistence/service-windows
  - 03-menaces-detection/persistence/cles-run-et-demarrage
  - 03-menaces-detection/persistence/tache-cron
---

## Description

Windows et les logiciels utilisent beaucoup les tâches planifiées (recherche de mises à jour, sauvegarde toutes les heures). Elles sont très faciles à configurer et à cacher : c'est la méthode de persistance la plus utilisée par les attaquants. Dans l'interface : Planificateur de tâches (`taskschd.msc`) ; en ligne de commande : `schtasks.exe`.

```text title="tâche qui lance un malware au démarrage, en SYSTEM"
schtasks /create /tn "BadTask" /tr "C:\malware.exe" /sc onstart /ru System
```

Les noms choisis paraissent anodins (`WindowsUpdate`, `Maintenance`). Autres variantes et requête Splunk : [LOLBins Windows](../../02-outils/lolbins-windows.md#tâches-planifiées-schtasks).

## Ce qu'on observe

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4698 | **Tâche planifiée créée (Security)**<br>Le nom de la tâche et sa définition : programme lancé, déclencheur. |

Trois façons de la repérer :

- **Sysmon 1** : `schtasks.exe` lancé avec `/create`.
- **4698** : la création de la tâche.
- **Sysmon 1** : un processus suspect avec pour parent `svchost.exe […] -s Schedule`.

## Détection

### Observateur d'événements

:::etapes
1. **Trouver la création**
   Journal Security, Filter Current Log sur `4698` : nom de la tâche, programme lancé.
2. **Trouver qui l'a créée**
   Journal Sysmon, filtre sur `1`, Find sur `schtasks` : la commande et son parent.
3. **Trouver le malware en action**
   Filtre sur `1`, Find sur `Schedule` : les processus lancés par le planificateur ; regarder ceux qui sont suspects.
:::

## Faux positifs

À compléter.

## Réponse

À compléter.
