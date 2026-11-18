---
title: "Force brute et pulvérisation de mots de passe"
description: "L'attaquant enchaîne les tentatives de connexion, sur un compte ou sur beaucoup de comptes, jusqu'à trouver un mot de passe valide."
tags: [windows, rdp, authentification, event-id]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1110
tactic: credential-access
severity: med
platforms: [Windows]
data_sources: [Journal Security, Sysmon]
related:
  - 03-menaces-detection/persistence/creation-de-compte
---

## Description

Un RDP exposé sur Internet (:attack[T1133]) est trouvé et attaqué par des botnets en quelques minutes : une heure après son ouverture, le journal Security se remplit de centaines de 4625 sur des comptes courants (`Administrator`, `admin`, `support`). Avec un mot de passe faible, la machine tombe en quelques jours, et un RDP compromis mène souvent à un rançongiciel. Un RDP peut aussi être compromis sans force brute, si l'attaquant connaît déjà le mot de passe.

- **Force brute** : beaucoup d'échecs sur un seul compte, en général `Administrator`.
- **Pulvérisation de mots de passe** : beaucoup de comptes différents essayés (`admin`, `helpdesk`, `cctv`).

## Ce qu'on observe

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4625 | **Échec de connexion**<br>Type 3 sur les systèmes récents (NLA activé par défaut), type 10 sur les systèmes anciens ou mal configurés sans NLA. |
| 4624 | **Connexion réussie**<br>Après les échecs : quel compte a servi à entrer. En RDP, type 10 ; avec NLA, il est précédé d'un 4624 de type 3. |

Signaux d'alerte :

- **Beaucoup de comptes différents** essayés : pulvérisation.
- **Beaucoup d'échecs sur un seul compte** : force brute.
- **Un nom de machine source hors du modèle de l'entreprise** : `kali` au lieu de `THM-PC-06`.
- **Une IP source inattendue** : IP externe, ou une imprimante qui se connecte à un serveur.

**Réseau :** sur FTP, les échecs se voient aussi dans la capture : réponses [`530`](../../02-outils/wireshark.md#ftp).

## Détection

### Observateur d'événements

:::etapes
1. **Repérer la force brute**
   Journal Security, Filter Current Log sur `4625`. Garder les types de connexion 3 et 10 (connexions à distance) et regarder l'IP source : des IP externes en rafale.
2. **Trouver l'entrée**
   Passer le filtre sur `4624` : la connexion réussie et le compte utilisé.
3. **Trouver la session de l'attaquant**
   Chercher les 4624 de type 10 : les connexions RDP. Le vrai nom de la machine source est dans le 4624 de type 3 qui précède. L'attaquant peut revenir en RDP des heures après la force brute.
4. **Suivre ce qu'il a fait**
   Copier le Logon ID de la connexion de type 10 et le chercher dans les journaux Security et Sysmon : [suivre une session](../../01-fondamentaux/journaux-windows.md#suivre-une-session).
:::

## Faux positifs

À compléter.

## Réponse

À compléter.
