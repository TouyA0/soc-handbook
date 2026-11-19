---
title: "Découverte du système"
description: "Juste après l'intrusion, l'attaquant enchaîne les commandes pour savoir où il est : qui est l'utilisateur, à quoi sert la machine, quel réseau, quel antivirus."
tags: [windows, linux, sysmon, auditd, cmd, powershell]
updated: 2026-11-19
draft: false
type: technique
attack_id: T1082
tactic: discovery
severity: med
platforms: [Windows, Linux]
data_sources: [Sysmon, Historique PowerShell, auditd]
related:
  - 03-menaces-detection/discovery/scan-de-ports
  - 03-menaces-detection/collection/collecte-de-donnees
---

## Description

Un attaquant qui vient d'entrer ne connaît pas la machine. Souvent, l'accès initial est automatisé (un malware de phishing, un botnet qui force un SSH) et l'attaquant humain ne prend la main qu'ensuite. Les premières commandes sont presque toujours les mêmes, quel que soit le point d'entrée. Un malware peut même s'effacer si un antivirus précis est présent ou si la victime n'est pas de l'entreprise ou du pays visé. La découverte est sautée quand l'attaquant connaît déjà sa cible, ou veut seulement installer un mineur et repartir.

### Windows

| Cible | Pourquoi | Commandes courantes |
| --- | --- | --- |
| Fichiers | Le rôle de la machine, le métier et les intérêts de la victime. | `type`, `Get-Content`, `dir`, `Get-ChildItem` |
| Comptes | Qui utilise la machine, avec quels droits. | `whoami`, `net user`, `net localgroup`, `query user`, `Get-LocalUser` |
| Système | Failles, applications où voler des données. | `tasklist /v`, `systeminfo`, `wmic product get name,version`, `Get-Service` |
| Réseau | Si la machine appartient à un réseau d'entreprise. | `ipconfig /all`, `netstat -ano`, `netsh advfirewall show allprofiles` |
| Antivirus | Le risque de se faire bloquer. | `Get-WmiObject -Namespace "root\SecurityCenter2" -Query "SELECT * FROM AntivirusProduct"`, `Get-MpPreference` |

### Linux

| Cible | Commandes courantes |
| --- | --- |
| Système et fichiers | `pwd`, `ls /`, `env`, `uname -a`, `lsb_release -a`, `hostname` |
| Comptes et groupes | `id`, `whoami`, `w`, `last`, `cat /etc/sudoers`, `cat /etc/passwd` |
| Processus et réseau | `ps aux`, `top`, `ip a`, `ip r`, `arp -a`, `ss -tnlp`, `netstat -tnlp` |
| Cloud, bac à sable, EDR | `systemd-detect-virt`, `lsmod`, `uptime`, `pgrep "<edr-ou-sandbox>"` |

Puis une découverte ciblée, qui trahit l'objectif :

| Objectif | Commandes courantes |
| --- | --- |
| Voler des secrets | `history \| grep pass`, `find / -name .env`, `find /home -name id_rsa` |
| Miner de la cryptomonnaie | `cat /proc/cpuinfo`, `lscpu \| grep Model`, `free -m`, `top`, `htop` |
| Trouver d'autres victimes | `ping <ip>`, `for ip in 192.168.1.{1..254}; do nc -w 1 $ip 22 done` |

## Ce qu'on observe

Le signe, c'est **une suite** de ces commandes en peu de temps, et surtout **ce qui les lance**. `whoami` mérite une attention particulière : les applications légitimes en ont rarement besoin, alors que les attaquants le lancent presque toujours en premier. Une règle de détection sur toute exécution de `whoami` a de bonnes chances d'attraper un attaquant.

**Windows :** chaque commande CMD est un nouveau processus, donc un événement Sysmon 1.

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

**Linux :** auditd journalise les commandes que ses règles surveillent.

```text title="whoami lancé par un script dans /tmp"
ubuntu@thm-vm:~$ ausearch -i -x whoami
type=PROCTITLE msg=audit(08/25/25 16:28:18.107:985) : proctitle=whoami
type=SYSCALL msg=audit(08/25/25 16:28:18.107:985) : arch=x86_64 syscall=execve success=yes exit=0 items=2 ppid=3898 pid=3907 auid=ubuntu uid=ubuntu exe=/usr/bin/whoami

ubuntu@thm-vm:~$ ausearch -i --pid 3898
type=PROCTITLE msg=audit(08/25/25 16:28:11.727:982) : proctitle=/usr/bin/bash /tmp/lp.sh
type=SYSCALL msg=audit(08/25/25 16:28:11.727:982) : arch=x86_64 syscall=execve success=yes exit=0 items=2 ppid=3840 pid=3898 auid=ubuntu uid=ubuntu exe=/usr/bin/bash
```

Les autres commandes lancées par `lp.sh` (`ausearch -i --ppid 3898`), comme `find /home -name *secret*`, confirment que le script est malveillant.

## Détection

### Observateur d'événements (Windows)

:::etapes
1. **Trouver les commandes**
   Journal Sysmon, Filter Current Log sur `1` : une suite de commandes de découverte en peu de temps.
2. **Trouver d'où elles viennent**
   Construire l'arbre des processus : chercher l'événement 1 dont le `ProcessId` est le `ParentProcessId` de la commande, et remonter jusqu'à l'origine.
3. **Trouver où partent les résultats**
   Les connexions (3) et requêtes DNS (22) du processus d'origine : le malware envoie souvent ce qu'il a découvert à son serveur.
:::

### auditd (Linux)

:::etapes
1. **Trouver la commande**
   `ausearch -i -x whoami`, ou depuis le SIEM.
2. **Trouver d'où elle vient**
   `ausearch -i --pid <ppid>`, en remontant jusqu'à l'origine.
3. **Voir le reste**
   `ausearch -i --ppid <pid>` : les autres commandes du même parent.
:::

Méthode détaillée : [remonter l'arbre des processus](../../01-fondamentaux/journaux-linux.md#remonter-larbre-des-processus).

## Faux positifs

:::faux-positifs
- **Service informatique et outils légitimes** : `ipconfig` et les autres commandes sont courants dans leur travail ; un outil de supervision réseau fait régulièrement des `ping` sur le réseau local. C'est d'où vient la commande qui compte : un serveur web qui lance `whoami`, ou un membre de l'équipe informatique qui cherche des secrets avec `find` et `grep`, doivent alerter.
:::

## Réponse

À compléter.
