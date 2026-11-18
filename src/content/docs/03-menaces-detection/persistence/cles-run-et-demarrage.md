---
title: "Clés Run et dossier Démarrage"
description: "L'attaquant fait relancer son malware à chaque connexion d'un utilisateur, par le dossier Démarrage ou une clé de registre Run."
tags: [windows, persistance, registre, sysmon]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1547.001
tactic: persistence
severity: med
platforms: [Windows]
data_sources: [Sysmon]
related:
  - 03-menaces-detection/persistence/service-windows
  - 03-menaces-detection/persistence/tache-planifiee
---

## Description

Services et tâches se lancent au démarrage et demandent des droits d'administrateur. Pour lancer un programme à la connexion d'un utilisateur précis, Windows offre le dossier Démarrage et les clés Run, utilisés par des logiciels légitimes comme par les malwares.

**Dossier Démarrage**, à voir dans l'Explorateur :

```text title="dossier Démarrage d'un utilisateur, puis de tous les utilisateurs"
C:\Users\<utilisateur>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\
C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp
```

```text title="y déposer un malware"
copy C:\malware.exe "%AppData%\Microsoft\Windows\Start Menu\Programs\Startup\malware.exe"
```

**Clés Run**, à voir dans l'Éditeur du registre (`regedit.exe`) :

```text title="clé Run d'un utilisateur, puis de tous les utilisateurs"
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Run
```

```text title="y ajouter un malware"
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v BadKey /t REG_SZ /d "C:\malware.exe"
```

## Ce qu'on observe

- **Sysmon 11** : un fichier créé dans un dossier `Startup`. Le dossier est en général vide : peu de logiciels légitimes l'utilisent.
- **Sysmon 13** : une valeur écrite sous `…\CurrentVersion\Run`.
- **Sysmon 1** : à la connexion suivante, le programme lancé avec `explorer.exe` pour parent.

## Détection

### Observateur d'événements

:::etapes
1. **Dossier Démarrage**
   Journal Sysmon, Filter Current Log sur `11`, Find sur `Startup` : les fichiers déposés.
2. **Clés Run**
   Filtre sur `13`, Find sur `CurrentVersion\Run` : les valeurs ajoutées et le programme qu'elles lancent.
3. **Remonter à l'auteur**
   Find sur le `ProcessId` qui a écrit le fichier ou la valeur : [analyser un processus](../../01-fondamentaux/journaux-windows.md#analyser-un-processus).
:::

## Faux positifs

À compléter.

:::piege
**Le lancement ressemble à une action de l'utilisateur** : un programme du dossier Démarrage a `explorer.exe` pour parent, comme un double-clic ou une pièce jointe. C'est l'écriture du fichier ou de la valeur qui dit d'où il vient.
:::

## Réponse

À compléter.
