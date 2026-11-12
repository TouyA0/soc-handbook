---
title: "Rapport et escalade"
description: "Documenter une alerte selon les 5 W, savoir quand et comment l'escalader au L2, et réagir dans les situations de communication délicates."
tags: [alertes, rapport, escalade, communication, soc-l1]
updated: 2026-11-12
draft: false
order: 3
---

Une fois le [triage](triage-des-alertes.md) terminé, l'alerte ne s'arrête pas forcément au L1. Ordre de grandeur : sur cent alertes reçues par le L1, la plupart sont clôturées en faux positif ou réglées à son niveau, une dizaine de vrais positifs partent au L2, qui traite la plupart des intrusions, et environ une seule finit en incident confié à l'équipe DFIR.

Pour faire passer une alerte au niveau suivant, trois gestes :

| Geste | En quoi il consiste |
| --- | --- |
| Rapport | Documenter l'investigation en détail, preuves comprises, au lieu d'un simple commentaire. Selon les standards de l'équipe et la sévérité ; indispensable pour un vrai positif à escalader. |
| Escalade | Confier au L2, selon la procédure convenue, un vrai positif qui demande des actions ou une analyse plus poussée. |
| Communication | Échanger avec d'autres services pendant ou après l'analyse : demander à l'IT s'il confirme avoir donné des droits d'administration à un utilisateur, à la RH des informations sur un nouvel arrivant. |

## Pourquoi rédiger un rapport

| Raison | Explication |
| --- | --- |
| Contexte | Le L2 comprend vite ce qui s'est passé et ne repart pas de zéro : un bon rapport lui fait gagner beaucoup de temps. |
| Trace | Les journaux bruts du SIEM sont conservés de 3 à 12 mois, les alertes indéfiniment. Mieux vaut que tout le contexte soit dans l'alerte. |
| Compétence | Si on ne sait pas l'expliquer simplement, c'est qu'on ne l'a pas assez bien compris. Résumer une alerte entraîne à enquêter. |

## Structure : les 5 W

Écrire pour celui qui lira le rapport sans avoir vu l'alerte : un L2, un membre de l'équipe DFIR, un administrateur IT. Le rapport répond au minimum à cinq questions :

| Question | Ce qu'on y met |
| --- | --- |
| Who | L'utilisateur qui se connecte, lance la commande ou télécharge le fichier. |
| What | L'action ou la suite d'événements exacte. |
| When | Le début et la fin précis de l'activité suspecte. |
| Where | L'appareil, l'IP ou le site concerné. |
| Why | **La plus importante** : le raisonnement qui justifie le verdict. |

```text title="trame de rapport à remplir"
Who   :
What  :
When  : début —            fin —
Where :
Why   : verdict (vrai / faux positif) et raisonnement
```

## Quand escalader

Les règles varient selon les équipes, mais on escalade en général quand :

- l'alerte indique une **attaque d'ampleur** qui demande une investigation approfondie ou l'intervention de l'équipe DFIR ;
- des **actions de remédiation** sont nécessaires : suppression d'un malware, isolement d'un hôte, réinitialisation d'un mot de passe ;
- il faut **communiquer avec l'extérieur** du SOC : clients, partenaires, direction ou forces de l'ordre ;
- on **ne comprend pas entièrement** l'alerte et on a besoin de l'aide d'un analyste plus expérimenté.

Le dernier cas est normal, surtout les premiers mois : mieux vaut discuter de l'alerte et clarifier la procédure que clôturer à l'aveugle une alerte qu'on ne comprend pas.

## Escalader une alerte

:::etapes
1. **Analyser**
   Passer l'alerte « en cours » et mener l'investigation.
2. **Rapporter et conclure**
   Rédiger le rapport et fixer le verdict, par exemple vrai positif.
3. **Réassigner**
   Si l'escalade s'impose, assigner l'alerte au L2 de permanence, puis le prévenir sur la messagerie de l'entreprise ou de vive voix. Certaines équipes exigent plutôt une demande d'escalade formelle, avec de nombreux champs à remplir.
4. **Rester disponible**
   Le L2 reçoit une notification, part du rapport et revient vers le L1 s'il a des questions.
:::

Ensuite, le L2 approfondit l'alerte, confirme qu'il s'agit bien d'un vrai positif, contacte les autres services si besoin et, pour un incident majeur, lance la procédure formelle de [réponse à incident](reponse-a-incident.md).

## Situations délicates

L'idéal est que le SOC ait ses propres procédures de communication de crise. Sans elles, les réflexes à avoir :

- **Alerte critique urgente à escalader, mais le L2 ne répond pas depuis 30 minutes.**
  Savoir où trouver les contacts d'urgence. Appeler le L2, puis le L3, puis le manager.
- **Compromission d'un compte Slack / Teams : il faut faire confirmer la connexion par l'utilisateur.**
  Ne pas le contacter par la messagerie compromise : passer par un autre canal, un appel téléphonique par exemple.
- **Afflux d'alertes en peu de temps, dont certaines critiques.**
  Prioriser selon la [méthode habituelle](triage-des-alertes.md#choisir-lalerte-à-traiter) et prévenir le L2 de permanence de la situation.
- **Quelques jours plus tard, on se rend compte qu'on a mal classé une alerte et sans doute raté une action malveillante.**
  Prévenir le L2 immédiatement en expliquant ses doutes : un attaquant peut rester silencieux des semaines avant de passer à l'action.
- **Impossible de finir le triage : les journaux du SIEM sont mal parsés ou introuvables.**
  Ne pas ignorer l'alerte : analyser ce qui est possible, puis signaler le problème au L2 de permanence ou à un ingénieur SOC.
