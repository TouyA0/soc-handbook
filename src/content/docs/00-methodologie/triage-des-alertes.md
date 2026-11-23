---
title: "Triage des alertes"
description: "Lire une alerte, choisir laquelle traiter en premier et la mener jusqu'au verdict."
tags: [alertes, triage, siem, soc-l1]
updated: 2026-11-23
draft: false
order: 1
---

Le triage (on dit aussi *alert handling*, *investigation*, *analysis*) consiste à examiner une alerte pour décider si c'est une vraie menace. Une alerte est générée par le SIEM ou l'EDR quand un événement, ou une suite d'événements, correspond à une règle de détection. Elle se gère dans le SIEM (Splunk ES, Elastic), l'EDR, un SOAR ou un outil de tickets (Jira, TheHive).

| Rôle | Dans le triage |
| --- | --- |
| L1 | Examine les alertes, distingue le malveillant du légitime, prévient le L2 en cas de vraie menace. |
| L2 | Reçoit les alertes escaladées, mène l'analyse approfondie et la remédiation. |
| Ingénieur SOC | Veille à ce que les alertes contiennent assez d'informations pour être triées. |
| Manager | Suit la rapidité et la qualité du triage : [métriques](metriques-soc.md). |

## Lire une alerte

| Propriété | Ce qu'elle indique |
| --- | --- |
| Heure | Création de l'alerte, en général **quelques minutes après** l'événement réel (alerte à 15:35 pour un événement à 15:32). |
| Nom | Le nom de la règle de détection : *Unusual Login Location*, *Windows RDP Bruteforce*… |
| Sévérité | Faible, moyenne, haute, critique. Fixée par les ingénieurs détection, modifiable par l'analyste. |
| Statut | Nouvelle, en cours, clôturée, plus les statuts propres à l'équipe. |
| Verdict | Vrai positif (menace réelle) ou faux positif (pas de menace). |
| Assigné | L'analyste responsable de l'alerte (*owner*). |
| Description | Logique de la règle, pourquoi cette activité peut être une attaque, parfois comment la trier. |
| Champs | Les valeurs qui ont déclenché l'alerte (hôte, ligne de commande…) et les commentaires des analystes. |

## Choisir l'alerte à traiter

:::etapes
1. **Filtrer**
   Seulement les alertes nouvelles, non résolues, que personne n'a prises.
2. **Trier par sévérité**
   Critique, haute, moyenne, puis faible : une alerte critique a beaucoup plus de chances d'être une vraie menace, et plus d'impact.
3. **Trier par ancienneté**
   La plus ancienne d'abord : l'attaquant de l'intrusion la plus ancienne est sans doute déjà en train de voler des données.
:::

## Traiter l'alerte

:::etapes
1. **Prendre en charge**
   S'assigner l'alerte, la passer « en cours », lire son nom, sa description et ses indicateurs.
2. **Qui est visé**
   L'utilisateur, l'hôte, le compte cloud, le réseau ou le site concerné : voir le [contexte](contexte-et-workbooks.md) et le tableau ci-dessous, **avant** d'ouvrir le SIEM.
3. **Quelle action**
   Ce que décrit l'alerte : connexion suspecte, malware, phishing…
4. **Ce qui s'est passé autour**
   Les événements juste avant et juste après l'alerte. Ne pas filtrer tout de suite sur la machine : vérifier d'abord si l'activité touche une seule machine ou plusieurs.
5. **Vérifier ses hypothèses**
   Threat intelligence et autres ressources disponibles. S'il existe un [workbook](contexte-et-workbooks.md#workbooks) pour ce type d'alerte, le suivre.
6. **Conclure**
   Verdict vrai ou faux positif, commentaire qui explique l'analyse et justifie le verdict ([rapport](rapport-et-escalade.md) selon l'équipe et la sévérité), puis clôture ou [escalade](rapport-et-escalade.md#quand-escalader). En escaladant, noter les questions restées ouvertes pour le L2 : comment l'attaquant est entré, comment il a obtenu le compte, ce qu'il a fait ensuite.
:::

Ce que disent les champs de l'alerte, avant toute recherche :

| Champ | Ce qu'on en tire |
| --- | --- |
| Hôte | Serveur ou poste ? Inventaire des actifs, sinon la convention de nommage : `SRV`, `WEB`, `MSQL` pour un serveur, `WIN`, `HOST` pour un poste. |
| Utilisateur | Son rôle (tableau des identités) : créer une tâche planifiée est normal pour l'informatique, étrange pour les RH. Son lieu et ses horaires de travail. |
| IP source | Interne : si c'est un attaquant, il est déjà dans le réseau (VPN compromis…). Externe : réputation dans la [threat intelligence](../05-threat-intel/ip-et-domaines.md), AbuseIPDB par exemple. |
| Heure | Pendant ou hors des heures de travail. |

Exemples de triage complet dans Splunk (force brute SSH, tâche planifiée, web shell) : [requêtes d'investigation](../02-outils/splunk-requetes.md).

| Verdict | Exemple |
| --- | --- |
| Faux positif | Gros volume de données envoyé vers une IP externe : c'était une sauvegarde vers un stockage cloud. |
| Vrai positif | Tentative de phishing sur un utilisateur : l'email visait bien à compromettre son poste. C'est un [incident](reponse-a-incident.md). |
