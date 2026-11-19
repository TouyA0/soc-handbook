---
title: "Force brute et pulvérisation de mots de passe"
description: "L'attaquant enchaîne les tentatives de connexion, sur un compte ou sur beaucoup de comptes, jusqu'à trouver un mot de passe valide."
tags: [windows, linux, rdp, ssh, authentification, event-id]
updated: 2026-11-19
draft: false
type: technique
attack_id: T1110
tactic: credential-access
severity: med
platforms: [Windows, Linux]
data_sources: [Journal Security, Sysmon, auth.log]
related:
  - 03-menaces-detection/persistence/creation-de-compte
---

## Description

Un RDP exposé sur Internet (:attack[T1133]) est trouvé et attaqué par des botnets en quelques minutes : une heure après son ouverture, le journal Security se remplit de centaines de 4625 sur des comptes courants (`Administrator`, `admin`, `support`). Avec un mot de passe faible, la machine tombe en quelques jours, et un RDP compromis mène souvent à un rançongiciel. Un RDP peut aussi être compromis sans force brute, si l'attaquant connaît déjà le mot de passe.

Même chose sous Linux avec SSH, présent sur presque tous les serveurs exposés à Internet. Le scénario classique : accès SSH public, authentification par mot de passe autorisée, et un mot de passe faible sur un compte de support ; ce n'est qu'une question de temps. Avec l'authentification par clé, le risque est le vol de la clé (dépôt de code, serveur d'automatisation, poste d'administrateur infecté par un stealer).

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

**Linux (SSH) :** les tentatives sont dans `/var/log/auth.log`, une ligne par essai, avec le compte et l'IP source. Une compromission se lit comme une série de `Failed`, puis un `Accepted password` depuis une IP externe non fiable.

```text title="échecs SSH sur des comptes courants, depuis des IP externes"
2025-08-07T11:21:25 thm-vm sshd[3139]: Failed password for root from 222.124.17.227 port 50293 ssh2
2025-08-07T14:17:40 thm-vm sshd[3139]: Failed password for admin from 138.204.127.54 port 52670 ssh2
```

Pour juger une connexion SSH réussie, trois signaux : authentification **par mot de passe** plutôt que par clé, **IP externe**, **heure** inhabituelle pour l'utilisateur.

```text title="trois connexions réussies : laquelle est suspecte ?"
2025-08-19T14:00:02 thm-vm sshd[1013]: Accepted publickey for ansible from 10.14.105.255 port 18442 ssh2: [...]
2025-08-20T12:56:49 thm-vm sshd[2830]: Accepted password for jsmith from 54.155.224.201 port 51058 ssh2
2025-08-22T03:14:06 thm-vm sshd[2830]: Accepted password for jsmith from 196.251.118.184 port 51058 ssh2
```

La première a l'air légitime : clé, IP interne, 14:00 pile comme une tâche planifiée (à confirmer : l'IP est-elle bien le serveur Ansible ?). Les deux de `jsmith` cumulent les trois signaux.

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

### auth.log (Linux)

```bash title="connexions SSH réussies"
cat /var/log/auth.log | grep -E 'Accepted'
```

```bash title="connexions SSH réussies et échouées"
cat /var/log/auth.log | grep "sshd" | grep -E 'Accepted|Failed'
```

Pour chaque connexion réussie suspecte :

:::etapes
1. **Le compte**
   À qui est-il ? Est-il normal qu'il se connecte à cette heure, depuis cette IP ?
2. **L'IP source**
   Que disent la threat intelligence et l'inventaire des actifs ? Fiable ou malveillante ?
3. **L'historique**
   La connexion a-t-elle été précédée d'une force brute ou d'autres événements suspects ?
4. **La suite**
   Si la connexion est suspecte, analyser ce que le compte a fait ensuite : [arbre des processus](../../01-fondamentaux/journaux-linux.md#remonter-larbre-des-processus).
:::

## Faux positifs

À compléter.

## Réponse

À compléter.
