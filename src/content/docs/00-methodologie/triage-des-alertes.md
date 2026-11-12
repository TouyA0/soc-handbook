---
title: "Triage des alertes"
description: "D'où vient une alerte, comment la lire, laquelle traiter en premier et comment la mener jusqu'au verdict."
tags: [alertes, triage, siem, soc-l1]
updated: 2026-11-12
draft: false
order: 1
---

Un SOC reçoit chaque jour des millions de journaux venant de milliers de systèmes. La plupart décrivent une activité normale ; l'alerte sert à faire remonter les rares événements qui méritent l'attention d'un analyste. Le triage, c'est le travail qui consiste à examiner une alerte pour décider si elle correspond à une vraie menace.

On parle aussi de *alert handling*, *alert processing*, *alert investigation* ou *alert analysis* : c'est la même activité.

## De l'événement à l'alerte

Une alerte est l'aboutissement d'une chaîne :

:::etapes
1. **Un événement se produit**
   Connexion d'un utilisateur, lancement d'un processus, téléchargement d'un fichier…
2. **Le système le journalise**
   Le système d'exploitation, un pare-feu, un fournisseur cloud écrit l'événement dans ses journaux.
3. **Les journaux sont envoyés à une solution de sécurité**
   SIEM ou EDR, qui centralise les journaux de tous les systèmes.
4. **Une règle de détection se déclenche**
   Quand un événement ou une suite d'événements précise correspond à la règle, la solution génère une alerte.
:::

Sans alerte, il faudrait relire les journaux bruts à la main ; avec, l'analyste n'en trie que quelques dizaines par jour.

## Où on gère les alertes

| Solution | Exemples | Usage |
| --- | --- | --- |
| SIEM | Splunk ES, Elastic | Bonne gestion des alertes : le choix le plus courant pour un SOC. |
| EDR / NDR | Microsoft Defender, CrowdStrike | Ont leur propre tableau d'alertes, mais on préfère les centraliser dans le SIEM ou le SOAR. |
| SOAR | Splunk SOAR, Cortex SOAR | Les grandes équipes l'utilisent pour agréger et centraliser les alertes de plusieurs solutions. |
| ITSM | Jira, TheHive | Certaines équipes gèrent les alertes comme des tickets, dans un outil dédié. |

## Qui fait quoi

Tout le SOC participe au triage, mais pas au même niveau :

| Rôle | Dans le triage |
| --- | --- |
| Analyste L1 | Première ligne. Examine les alertes, distingue le malveillant du légitime et prévient le L2 en cas de vraie menace. |
| Analyste L2 | Reçoit les alertes escaladées par le L1, mène l'analyse approfondie et la remédiation. |
| Ingénieur SOC | Veille à ce que les alertes contiennent assez d'informations pour être triées efficacement. |
| Manager SOC | Suit la rapidité et la qualité du triage ([métriques](metriques-soc.md)) pour qu'aucune vraie attaque ne passe à travers. |

Un L1 peut recevoir de zéro à une centaine d'alertes par jour, et chacune peut révéler une attaque.

## Lire une alerte

Les noms changent d'un SIEM à l'autre, mais on retrouve toujours les mêmes propriétés :

| Propriété | Ce qu'elle indique |
| --- | --- |
| Heure | Heure de création de l'alerte. Elle se déclenche en général **quelques minutes après** l'événement réel (alerte à 15:35 pour un événement à 15:32) : c'est l'heure de l'événement qui compte pour l'enquête. |
| Nom | Résume ce qui s'est passé, d'après le nom de la règle de détection : *Unusual Login Location*, *Email Marked as Phishing*, *Windows RDP Bruteforce*, *Potential Data Exfiltration*… |
| Sévérité | Urgence de l'alerte : faible / informative, moyenne, haute, critique. Fixée au départ par les détection engineers, l'analyste peut la modifier si besoin. |
| Statut | Indique si quelqu'un travaille dessus : nouvelle / non assignée, en cours, clôturée / résolue. Les équipes ajoutent souvent leurs propres statuts. |
| Verdict | Aussi appelé classification : **vrai positif** (menace réelle) ou **faux positif** (pas de menace), plus d'éventuels verdicts propres à l'équipe. |
| Assigné | L'analyste qui a reçu ou pris l'alerte (on dit aussi *owner*). Il en porte la responsabilité. |
| Description | Ce que fait la règle, pourquoi cette activité peut indiquer une attaque et, parfois, comment trier l'alerte. |
| Champs | Les valeurs qui ont déclenché l'alerte (nom d'hôte touché, ligne de commande saisie…) et les commentaires des analystes. |

## Choisir l'alerte à traiter

Avec une file de plusieurs centaines d'alertes, l'ordre de traitement compte : c'est la priorisation. Chaque équipe fixe ses règles et les automatise en général par le tri du SIEM ou de l'EDR. L'approche la plus simple et la plus répandue :

:::etapes
1. **Filtrer**
   Ne garder que les alertes nouvelles, non résolues et que personne n'a déjà prises, pour ne pas marcher sur le travail d'un collègue.
2. **Trier par sévérité**
   Critique, puis haute, moyenne et enfin faible : les règles sont conçues pour qu'une alerte critique ait beaucoup plus de chances d'être une vraie menace, avec un impact bien plus fort.
3. **Trier par ancienneté**
   La plus ancienne d'abord. Si deux alertes révèlent deux intrusions, l'attaquant de la plus ancienne est sans doute déjà en train d'exfiltrer des données, alors que le nouveau en est encore à la reconnaissance.
:::

## Traiter l'alerte

### Prise en charge

:::etapes
1. **S'assigner l'alerte**
   Pour en prendre la responsabilité et éviter qu'un autre analyste la traite en parallèle.
2. **La passer « en cours »**
   Les autres voient qu'elle est prise.
3. **Lire ses détails**
   Nom, description et indicateurs clés, avant de commencer l'enquête.
:::

### Investigation

L'étape la plus technique : comprendre l'activité et juger de sa légitimité dans les journaux du SIEM ou de l'EDR. Certaines équipes rédigent des [*workbooks*](contexte-et-workbooks.md#workbooks) (aussi appelés playbooks ou runbooks) qui expliquent comment enquêter sur chaque catégorie d'alerte. Sans workbook :

:::etapes
1. **Qui est visé**
   L'utilisateur, l'hôte, le compte cloud, le réseau ou le site concerné. Le contexte se trouve dans les [inventaires et le schéma réseau](contexte-et-workbooks.md).
2. **Quelle action**
   Ce que décrit l'alerte : connexion suspecte, malware, phishing…
3. **Ce qui s'est passé autour**
   Les événements juste avant et juste après l'alerte, à la recherche d'autres actions suspectes.
4. **Vérifier ses hypothèses**
   Avec des plateformes de threat intelligence ou toute autre ressource disponible.
:::

### Clôture

:::etapes
1. **Rendre un verdict**
   Vrai positif ou faux positif. C'est ici qu'on trouve ou qu'on rate l'attaque.
2. **Commenter**
   Un commentaire détaillé qui explique les étapes de l'analyse et ce qui justifie le verdict.
3. **Clôturer**
   Revenir au tableau de bord et passer l'alerte au statut « clôturée ».
:::

La suite (rédiger le rapport, décider d'escalader au L2) est détaillée dans [Rapport et escalade](rapport-et-escalade.md).
