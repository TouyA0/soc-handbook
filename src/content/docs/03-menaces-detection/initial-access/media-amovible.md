---
title: "Média amovible infecté"
description: "Un malware arrive sur une clé USB et compte sur l'utilisateur pour le lancer, puis se recopie sur les autres clés branchées à la machine."
tags: [windows, usb, sysmon]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1091
tactic: initial-access
severity: med
platforms: [Windows]
data_sources: [Sysmon]
related:
  - 03-menaces-detection/initial-access/piece-jointe-malveillante
---

## Description

Comme le phishing, une clé USB infectée passe le pare-feu, et fonctionne même sur une machine sans accès à Internet. Elle arrive par un « cadeau » ou par un tiers déjà infecté (une imprimerie où l'on confie sa clé), puis le malware se recopie sur les autres clés branchées à la machine : la même technique sert aussi au déplacement latéral.

Il existe des moyens de lancer un malware automatiquement à l'insertion de la clé, mais le plus souvent c'est l'utilisateur qui le lance lui-même, trompé par un déguisement :

| Déguisement | Exemple |
| --- | --- |
| Raccourci | Les vrais fichiers sont masqués, seul reste un `RECOVERY.lnk`. |
| Fausse icône | `Photos.exe`, un exécutable avec une icône de dossier. |
| Double extension | Une copie `photo_2024_1_12.jpg.exe` à côté de chaque fichier. |

## Ce qu'on observe

| Sysmon | Ce qui alerte |
| --- | --- |
| 1 (processus créé) | `Image` sur une autre lettre de lecteur que `C:`, comme `E:\Open Sandisk 4GB USB.exe`, avec `explorer.exe` pour parent. |
| 11 (fichier créé) | Le malware se dépose sur le disque, dans un dossier de transit comme `C:\Users\Public`, sous un nom qui imite Windows (`winupdate.exe`). |
| 11 (fichier créé) | Des fichiers écrits sur une autre lettre de lecteur : le malware se propage à une autre clé. |
| 13 (registre) | Persistance du fichier déposé. |

Sans lettre de lecteur amovible dans le chemin, une infection par USB ressemble à une pièce jointe : un exécutable lancé par `explorer.exe`. Voir [Pièce jointe malveillante](piece-jointe-malveillante.md) et la méthode pour [analyser un processus](../../01-fondamentaux/journaux-windows.md#analyser-un-processus).

## Détection

### PowerShell sur les journaux Sysmon

Sur un fichier exporté, remplacer `LogName='Microsoft-Windows-Sysmon/Operational'` par `Path='C:\chemin\Sysmon.evtx'`.

```powershell title="processus lancés depuis un autre lecteur que C: (Sysmon 1)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=1} |
  Where-Object { $_.Message -match '(?m)^Image: [A-BD-Z]:\\' } |
  Select-Object TimeCreated, Message
```

```powershell title="fichiers écrits sur un autre lecteur que C: : propagation (Sysmon 11)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=11} |
  Where-Object { $_.Message -match '(?m)^TargetFilename: [A-BD-Z]:\\' } |
  Select-Object TimeCreated, Message
```

## Faux positifs

:::faux-positifs
- **Logiciels portables** lancés volontairement depuis une clé.
- **Lecteurs réseau** : un partage monté sous `Z:` donne aussi un chemin hors de `C:`.
- **Second disque interne** (`D:`) qui contient des programmes.
:::

:::piege
La lettre `E:` n'est qu'un exemple : Windows attribue la première lettre libre. Identifier quelles lettres correspondent à des clés sur la machine étudiée avant de conclure.
:::

## Réponse

À compléter.
