---
title: "Réponse à incident"
description: "Types d'incidents, cadres SANS (PICERL) et NIST, plan de réponse, playbooks et runbooks."
tags: [réponse-à-incident, sans, nist, playbook, soc-l1]
updated: 2026-11-18
draft: false
order: 6
---

Un vrai positif confirmé par le [triage](triage-des-alertes.md) devient un **incident**. Chaque incident reçoit une sévérité (faible, moyenne, haute, critique) selon son impact possible, et les critiques passent en premier.

## Types d'incidents

| Type | Ce que c'est |
| --- | --- |
| Malware | Programme malveillant, arrivé le plus souvent par un fichier. La majorité des incidents. |
| Accès non autorisé | *Security breach* : quelqu'un accède à des données confidentielles sans y être autorisé. |
| Fuite de données | Données confidentielles exposées à des tiers. Peut être **involontaire** (erreur humaine, mauvaise configuration). |
| Menace interne | Attaque lancée par quelqu'un de l'organisation, qui a plus d'accès qu'un attaquant extérieur. |
| Déni de service | Ressources saturées de fausses requêtes jusqu'à l'indisponibilité. |

Plusieurs types peuvent toucher la même victime, et leur gravité dépend de l'organisation : une fuite peut être anodine pour l'une, un déni de service fatal pour une autre.

## Cadres SANS et NIST

| SANS (PICERL) | NIST | Ce qu'on y fait | Exemple |
| --- | --- | --- | --- |
| Preparation | Preparation | Équipe, plan de réponse, outils de sécurité en place. | Sensibiliser les employés au phishing. |
| Identification | Detection & Analysis | Repérer les comportements anormaux avec les outils de surveillance (SIEM, antivirus, EDR). | Gros volume de données sortant d'un hôte compromis par une pièce jointe. |
| Containment | Containment, Eradication & Recovery | Limiter l'impact : isoler la machine, désactiver les comptes compromis. Un EDR peut le faire. | Isoler l'hôte pour que l'attaquant ne rebondisse pas. |
| Eradication | Containment, Eradication & Recovery | Supprimer la menace, s'assurer que l'environnement est sain. | Analyse antimalware approfondie. |
| Recovery | Containment, Eradication & Recovery | Restaurer ou reconstruire les systèmes, les tester avant remise en service. | Reconfigurer l'hôte, restaurer les données depuis la sauvegarde. |
| Lessons Learned | Post-Incident Activity | Documenter les manques de la détection et de l'analyse. | Réunion post-incident sur la cause racine. |

## Plan de réponse à incident

Document formel validé par la direction (*Incident Response Plan*), qui fixe les procédures avant, pendant et après un incident : rôles et responsabilités, méthodologie, plan de communication (forces de l'ordre comprises), circuit d'[escalade](rapport-et-escalade.md).

## Playbooks et runbooks

- **Playbook** : les lignes directrices de la réponse à un type d'incident.
- **Runbook** : l'exécution détaillée, pas à pas, d'une étape précise.

Exemple de playbook, email de phishing :

:::etapes
1. **Prévenir**
   Informer les parties prenantes.
2. **Qualifier l'email**
   Analyser les en-têtes et le corps.
3. **Analyser les pièces jointes**
   Les rechercher et les analyser.
4. **Mesurer l'exposition**
   Quelqu'un a-t-il ouvert les pièces jointes ?
5. **Isoler**
   Couper du réseau les systèmes infectés.
6. **Bloquer**
   Bloquer l'expéditeur.
:::
