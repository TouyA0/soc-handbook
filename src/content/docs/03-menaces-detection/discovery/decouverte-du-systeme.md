---
title: "Découverte du système"
description: "Juste après l'intrusion, l'attaquant enchaîne les commandes pour savoir où il est : qui est l'utilisateur, à quoi sert la machine, quel réseau, quel antivirus."
tags: [windows, sysmon, cmd, powershell]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1082
tactic: discovery
severity: med
platforms: [Windows]
data_sources: [Sysmon, Historique PowerShell]
related:
  - 03-menaces-detection/discovery/scan-de-ports
  - 03-menaces-detection/collection/collecte-de-donnees
---

## Description

Un attaquant qui vient d'entrer ne connaît pas la machine. Un malware de phishing lance souvent tout seul ses commandes de découverte, et peut même s'effacer si un antivirus précis est présent ou si la victime n'est pas de l'entreprise ou du pays visé. Ensuite, l'attaquant humain complète à la main.

| Cible | Pourquoi | Commandes courantes |
| --- | --- | --- |
| Fichiers | Le rôle de la machine, le métier et les intérêts de la victime. | `type`, `Get-Content`, `dir`, `Get-ChildItem` |
| Comptes | Qui utilise la machine, avec quels droits. | `whoami`, `net user`, `net localgroup`, `query user`, `Get-LocalUser` |
| Système | Failles, applications où voler des données. | `tasklist /v`, `systeminfo`, `wmic product get name,version`, `Get-Service` |
| Réseau | Si la machine appartient à un réseau d'entreprise. | `ipconfig /all`, `netstat -ano`, `netsh advfirewall show allprofiles` |
| Antivirus | Le risque de se faire bloquer. | `Get-WmiObject -Namespace "root\SecurityCenter2" -Query "SELECT * FROM AntivirusProduct"`, `Get-MpPreference` |

## Ce qu'on observe

Le signe, c'est **une suite** de ces commandes en peu de temps. Chaque commande CMD est un nouveau processus, donc un événement Sysmon 1 :

```text title="commandes de découverte lancées par une pièce jointe"
C:\Users\victim\Downloads\invoice.pdf.exe
├── C:\Windows\System32\cmd.exe
│   ├── ipconfig
│   ├── whoami /priv
│   ├── dir
│   ├── net user
│   ├── tasklist /v
│   └── wmic computersystem get model
└── C:\Windows\...\powershell.exe
    ├── Get-Service
    └── Get-MpPreference
```

Les commandes PowerShell ne créent pas de nouveau processus : elles se lisent dans l'[historique PowerShell](../../01-fondamentaux/journaux-windows.md#historique-powershell).

Après une intrusion par RDP, l'attaquant a l'interface graphique : moins de `whoami` (même s'il les tape souvent par habitude), mais des outils d'administration lancés par `explorer.exe`.

```text title="découverte par l'interface graphique"
C:\Windows\System32\explorer.exe
├── cmd.exe
├── mmc.exe C:\Windows\system32\compmgmt.msc        gestion de l'ordinateur
├── control.exe netconnections                      cartes réseau
├── SystemSettings.exe                              paramètres
├── notepad.exe C:\...\secrets.txt                  lecture d'un fichier
└── taskmgr.exe                                     gestionnaire des tâches
```

## Détection

### Observateur d'événements

:::etapes
1. **Trouver les commandes**
   Journal Sysmon, Filter Current Log sur `1` : une suite de commandes de découverte en peu de temps.
2. **Trouver d'où elles viennent**
   Construire l'arbre des processus : chercher l'événement 1 dont le `ProcessId` est le `ParentProcessId` de la commande, et remonter jusqu'à l'origine.
3. **Trouver où partent les résultats**
   Les connexions (3) et requêtes DNS (22) du processus d'origine : le malware envoie souvent ce qu'il a découvert à son serveur.
:::

## Faux positifs

:::faux-positifs
- **Service informatique et outils légitimes** : `ipconfig` et les autres commandes sont courants dans leur travail. C'est d'où vient la commande qui compte, pas la commande elle-même.
:::

## Réponse

À compléter.
