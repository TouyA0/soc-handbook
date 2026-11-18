---
title: "Rapport et escalade"
description: "Documenter une alerte selon les 5 W, savoir quand et comment l'escalader au L2, et réagir dans les situations délicates."
tags: [alertes, rapport, escalade, communication, soc-l1]
updated: 2026-11-18
draft: false
order: 3
---

La plupart des alertes sont clôturées en faux positif ou réglées par le L1. Les vrais positifs qui demandent plus partent au L2, avec un rapport. Le rapport sert au L2, qui ne repart pas de zéro, et à la trace : les journaux bruts du SIEM sont gardés de 3 à 12 mois, les alertes indéfiniment, donc tout le contexte doit être dans l'alerte.

## Rapport : les 5 W

Écrire pour quelqu'un qui n'a pas vu l'alerte (L2, DFIR, IT) :

| Question | Ce qu'on y met |
| --- | --- |
| Who | L'utilisateur qui se connecte, lance la commande ou télécharge le fichier. |
| What | L'action ou la suite d'événements exacte. |
| When | Le début et la fin précis de l'activité suspecte. |
| Where | L'appareil, l'IP ou le site concerné. |
| Why | **La plus importante** : le raisonnement qui justifie le verdict. |

```text title="trame de rapport"
Who   :
What  :
When  : début —            fin —
Where :
Why   : verdict (vrai / faux positif) et raisonnement
```

## Quand escalader

- L'alerte indique une **attaque d'ampleur** qui demande une investigation approfondie ou l'équipe DFIR.
- Des **actions de remédiation** sont nécessaires : supprimer un malware, isoler un hôte, réinitialiser un mot de passe.
- Il faut **communiquer hors du SOC** : clients, partenaires, direction, forces de l'ordre.
- On **ne comprend pas entièrement** l'alerte. C'est normal, surtout au début : mieux vaut demander que clôturer à l'aveugle.

## Escalader

:::etapes
1. **Analyser**
   Passer l'alerte « en cours » et mener l'investigation.
2. **Rapporter et conclure**
   Rédiger le rapport, fixer le verdict.
3. **Réassigner**
   Assigner l'alerte au L2 de permanence et le prévenir (messagerie, de vive voix), ou remplir la demande d'escalade formelle si l'équipe en a une.
4. **Rester disponible**
   Le L2 part du rapport et revient vers le L1 s'il a des questions. Pour un incident majeur, il lance la [réponse à incident](reponse-a-incident.md).
:::

Pendant ou après l'analyse, on peut aussi devoir **communiquer** avec d'autres services : demander à l'IT s'il a bien donné des droits d'administration à un utilisateur, à la RH des informations sur un nouvel arrivant.

## Situations délicates

- **Alerte critique, le L2 ne répond pas depuis 30 minutes** : contacts d'urgence. Appeler le L2, puis le L3, puis le manager.
- **Compte Slack / Teams compromis, connexion à faire confirmer** : ne pas contacter l'utilisateur par la messagerie compromise, l'appeler.
- **Afflux d'alertes, dont des critiques** : prioriser comme d'habitude et prévenir le L2 de permanence.
- **Alerte mal classée découverte des jours plus tard** : prévenir le L2 tout de suite. Un attaquant peut rester silencieux des semaines.
- **Journaux du SIEM mal parsés ou introuvables** : ne pas ignorer l'alerte. Analyser ce qui est possible, signaler le problème au L2 ou à un ingénieur SOC.
