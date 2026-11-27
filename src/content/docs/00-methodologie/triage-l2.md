---
title: "Triage L2"
description: "Reprendre une alerte escaladée : analyse approfondie des journaux, vérification de l'activité, réponse, clôture du cas et leçons à en tirer."
tags: [triage, soc-l2, réponse-à-incident, timeline, threat-hunting]
updated: 2026-11-27
draft: false
order: 4
---

Le L2 démarre sur un incident signalé : le plus souvent une alerte [escaladée](rapport-et-escalade.md) par le L1, parfois une demande directe et urgente du management ou d'un client MSSP. Ensuite, le même enchaînement à chaque cas :

:::etapes
1. **Analyser**
   Relire l'alerte et sa règle, le commentaire du L1, puis les journaux si nécessaire.
2. **Répondre**
   Vérifier l'activité, rendre le verdict, traiter la menace ou améliorer la règle.
3. **Clôturer**
   Résoudre formellement le cas.
4. **Tirer les leçons**
   Puis passer au cas suivant.
:::

## L1 et L2

Le L1 vise la **rapidité** du triage, le L2 sa **qualité**. Le SLA s'applique toujours, mais un verdict juste et la bonne réponse comptent davantage : le L1 escalade en 10 minutes, le L2 peut passer 2 heures de plus à enquêter, à se coordonner avec les autres équipes et à neutraliser l'attaque.

| Aspect | L1 | L2 |
| --- | --- | --- |
| Déclencheur | Nouvelle alerte | Alerte escaladée |
| SLA | MTTA, MTTR ([métriques](metriques-soc.md)) | Les mêmes |
| Priorité | Trier vite, dans le SLA | Analyse approfondie des journaux et réponse |
| Outils | Surtout le ticketing et le SIEM | Un éventail plus large d'outils SOC et IT |
| Réponse | Basique : mettre en quarantaine un téléchargement malveillant, valider un playbook SOAR | Avancée : nettoyer un malware à la main, désactiver des comptes, isoler des machines |

Le rôle varie selon l'organisation. Dans une grande entreprise ou un MSSP, un L3 et des équipes DFIR et CTI dédiées reprennent une partie du travail. Dans une petite structure, le L2 couvre toute l'investigation.

## Avant d'analyser

- **Comprendre la règle avant de trier** : savoir quelle technique elle vise à détecter.
- **Un seul cas à la fois**, sauf si l'un attend une action du client.
- **Tenir le SLA** : si l'analyse prend trop de temps, contenir la menace, puis continuer l'enquête.

## Analyser les journaux

Les détails de l'alerte et le commentaire du L1 suffisent parfois au verdict, mais en général il faut une investigation complète.

### Voir ce qui s'est passé

Avant l'analyse détaillée, se faire une idée d'ensemble : une « histoire » du cas. Pour une alerte *Rundll32 lancé par PowerShell*, les premières requêtes dans le SIEM répondent à :

:::etapes
1. **Pourquoi la règle s'est-elle déclenchée ?**
   Comprendre l'alerte elle-même.
2. **Qu'a fait Rundll32 ensuite ?**
   L'activité qui suit.
3. **Qu'est-ce qui a lancé PowerShell ?**
   L'activité qui précède, en remontant jusqu'à l'origine.
4. **Est-ce que ça ressemble à une attaque connue ?**
   Par exemple, une activité de Rundll32 qui évoque un infostealer, et un PowerShell lancé par une application inconnue.
:::

### Construire une timeline détaillée

L'histoire résume l'incident mais ne révèle pas tous les indicateurs : pour ne pas manquer une porte dérobée, il faut une timeline. Dans l'exemple, on reprend l'activité processus, fichiers et réseau de l'application inconnue, puis de Rundll32 et de ses enfants, jusqu'à avoir la liste complète des indicateurs.

Une requête Splunk sur les événements Sysmon clés de l'application suffit : elle fait ressortir une connexion suspecte suivie du dépôt et de l'exécution d'une DLL. Cela confirme que l'application est compromise ou qu'elle est elle-même un malware. Les indicateurs relevés (la DLL, le domaine, l'IP) serviront aux triages suivants.

### La boucle de threat hunting

Un cas simple se règle avec une seule timeline. Mais il reste souvent des questions : demander à l'IT ce qu'est l'application, qui l'a installée, comment cet utilisateur est arrivé sur le réseau, si sa machine est infectée… L'analyse devient alors une boucle :

:::etapes
1. **Former une histoire**
   Une hypothèse, à partir des détails de l'alerte.
2. **Construire la timeline**
   Les événements qui comblent les trous de l'histoire.
3. **Relire l'histoire**
   Est-elle claire du début à la fin ?
4. **Sinon, recommencer**
   Élargir ou modifier l'histoire, et reprendre à l'étape 1.
:::

## Vérifier l'activité

Certaines activités ne peuvent être confirmées que par la personne concernée. Une connexion au compte Microsoft d'un utilisateur via un VPN, suivie d'actions qui semblent légitimes : seul l'utilisateur peut dire « oui, c'était moi ». On le contacte directement ; si le risque est élevé et qu'il ne répond pas, on **désactive le compte** en attendant, et on contacte son responsable.

Autres vérifications courantes :

- demander à l'IT à quoi sert un outil inconnu ;
- faire confirmer par le support la création d'un compte administrateur ;
- demander aux DevOps d'expliquer un appel d'API suspect venant de leur script ;
- demander à la red team si une intrusion est réelle ou si c'est un test d'intrusion.

:::piege
Une activité clairement malveillante sur un poste, un test d'intrusion en cours, et la red team ne répond pas : on **isole le poste** sans attendre sa confirmation.
:::

## Répondre

Toute menace demande une réponse, parfois appliquée automatiquement par l'EDR ou une autre protection. Idéalement, on répond une fois l'enquête terminée et le verdict rendu ; en pratique, c'est plus nuancé.

### Vrais positifs

Pour une infection localisée (un adware sur le portable d'un employé), une mise en quarantaine du fichier par l'EDR suffit. Pour une intrusion étendue : accéder aux machines en RDP ou SSH, désactiver des comptes dans Entra ID (réinitialiser le mot de passe, révoquer les sessions), isoler des sous-réseaux, appliquer des correctifs…

### Incidents majeurs

Quand chaque seconde compte, on contient la menace **avant** la fin de l'enquête : une exfiltration en cours s'arrête d'abord, on cherche comment elle a commencé ensuite. La réponse se découpe en trois temps, appliqués à des moments différents ; lors d'une grosse intrusion, on fait des allers-retours entre eux. Voir [Réponse à incident](reponse-a-incident.md#cadres-sans-et-nist).

| Temps | Ce qu'on y fait |
| --- | --- |
| Confinement | Empêcher la menace de s'étendre : isoler des machines, désactiver des comptes. |
| Éradication | Nettoyer les fichiers malveillants, changer les mots de passe volés, retirer des privilèges. |
| Rétablissement | Lever le confinement, corriger les vulnérabilités, surveiller les traces de réinfection. |

### Faux positifs

Un faux positif peut aussi demander une réponse, moins urgente.

| Nom | Situation | Réponse du L2 |
| --- | --- | --- |
| *False Positive Tuning* | La règle s'est déclenchée sur une activité sans rapport, à cause d'un défaut de sa requête. | Prévoir la correction de la règle ou signaler le problème à l'équipe d'ingénierie. |
| *Security Hardening* | Faux positif, mais l'alerte a révélé un serveur avec un RDP exposé sur Internet. | Avec l'IT, placer l'accès RDP derrière un VPN. |
| *Team Improvement* | Alerte simple, mais l'analyse du L1 était incomplète ou fausse. | Expliquer les erreurs au L1, ou prévoir un temps de mentorat. |

## Clôturer le cas

Un cas se résout une fois le verdict rendu et la menace entièrement neutralisée. Les formalités varient selon l'entreprise, mais trois bonnes pratiques valent partout :

- **garder une trace** de ses actions dans un outil centralisé (le ticketing, par exemple) ;
- **informer l'équipe SOC** de l'incident, surtout s'il est d'un type nouveau ;
- **tenir les autres parties informées**, en particulier les clients MSSP (rapport de synthèse, voir [Rapports L2](rapports-l2.md)).

## Tirer les leçons

Formellement, le travail s'arrête à la clôture. Mais on gagne à se demander ce qui a bien marché et ce qui peut s'améliorer :

- la règle a produit un faux positif : planifier la correction, voire la faire le jour même ;
- une procédure a semblé inutile : en parler à la réunion d'équipe ;
- l'attaque était nouvelle : se renseigner dessus.
