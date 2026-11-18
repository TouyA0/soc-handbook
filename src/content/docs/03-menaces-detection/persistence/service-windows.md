---
title: "Service Windows"
description: "L'attaquant crée un service Windows qui relance son malware à chaque démarrage de la machine."
tags: [windows, persistance, services, sysmon, event-id]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1543.003
tactic: persistence
severity: high
platforms: [Windows]
data_sources: [Journal Security, Journal System, Sysmon]
related:
  - 03-menaces-detection/persistence/tache-planifiee
  - 03-menaces-detection/persistence/cles-run-et-demarrage
---

## Description

Un malware lancé par une pièce jointe ou une clé USB doit survivre au redémarrage et garder le contact avec son serveur de C2. Un service se lance au démarrage du système. Créer ou modifier un service demande des droits d'administrateur et passe par `sc.exe` ; `services.msc` sert à les voir.

```text title="création d'un service malveillant"
sc create "BadService" binpath= "C:\malware.exe" start= auto
```

## Ce qu'on observe

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 7045 | **Service installé (journal System)** |
| 4697 | **Service installé (journal Security)** |

Trois façons de le repérer :

- **Sysmon 1** : `sc.exe` lancé avec `create`.
- **4697 ou 7045** : la création du service.
- **Sysmon 1** : un processus suspect avec `services.exe` pour parent.

## Détection

### Observateur d'événements

:::etapes
1. **Trouver la création**
   Journal Security, Filter Current Log sur `4697` (ou journal System sur `7045`) : nom du service et programme lancé.
2. **Trouver qui l'a créé**
   Journal Sysmon, filtre sur `1`, Find sur `sc.exe` : la commande et son parent.
3. **Trouver le malware en action**
   Filtre sur `1`, Find sur `services.exe` : les processus lancés par un service ; regarder ceux qui sont suspects. Méthode : [analyser un processus](../../01-fondamentaux/journaux-windows.md#analyser-un-processus).
:::

## Faux positifs

À compléter.

## Réponse

À compléter.
