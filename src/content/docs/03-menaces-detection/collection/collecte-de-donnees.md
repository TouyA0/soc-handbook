---
title: "Collecte de données locales"
description: "L'attaquant cherche sur la machine ce qui a de la valeur (documents, sessions, portefeuilles, clés), le rassemble dans une archive et l'envoie vers un serveur qu'il contrôle."
tags: [windows, sysmon, exfiltration, stealer]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1005
tactic: collection
severity: high
platforms: [Windows]
data_sources: [Sysmon]
related:
  - 03-menaces-detection/discovery/decouverte-du-systeme
  - 03-menaces-detection/command-and-control/tunnel-icmp-dns
---

## Description

Après la découverte vient le butin. Ce qui est visé dépend du but de l'attaquant :

| But | Cibles et emplacements |
| --- | --- |
| Chantage | Photos, conversations, historique de navigation : `C:\Users\<utilisateur>\AppData\Roaming\Signal\*`, `C:\Users\<utilisateur>\AppData\Local\Google\Chrome\User Data\Default\History` |
| Argent | Sessions bancaires, portefeuilles de cryptomonnaie : `C:\Users\<utilisateur>\AppData\Roaming\Bitcoin\wallet.dat`, `C:\Users\<utilisateur>\AppData\Local\Google\Chrome\User Data\Default\Cookies` |
| Entreprise | Clés SSH, bases de données : `C:\Users\<utilisateur>\.ssh\*`, `C:\Program Files\Microsoft SQL Server\...\DATA\*` |

Les secrets peuvent aussi être dans le registre ou en mémoire.

Deux façons de collecter :

- **À la main** : typique d'une intrusion dans un grand réseau, où l'attaquant connaît sa cible et peut passer des heures à chercher.
- **Par un stealer** : un malware dédié, sur les postes personnels surtout, qui ramasse tout en moins d'une minute (VPN, portefeuilles, sessions de navigateur, Steam, Discord, Telegram, captures d'écran) avec son propre code, rarement avec CMD ou PowerShell. On sait alors plus difficilement ce qui a été volé.

Puis vient l'**exfiltration**, souvent vers un service de confiance pour passer inaperçu : Dropbox, Mega, Amazon S3, GitHub, Telegram, ou un domaine au nom rassurant comme `windows-updates.com`.

## Ce qu'on observe

| Étape | Exemple de commande |
| --- | --- |
| Lire | `notepad.exe C:\Users\<utilisateur>\Desktop\finances-2025.csv` (ou WordPad) |
| Fouiller | `type debug-logs.txt \| findstr password > C:\Temp\passwords.txt` |
| Chercher | `Get-ChildItem C:\Users\<utilisateur> -Recurse -Filter *.pdf` |
| Copier | `copy C:\Users\<utilisateur>\AppData\Roaming\Signal C:\Temp\` |
| Archiver | `Compress-Archive C:\Temp\ C:\Temp\stolen_data.zip` ou `7za.exe a -tzip C:\Temp\stolen_data.zip C:\Temp\*.*` |

Une collecte manuelle se voit bien dans Sysmon 1 : Notepad et WordPad ouverts en série sur des documents sensibles, puis 7-Zip qui archive le tout.

## Détection

### Observateur d'événements

:::etapes
1. **Trouver les lectures et l'archivage**
   Journal Sysmon, Filter Current Log sur `1` : éditeurs ouverts sur des fichiers sensibles, commandes de recherche, outils d'archivage.
2. **Trouver le dossier de transit**
   Filtre sur `11` : le dossier créé pour rassembler les fichiers, les copies, puis l'archive.
3. **Trouver l'exfiltration**
   Find sur le `ProcessId` du processus qui a créé l'archive (ou du stealer) : ses requêtes DNS (22) et connexions (3).
:::

## Faux positifs

À compléter.

## Réponse

À compléter.
