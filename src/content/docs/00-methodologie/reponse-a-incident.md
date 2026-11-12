---
title: "Réponse à incident"
description: "De l'alerte à l'incident, les grands types d'incidents, les cadres SANS (PICERL) et NIST, le plan de réponse, les playbooks et les runbooks."
tags: [incident-response, sans, nist, playbook, soc-l1]
updated: 2026-11-12
draft: false
order: 4
---

Quand le [triage](triage-des-alertes.md) conclut à un vrai positif, l'alerte devient un **incident** : il ne s'agit plus seulement de qualifier une activité, mais d'y répondre de façon structurée.

| Verdict | Exemple |
| --- | --- |
| Faux positif | Alerte sur un gros volume de données envoyé d'un système vers une IP externe. L'analyse montre une sauvegarde vers un service de stockage cloud : rien de malveillant. |
| Vrai positif | Alerte sur une tentative de phishing visant un utilisateur. L'analyse confirme un email de phishing destiné à compromettre son poste : c'est un incident. |

Chaque incident reçoit ensuite une **sévérité** (faible, moyenne, haute, critique) selon l'impact qu'il peut avoir. Face à plusieurs incidents simultanés, on traite d'abord les critiques, puis les hauts, et ainsi de suite.

## Types d'incidents

« Piratage » est trop vague. On distingue plusieurs types d'incidents, qui peuvent survenir seuls ou ensemble chez une même victime :

| Type | Ce que c'est |
| --- | --- |
| Infection malware | Programme malveillant qui endommage un système, un réseau ou une application. La majorité des incidents. Arrive le plus souvent par un fichier : texte, document, exécutable… |
| Accès non autorisé | *Security breach* : une personne non autorisée accède à des données confidentielles, réservées au personnel habilité. |
| Fuite de données | Des informations confidentielles d'une personne ou d'une organisation sont exposées à des tiers. Souvent exploitée pour nuire à la réputation ou faire chanter la victime. Contrairement à l'accès non autorisé, elle peut être **involontaire** : erreur humaine, mauvaise configuration. |
| Menace interne | Attaque lancée volontairement par quelqu'un de l'organisation, par exemple un employé mécontent qui infecte le réseau avec une clé USB le jour de son départ. Dangereuse : un interne a plus d'accès qu'un attaquant extérieur. |
| Déni de service | DoS : l'attaquant inonde un système, un réseau ou une application de fausses requêtes jusqu'à épuiser ses ressources et le rendre indisponible pour les utilisateurs légitimes. Vise la **disponibilité**, un des trois piliers de la sécurité. |

On ne peut pas classer ces types par gravité dans l'absolu : l'impact dépend de l'organisation. Une entreprise dont les données n'intéressent personne souffrira peu d'une fuite, mais beaucoup d'un déni de service sur le site web dont dépend toute son activité.

## Cadres de réponse : SANS et NIST

Pour répondre à des incidents très différents avec la même rigueur, on s'appuie sur un cadre générique. Les deux plus utilisés viennent du SANS (formations et certifications) et du NIST (normes et guides), et se ressemblent beaucoup.

### SANS : PICERL

Six phases, dont les initiales donnent **PICERL** :

| Phase | Ce qu'on y fait | Exemple |
| --- | --- | --- |
| Preparation | Réunir les moyens de traiter un incident : équipe de réponse, plan de réponse, solutions de sécurité déployées. | Sensibiliser les employés aux emails de phishing. |
| Identification | Chercher les comportements anormaux qui peuvent signaler un incident, avec les outils de surveillance. | Un gros volume de données sort d'un hôte ; l'analyse montre qu'il a été compromis par une pièce jointe de phishing. |
| Containment | Confinement : limiter l'impact, en isolant la machine touchée ou en désactivant les comptes compromis. | L'hôte est isolé du réseau pour empêcher l'attaquant de rebondir vers d'autres systèmes. |
| Eradication | Supprimer la menace de l'environnement et s'assurer qu'il est sain avant de passer à la suite. | Analyse antimalware approfondie pour retirer le logiciel malveillant. |
| Recovery | Restaurer les systèmes touchés depuis une sauvegarde ou les reconstruire, puis les tester avant de les remettre en service. | L'hôte est reconfiguré et les données exfiltrées sont restaurées depuis la sauvegarde. |
| Lessons Learned | Retour d'expérience : identifier et documenter les manques de la détection et de l'analyse pour améliorer le processus. | Réunion post-incident sur la cause racine et les mesures pour éviter que ça se reproduise. |

### NIST : quatre phases

Le cadre du NIST (SP 800-61 rév. 2) reprend les mêmes étapes en quatre phases :

| SANS | NIST |
| --- | --- |
| Preparation | Preparation |
| Identification | Detection & Analysis |
| Containment, Eradication, Recovery | Containment, Eradication & Recovery |
| Lessons Learned | Post-Incident Activity |

:::piege
La révision 3 du SP 800-61, publiée en 2024, abandonne ce cycle en quatre phases et organise la réponse à incident selon les fonctions du NIST Cybersecurity Framework 2.0. Le cycle de la rév. 2 reste la référence la plus citée en formation.
:::

## Plan de réponse à incident

Chaque organisation tire de ces cadres son propre processus, décrit dans un document formel : l'*Incident Response Plan*. Validé par la direction, il fixe les procédures à suivre avant, pendant et après un incident. Il contient au moins :

- les rôles et responsabilités ;
- la méthodologie de réponse ;
- le plan de communication avec les parties prenantes, forces de l'ordre comprises ;
- le circuit d'[escalade](rapport-et-escalade.md) à suivre.

## Outils de détection

Repérer les incidents à la main est impossible : la phase d'identification (SANS) ou de détection et analyse (NIST) repose sur des outils, dont certains savent aussi agir sur les phases suivantes.

| Outil | Rôle |
| --- | --- |
| SIEM | Centralise les journaux importants et les corrèle pour identifier les incidents. |
| Antivirus | Détecte les programmes malveillants connus et analyse régulièrement le système. |
| EDR | Déployé sur chaque poste, protège contre des menaces plus avancées et peut aussi confiner et éradiquer la menace. |

## Playbooks et runbooks

Une fois l'incident identifié, il faut mesurer l'étendue de l'attaque, empêcher qu'elle s'aggrave et l'éliminer à la racine. Les étapes changent selon le type d'incident : des instructions écrites à l'avance font gagner beaucoup de temps.

| Document | Ce qu'il contient |
| --- | --- |
| Playbook | Les lignes directrices d'une réponse complète à un type d'incident. |
| Runbook | L'exécution détaillée, pas à pas, d'une étape précise ; varie selon les moyens disponibles pour l'investigation. |

Exemple de playbook pour un email de phishing :

:::etapes
1. **Prévenir**
   Informer toutes les parties prenantes de l'incident.
2. **Qualifier l'email**
   Analyser les en-têtes et le corps pour déterminer s'il est malveillant.
3. **Analyser les pièces jointes**
   Rechercher les pièces jointes et les analyser.
4. **Mesurer l'exposition**
   Déterminer si quelqu'un a ouvert les pièces jointes.
5. **Isoler**
   Couper du réseau les systèmes infectés.
6. **Bloquer**
   Bloquer l'expéditeur.
:::
