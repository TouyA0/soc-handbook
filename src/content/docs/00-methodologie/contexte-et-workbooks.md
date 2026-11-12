---
title: "Contexte et workbooks"
description: "Inventaires d'identités et d'actifs, schéma réseau et workbooks : de quoi donner du sens à une alerte et l'investiguer sans sauter d'étape."
tags: [alertes, triage, inventaire, active-directory, workbook, soc-l1]
updated: 2026-11-12
draft: false
order: 2
---

Une alerte seule dit rarement si l'activité est normale. Exemple : *G.Baker s'est connecté au serveur HQ-FINFS-02, y a téléchargé « Financial Report US 2024.xlsx » et l'a partagé avec R.Lund.* Pour trancher, il faut savoir :

- qui est G.Baker : son rôle, ses horaires de travail ;
- à quoi sert HQ-FINFS-02, où il se trouve et qui peut y accéder ;
- pourquoi R.Lund aurait besoin des données financières de l'entreprise.

Ce contexte vient de trois références : l'inventaire des identités pour les personnes, l'inventaire des actifs pour les machines, le schéma réseau pour les adresses IP. Le workbook, lui, fixe l'ordre des vérifications pendant l'[investigation](triage-des-alertes.md#investigation).

## Inventaire des identités

Catalogue des employés (comptes utilisateurs) et des services (comptes machines) avec leurs détails : privilèges, contacts, rôle dans l'entreprise. Il répond aux questions sur G.Baker et R.Lund.

| Source | Exemples | Ce qu'elle apporte |
| --- | --- | --- |
| Active Directory | AD on-premise, Entra ID | L'AD est en soi une base d'identités, très utilisée par les SOC. |
| Fournisseur SSO | Okta, Google Workspace | Alternative cloud à l'AD : pratique pour gérer et rechercher les utilisateurs. |
| SIRH | BambooHR, SAP, HiBob | Limité aux employés, mais avec des données complètes sur chacun. |
| Solution maison | Fichiers CSV ou Excel | Courant : les équipes IT ou sécurité tiennent souvent leur propre liste. |

## Inventaire des actifs

Liste des ressources informatiques de l'organisation, aussi appelée *asset lookup*. « Actif » peut désigner un logiciel, un matériel ou même un employé ; ici, il s'agit des serveurs et des postes de travail. Il répond aux questions sur HQ-FINFS-02.

| Source | Exemples | Ce qu'elle apporte |
| --- | --- | --- |
| Active Directory | AD on-premise, Entra ID | Aussi une bonne base d'inventaire des actifs, pas seulement des identités. |
| SIEM ou EDR | Elastic, CrowdStrike | Certains agents collectent des informations sur les hôtes surveillés. |
| MDM | Microsoft Intune, Jamf | Catégorie d'outils faite pour lister et gérer les actifs. |
| Solution maison | Fichiers CSV ou Excel | Comme pour les identités, très courant. |

## Schéma réseau

Représentation des sites, des sous-réseaux et de leurs connexions. Surtout utile dans les grandes entreprises, quand une alerte ne montre que des adresses IP : il permet de savoir à quoi correspond chaque IP et si un flux entre deux sous-réseaux a un sens.

Exemple : une chaîne d'alertes issues des journaux du pare-feu.

:::timeline
| Heure | Événement | Source |
| --- | --- | --- |
| 08:00 | L'IP externe `103.61.240.174` se connecte de façon répétée au pare-feu sur le port TCP/10443. | pare-feu |
| 08:23 | Cette IP est traduite en IP interne `10.10.0.53`. | pare-feu (NAT) |
| 08:25 | `10.10.0.53` scanne `172.16.15.0/24`, sans trouver de port ouvert. | pare-feu |
| 08:32 | La même IP scanne `172.16.23.0/24` : l'attaque est en cours. | pare-feu |

:::

Les journaux seuls ne disent ni quel service écoute sur le port 10443, ni à quel sous-réseau appartient `10.10.0.53`. Avec le schéma réseau, le chemin d'attaque se reconstitue :

:::etapes
1. **Brute force du VPN**
   Le port 10443 est celui du VPN de l'entreprise : l'IP externe tente des connexions en boucle.
2. **Connexion VPN réussie**
   Après le brute force, l'attaquant reçoit une adresse du sous-réseau VPN (`10.10.0.53`).
3. **Scan du sous-réseau des bases de données**
   `172.16.15.0/24` ; aucun port ouvert, l'attaquant est probablement bloqué par les règles du pare-feu.
4. **Bascule vers le sous-réseau des bureaux**
   `172.16.23.0/24`, à la recherche d'une nouvelle cible.
:::

## Workbooks

Document structuré qui définit les étapes pour investiguer et traiter un type de menace précis, de manière efficace et toujours identique. On dit aussi *playbook*, *runbook* ou *workflow*. Côté réponse à incident, on distingue souvent le [playbook et le runbook](reponse-a-incident.md#playbooks-et-runbooks).

Les analystes seniors les rédigent pour les L1, dont on n'attend pas qu'ils sachent trier parfaitement tous les scénarios d'attaque. Suivre le workbook est recommandé, parfois obligatoire : on évite les erreurs, on va plus vite, et aucun verdict n'est rendu sans assez de preuves.

Un workbook prend souvent la forme d'un diagramme, accompagné d'un guide détaillé et des liens vers les ressources citées. Celui d'une alerte de connexion inhabituelle (messagerie, web ou VPN de l'entreprise) se découpe en trois blocs, à suivre dans l'ordre :

:::etapes
1. **Enrichissement**
   Threat intelligence et inventaire des identités : rassembler les informations sur l'utilisateur concerné.
2. **Investigation**
   Avec ces données et les journaux du SIEM, décider si la connexion était attendue.
3. **Escalade**
   Si besoin, [escalader](rapport-et-escalade.md#quand-escalader) au L2 ou faire confirmer la connexion par l'utilisateur.
:::

Le niveau de détail varie selon les équipes. Certaines ont des centaines de workbooks, un par règle de détection, proches d'un playbook d'automatisation SOAR. D'autres n'en écrivent que quelques-uns, généraux, pour les attaques les plus courantes, et comptent davantage sur le jugement du L1. Dans tous les cas, un L1 doit savoir découper son investigation en blocs réutilisables et en tirer un workbook simple.
