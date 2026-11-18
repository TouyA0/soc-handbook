---
title: "Journaux Linux"
description: "Où trouver les journaux d'un serveur Linux et comment les lire : auth.log (connexions, SSH, comptes, sudo), journaux système, historique Bash, et auditd pour suivre processus et fichiers."
tags: [linux, journaux, auth-log, auditd, bash]
updated: 2026-11-18
draft: false
---

## Où sont les journaux

Sous Linux, la plupart des événements sont écrits en **texte brut** dans `/var/log` : un éditeur ou `cat` suffit pour les lire. En contrepartie, pas d'Event ID ni de format strict. Le format, la verbosité et l'emplacement se changent facilement, et chaque distribution ajuste un peu les siens : un journal peut avoir une autre forme, ou ne pas exister.

| Fichier | Ce qu'il contient |
| --- | --- |
| `/var/log/auth.log` | Connexions, SSH, gestion des comptes, commandes `sudo`. Le plus utile au SOC. `/var/log/secure` sur Red Hat. |
| `/var/log/syslog` | Flux général des événements du système. `/var/log/messages` sur certaines distributions. |
| `/var/log/kern.log` | Messages et erreurs du noyau. |
| `/var/log/dpkg.log` | Installations de paquets sur Debian (ou `/var/log/apt`). `/var/log/dnf.log` ou `/var/log/yum.log` sur Red Hat. |
| `/var/log/audit/audit.log` | Journal d'auditd. |
| `/var/log/nginx/access.log` | Exemple de journal d'application : les requêtes reçues par le serveur web. |

Les journaux système (`syslog`, `kern.log`, gestionnaire de paquets) servent surtout en DFIR : bruyants, difficiles à parser, rarement utilisés au quotidien en SOC.

## Lire et filtrer

| Besoin | Commande |
| --- | --- |
| Inventaire | Ce que le système journalise : `ls -l /var/log` |
| Filtrer | Les lignes qui contiennent un mot : `cat /var/log/syslog \| grep CRON` ; `grep -v CRON` pour les exclure. |
| Découvrir | Chercher un sujet dans tous les journaux, quand on ne sait pas où il est : `grep -R -E "auth\|login\|session" /var/log` |

## auth.log

Chaque ligne : horodatage, nom de la machine, service qui écrit (`sshd[839]`, `sudo`…), puis un message en texte libre.

| Cherché | Commande |
| --- | --- |
| Sessions | Ouvertures et fermetures : locales (`login`), SSH (`sshd`), Samba, cron, `sudo`. `cat /var/log/auth.log \| grep -E 'session opened\|session closed'` |
| SSH | Connexions réussies et échouées. `cat /var/log/auth.log \| grep "sshd" \| grep -E 'Accepted\|Failed'` |
| Comptes | Mot de passe changé, compte créé, modifié, supprimé. `cat /var/log/auth.log \| grep -E '(passwd\|useradd\|usermod\|userdel)\['` |
| sudo | Commandes lancées avec `sudo`, quand le système les journalise. `cat /var/log/auth.log \| grep -E 'COMMAND='` |

```text title="sessions : connexion locale, SSH, puis sudo vers root"
2025-08-02T16:04:43 thm-vm login[1138]: pam_unix(login:session): session opened for user bob(uid=1001) by bob(uid=0)
2025-08-04T09:09:06 thm-vm sshd[839]: pam_unix(sshd:session): session opened for user alice(uid=1002) by alice(uid=0)
2025-08-07T09:12:32 thm-vm sudo: pam_unix(sudo:session): session opened for user root(uid=0) by carol(uid=1003)
```

```text title="SSH : <réussite> <méthode> for <compte> from <IP>"
2025-08-07T11:21:25 thm-vm sshd[3139]: Failed password for root from 222.124.17.227 port 50293 ssh2
2025-08-09T20:30:51 thm-vm sshd[1690]: Accepted publickey for bob from 10.19.92.18 port 55050 ssh2: <key>
```

```text title="gestion des comptes : création d'un compte et ajout au groupe sudo"
2025-08-07T22:11:29 thm-vm useradd[1878]: new user: name=backdoor, UID=1002, GID=1002, shell=/bin/sh
2025-08-07T22:11:54 thm-vm usermod[1906]: add 'backdoor' to group 'sudo'
```

```text title="commandes sudo : arrêt de l'EDR, état du pare-feu, passage en root"
2025-08-07T11:21:49 thm-vm sudo: ubuntu : TTY=pts/0 ; [...] COMMAND=/usr/bin/systemctl stop edr
2025-08-07T11:23:18 thm-vm sudo: ubuntu : TTY=pts/0 ; [...] COMMAND=/usr/bin/ufw status numbered
2025-08-07T11:23:33 thm-vm sudo: ubuntu : TTY=pts/0 ; [...] COMMAND=/usr/bin/su
```

## Historique Bash

Chaque commande tapée est gardée en mémoire pendant la session, puis écrite dans `~/.bash_history` à la déconnexion. `history` montre la session en cours et les précédentes.

Rarement utilisé en SOC, parce qu'il est facile à contourner :

- il ne contient pas les commandes non interactives (système, cron, serveur web) ;
- une commande précédée d'**une espace** n'est pas enregistrée ;
- des commandes écrites dans un script puis lancées (`./legit.sh`) n'apparaissent pas ;
- un autre shell (`sh`) n'écrit pas dans l'historique Bash.

## Processus, fichiers, réseau : auditd

Par défaut, Linux ne journalise ni la création de processus, ni les modifications de fichiers, ni le réseau. Comme Sysmon sous Windows, il faut un outil en plus. Tous reposent sur les **appels système** : chaque fois qu'un programme ouvre un fichier ou lance un processus, il passe par un appel système (`execve` pour exécuter un programme), qu'on ne peut quasiment pas contourner. On choisit ceux qu'on surveille.

auditd est la solution intégrée. Ses règles sont dans `/etc/audit/rules.d/` : quels appels système surveiller, avec quels filtres, sous quelle **clé**. Tout surveiller produirait des gigaoctets par jour : on cible les événements à risque, comme les modifications de fichiers sensibles (configuration SSH, tâches cron, réglages système). Le journal brut est `/var/log/audit/audit.log` ; `ausearch` le rend lisible et le filtre.

```bash title="les événements d'une clé de règle, valeurs traduites en clair (-i)"
ausearch -i -k proc_wget
```

```text title="un événement auditd : lancement de wget"
type=PROCTITLE msg=audit(08/12/25 12:48:19.093:2219) : proctitle=wget https://files.tryhackme.thm/report.zip
type=CWD msg=audit(08/12/25 12:48:19.093:2219) : cwd=/root
type=EXECVE msg=audit(08/12/25 12:48:19.093:2219) : argc=2 a0=wget a1=https://files.tryhackme.thm/report.zip
type=SYSCALL msg=audit(08/12/25 12:48:19.093:2219) : arch=x86_64 syscall=execve [...] ppid=3752 pid=3888 auid=ubuntu uid=root tty=pts1 exe=/usr/bin/wget key=proc_wget
```

| Champ | Sens |
| --- | --- |
| `proctitle` | La ligne de commande. |
| `cwd` | Le dossier courant. |
| `pid`, `ppid` | Processus et parent : pour relier les événements et reconstruire l'arbre. |
| `auid` | Le compte utilisé pour se connecter (clavier ou SSH), même après `sudo` ou `su`. |
| `uid` | Le compte qui a lancé la commande. |
| `tty` | La session : distingue plusieurs personnes connectées au même serveur. |
| `exe` | Le chemin du programme exécuté. |
| `key` | La clé de la règle qui a déclenché l'événement. |
| `syscall` | L'appel système : `execve` pour un lancement, `openat` pour l'ouverture d'un fichier (avec une ligne `PATH` qui donne le fichier). |

Un événement peut aussi être dans le journal sans clé dédiée : chercher alors dans `ausearch -i` avec `grep`.

Autres outils sur le même principe, plus faciles à envoyer dans un SIEM : Sysmon for Linux, Falco (conteneurs), Osquery, et la plupart des EDR.
