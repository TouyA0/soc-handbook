---
title: "Métriques SOC"
description: "Les métriques d'un SOC (AC, FPR, AER, TDR, MTTD, MTTA, MTTR), leurs repères et comment les améliorer."
tags: [métriques, sla, mttd, mttr, soc-l1]
updated: 2026-11-18
draft: false
order: 5
---

Les métriques mesurent l'efficacité du SOC, et servent souvent à évaluer les analystes. Définitions et formules varient selon les équipes : les repères ci-dessous sont des ordres de grandeur courants.

## Métriques d'alertes

| Sigle | Formule | Ce qu'elle mesure | Repère |
| --- | --- | --- | --- |
| AC | nombre total d'alertes reçues | La charge des analystes. | 5 à 30 par jour et par L1. Trop peu est aussi suspect : problème de SIEM ou manque de visibilité. |
| FPR | faux positifs / total des alertes | Le bruit. | 80 % ou plus : un vrai problème, les analystes perdent en vigilance. Se corrige en affinant les règles (*False Positive Remediation*). |
| AER | alertes escaladées / total des alertes | L'expérience et l'autonomie des L1. | Sous 50 %, idéalement sous 20 %. |
| TDR | menaces détectées / total des menaces | La fiabilité du SOC. | Toujours 100 % : une menace ratée peut finir en rançongiciel. |

## Délais et SLA

Le SLA (*Service Level Agreement*) fixe les délais, entre le SOC et la direction, ou entre un SOC externalisé (MSSP) et ses clients. Les trois délais se suivent sur la chronologie d'une attaque :

| Délai | Mesure | SLA courant |
| --- | --- | --- |
| MTTD | Entre l'attaque et sa détection par les outils. | 5 min |
| MTTA | Avant qu'un L1 ne prenne en charge la nouvelle alerte. | 10 min |
| MTTR | Entre la réception de l'alerte et l'arrêt de l'intrusion. Inclut le MTTA. | 60 min |

Disponibilité du SOC : 24/7, ou 8/5 (du lundi au vendredi).

## Améliorer les métriques

| Symptôme | Pistes |
| --- | --- |
| FPR > 80 % | Exclure des règles les activités de confiance (mises à jour système). Automatiser le triage des alertes courantes (SOAR, scripts). |
| MTTD > 30 min | Faire exécuter les règles plus vite ou plus souvent. Vérifier que les journaux arrivent en temps réel dans le SIEM. |
| MTTA > 30 min | Notifier les analystes en temps réel. Répartir la file entre les analystes de la garde. |
| MTTR > 4 h | Côté L1, escalader vite. Documenter quoi faire par scénario d'attaque : [playbooks](reponse-a-incident.md#playbooks-et-runbooks). |
