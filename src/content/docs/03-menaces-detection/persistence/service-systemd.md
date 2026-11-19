---
title: "Service systemd"
description: "Avec les droits root, l'attaquant crée un service systemd au nom rassurant qui relance son malware à chaque démarrage."
tags: [linux, persistance, systemd, auditd]
updated: 2026-11-19
draft: false
type: technique
attack_id: T1543.002
tactic: persistence
severity: high
platforms: [Linux]
data_sources: [auditd]
related:
  - 03-menaces-detection/persistence/tache-cron
  - 03-menaces-detection/persistence/service-windows
---

## Description

Les services systemd font tourner les composants essentiels du système : DNS, SSH, presque tous les services web. Chacun est un fichier `.service` dans `/lib/systemd/system` ou `/etc/systemd/system`. Avec les droits root, l'attaquant peut créer le sien, avec un nom et une description qui imitent un service de confiance.

```text title="Sandworm (GOGETTER) : /lib/systemd/system/cloud-online.service"
[Unit]
Description=Initial cloud-online job    # fausse description, imite un service de confiance
[Service]
ExecStart=/usr/bin/cloud-online         # le malware, déguisé en fichier de confiance
```

Autre exemple : le groupe Kimsuky a installé une porte dérobée sur des serveurs Linux sensibles avec un service nommé `syslogd`.

## Ce qu'on observe

Un service est un simple fichier texte. Deux traces possibles :

- **Une modification** dans `/lib/systemd/system/` ou `/etc/systemd/system/` (et quelques emplacements plus rares).
- **Un processus** qui gère les services : `systemctl start <service>`, `systemctl enable <service>`.

```text title="création d'un fichier .service dans auditd"
root@thm-vm:~$ ausearch -i -f /etc/systemd
type=PROCTITLE msg=audit(09/22/25 16:55:12.740:806) : proctitle=vi /etc/systemd/system/malicious.service
type=PATH msg=audit(09/22/25 16:55:12.740:806) : item=1 name=/etc/systemd/system/malicious.service
type=CWD msg=audit(09/22/25 16:55:12.740:806) : cwd=/
type=SYSCALL msg=audit(09/22/25 16:55:12.740:806) : syscall=openat [...] a2=O_WRONLY|O_CREAT|O_EXCL ppid=1265 pid=1310 uid=root exe=/usr/bin/vi key=systemd
```

## Détection

### auditd

```bash title="les modifications dans /etc/systemd"
ausearch -i -f /etc/systemd
```

```bash title="les lancements de systemctl"
ausearch -i -x systemctl
```

Puis lire le fichier `.service` : le programme lancé (`ExecStart`) est-il là où il devrait être ?

## Faux positifs

À compléter.

## Réponse

À compléter.
