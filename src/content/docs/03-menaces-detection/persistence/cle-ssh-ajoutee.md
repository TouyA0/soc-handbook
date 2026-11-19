---
title: "Clé SSH ajoutée"
description: "L'attaquant ajoute sa clé publique dans le fichier authorized_keys d'un compte pour revenir en SSH sans mot de passe ni malware."
tags: [linux, persistance, ssh, auditd]
updated: 2026-11-19
draft: false
type: technique
attack_id: T1098.004
tactic: persistence
severity: high
platforms: [Linux]
data_sources: [auditd]
related:
  - 03-menaces-detection/persistence/creation-de-compte
  - 03-menaces-detection/impact/minage-de-cryptomonnaie
---

## Description

Pour revenir dans un mois voler d'autres données sans laisser de malware sur place, l'attaquant garde un **accès** plutôt qu'un programme. Si SSH est exposé : un [compte créé](creation-de-compte.md), ou une clé SSH ajoutée à un compte existant, utilisée ensuite à la place d'un mot de passe. [Dota3](../impact/minage-de-cryptomonnaie.md) le fait en remplaçant toutes les clés du compte forcé.

Les clés publiques autorisées sont dans `~/.ssh/authorized_keys`, pour chaque utilisateur. Une clé malveillante se fond facilement parmi les légitimes :

```bash title="ajout de la clé, puis impossible de dire laquelle est la porte dérobée"
root@thm-vm:~$ echo "AAAAC3Nza...IkiINvQt/R" >> ~/.ssh/authorized_keys

root@thm-vm:~$ cat ~/.ssh/authorized_keys
ssh-ed25519 AAAAC3Nza...oh5fpNy1Gi
ssh-ed25519 AAAAC3Nza...N9a2UYsFpQ
ssh-ed25519 AAAAC3Nza...IkiINvQt/R
```

## Ce qu'on observe

La meilleure détection est la **modification du fichier** `authorized_keys`, pas la création de processus : il y a beaucoup de façons de modifier une clé, et certaines échappent à auditd. `echo` est une commande intégrée au shell : elle ne crée pas de processus, et l'ajout apparaît seulement sous le nom `bash`.

```text title="la clé ajoutée avec echo : auditd ne voit que bash"
root@thm-vm:~$ ausearch -i -f /.ssh/authorized_keys
type=PROCTITLE msg=audit(09/22/25 16:55:12.740:806) : proctitle=bash
type=PATH msg=audit(09/22/25 16:55:12.740:806) : item=1 name=/home/user/.ssh/authorized_keys
type=CWD msg=audit(09/22/25 16:55:12.740:806) : cwd=/
type=SYSCALL msg=audit(09/22/25 16:55:12.740:806) : syscall=openat [...] a2=O_WRONLY|O_CREAT|O_EXCL ppid=1265 pid=1310 uid=root exe=/usr/bin/vi key=systemd
```

## Détection

### auditd

```bash title="les modifications des fichiers authorized_keys"
ausearch -i -f /.ssh/authorized_keys
```

## Faux positifs

À compléter.

## Réponse

À compléter.
