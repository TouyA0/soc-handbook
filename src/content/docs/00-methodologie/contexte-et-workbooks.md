---
title: "Contexte et workbooks"
description: "Où trouver le contexte d'un utilisateur, d'une machine ou d'une IP, et suivre un workbook pour ne sauter aucune étape."
tags: [alertes, triage, inventaire, active-directory, workbook, soc-l1]
updated: 2026-11-18
draft: false
order: 2
---

Une alerte seule dit rarement si l'activité est normale. *G.Baker télécharge « Financial Report US 2024.xlsx » sur le serveur HQ-FINFS-02 et le partage avec R.Lund* : pour trancher, il faut savoir qui sont ces personnes, à quoi sert ce serveur, et si cet échange a un sens.

## Où chercher le contexte

| Question | Où chercher |
| --- | --- |
| Qui est cet utilisateur ? | **Inventaire des identités** : comptes utilisateurs et machines, privilèges, contacts, rôle. Sources : Active Directory ou Entra ID, fournisseur SSO (Okta, Google Workspace), SIRH (BambooHR, SAP, HiBob), fichiers CSV ou Excel de l'équipe. |
| À quoi sert cette machine ? | **Inventaire des actifs** (*asset lookup*) : serveurs et postes. Sources : Active Directory ou Entra ID, agents du SIEM ou de l'EDR (Elastic, CrowdStrike), MDM (Intune, Jamf), fichiers CSV ou Excel. |
| À quoi correspond cette IP ? | **Schéma réseau** : sites, sous-réseaux et leurs connexions. Dit à quel sous-réseau appartient une IP, quel service écoute sur un port, si un flux entre deux sous-réseaux a un sens. |

Exemple avec le schéma réseau : une IP externe se connecte en boucle au pare-feu sur le port 10443, est traduite en `10.10.0.53`, qui scanne `172.16.15.0/24` puis `172.16.23.0/24`. Le schéma montre que 10443 est le VPN, `10.10.0.53` le sous-réseau VPN, puis les bases de données et les bureaux : brute force du VPN réussi, puis recherche d'une cible à l'intérieur.

## Workbooks

Document qui fixe les étapes pour investiguer et traiter un type de menace, toujours de la même façon. On dit aussi *playbook*, *runbook* ou *workflow*. Les seniors les rédigent pour les L1 ; les suivre est recommandé, parfois obligatoire : aucun verdict sans assez de preuves.

Exemple pour une alerte de connexion inhabituelle (messagerie, web, VPN) :

:::etapes
1. **Enrichissement**
   Threat intelligence et inventaire des identités : tout sur l'utilisateur concerné.
2. **Investigation**
   Avec ces données et les journaux du SIEM, décider si la connexion était attendue.
3. **Escalade**
   Si besoin, [escalader](rapport-et-escalade.md#quand-escalader) au L2 ou faire confirmer la connexion par l'utilisateur.
:::

Certaines équipes ont un workbook par règle de détection, d'autres seulement quelques-uns pour les attaques courantes. Un L1 doit savoir découper son investigation en blocs de ce type.
