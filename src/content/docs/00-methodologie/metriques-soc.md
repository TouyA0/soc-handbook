---
title: "Métriques SOC"
description: "Les métriques qui mesurent un SOC (volume d'alertes, taux de faux positifs, d'escalade, de détection, MTTD, MTTA, MTTR), leurs repères et comment les améliorer."
tags: [métriques, sla, mttd, mttr, soc-l1]
updated: 2026-11-12
draft: false
order: 5
---

Le but d'un SOC est de protéger la confidentialité, l'intégrité et la disponibilité des actifs numériques de l'organisation. Il y parvient en créant, recevant et triant des alertes ; le rôle du L1 dans cette chaîne est de remonter de façon fiable les vrais positifs au L2. Les métriques mesurent si ce travail est bien fait.

Pour le L1, elles comptent doublement : elles rendent le SOC plus efficace, donc les attaques moins efficaces, et elles servent souvent à évaluer l'analyste. De bons résultats ouvrent la voie vers un poste de L2.

Les définitions et les formules varient d'une équipe à l'autre selon ce qu'elle veut mesurer : les repères ci-dessous sont des ordres de grandeur courants.

## Métriques d'alertes

| Sigle | Formule | Ce qu'elle mesure | Repère |
| --- | --- | --- | --- |
| AC | nombre total d'alertes reçues | La charge des analystes. | 5 à 30 alertes par jour et par L1 |
| FPR | faux positifs / total des alertes | Le niveau de bruit. | sous 80 % |
| AER | alertes escaladées / total des alertes | L'expérience des L1. | sous 50 %, idéalement sous 20 % |
| TDR | menaces détectées / total des menaces | La fiabilité du SOC. | 100 % |

### AC — Alerts Count

Trop d'alertes noie les vraies menaces : 80 alertes en attente au début d'une garde, c'est la garantie d'en rater. Mais trop peu est aussi suspect : une semaine sans alerte peut signaler un problème dans le SIEM ou un manque de visibilité, donc des intrusions non détectées. La bonne valeur dépend de la taille de l'entreprise.

### FPR — False Positive Rate

Si 75 alertes sur 80 (94 %) sont des faux positifs (bruit système, activité IT normale), les analystes perdent en vigilance et finissent par traiter chaque alerte comme « encore du spam ». 0 % est inatteignable ; 80 % ou plus est un vrai problème, qui se corrige en affinant les outils et les règles de détection (*False Positive Remediation*).

### AER — Alert Escalation Rate

Le L2 compte sur le L1 pour filtrer le bruit et n'[escalader](rapport-et-escalade.md#quand-escalader) que les alertes menaçantes qui demandent une action. Mais un L1 ne doit pas non plus trier seul, par excès de confiance, une alerte qu'il ne comprend pas. Ce taux montre à quel point les L1 sont expérimentés et autonomes.

### TDR — Threat Detection Rate

Sur six attaques dans l'année, le SOC en détecte et en bloque quatre ; il rate la cinquième à cause d'une règle de détection cassée, la sixième parce qu'un L1 l'a classée à tort en faux positif. TDR = 4 / 6 = 67 % : un très mauvais résultat. L'objectif est **toujours 100 %**, car une seule menace ratée peut finir en rançongiciel ou en exfiltration de données.

## Délais et SLA

Une alerte n'arrête pas une attaque à elle seule : il faut la recevoir, la trier et réagir avant que l'attaquant n'atteigne son but. Les exigences de rapidité sont regroupées dans un **SLA** (*Service Level Agreement*), signé entre le SOC interne et la direction, ou entre un SOC externalisé (MSSP) et ses clients.

Sur la chronologie d'une attaque, les trois délais se suivent :

:::etapes
1. **MTTD — Mean Time to Detect**
   Délai moyen entre l'attaque et sa détection par les outils du SOC.
2. **MTTA — Mean Time to Acknowledge**
   Délai moyen avant qu'un L1 ne [prenne en charge](triage-des-alertes.md#prise-en-charge) la nouvelle alerte.
3. **MTTR — Mean Time to Respond**
   Délai moyen entre la réception de l'alerte par le SOC et l'arrêt de l'intrusion (isoler l'appareil, sécuriser le compte compromis). Il **inclut** le MTTA.
:::

| Engagement | SLA courant |
| --- | --- |
| Disponibilité | 24/7 ; souvent aussi 8/5, du lundi au vendredi |
| MTTD | 5 minutes |
| MTTA | 10 minutes |
| MTTR | 60 minutes |

## Améliorer les métriques

| Symptôme | Ce que ça veut dire | Pistes |
| --- | --- | --- |
| FPR > 80 % | Trop de bruit dans les alertes. | Exclure des règles de l'EDR ou du SIEM les activités de confiance, comme les mises à jour système. Automatiser le triage des alertes les plus courantes avec un SOAR ou des scripts. |
| MTTD > 30 min | Les menaces sont détectées trop tard. | Demander aux ingénieurs SOC d'accélérer les règles de détection ou de les exécuter plus souvent. Vérifier que les journaux arrivent dans le SIEM en temps réel, pas avec 10 minutes de retard. |
| MTTA > 30 min | Les L1 commencent le triage trop tard. | S'assurer que les analystes sont notifiés en temps réel des nouvelles alertes. Répartir équitablement la file entre les analystes de la garde. |
| MTTR > 4 h | Le SOC n'arrête pas l'intrusion à temps. | Côté L1, tout faire pour escalader vite les menaces au L2. Documenter quoi faire selon les scénarios d'attaque : [playbooks](reponse-a-incident.md#playbooks-et-runbooks). |
