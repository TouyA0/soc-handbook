---
title: "Collecte de données locales"
description: "L'attaquant cherche sur la machine ce qui a de la valeur (documents, mots de passe, sessions, portefeuilles), le rassemble dans une archive et l'envoie vers un serveur qu'il contrôle."
tags: [windows, sysmon, exfiltration, stealer]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1005
tactic: collection
severity: high
platforms: [Windows]
data_sources: [Sysmon, Historique PowerShell]
related:
  - 03-menaces-detection/discovery/decouverte-du-systeme
  - 03-menaces-detection/command-and-control/tunnel-icmp-dns
---

## Description

Après la découverte vient le butin. Ce qui est visé dépend du but de l'attaquant :

| But | Cibles | Exemples d'emplacement |
| --- | --- | --- |
| Chantage | Photos, conversations, historique de navigation | `AppData\Roaming\Signal\`, `AppData\Local\Google\Chrome\User Data\Default\History` |
| Argent | Sessions web (cookies), mots de passe enregistrés :attack[T1555.003], portefeuilles de cryptomonnaie | `…\Chrome\User Data\Default\Cookies`, `…\Login Data`, `AppData\Roaming\Bitcoin\wallet.dat` |
| Réseau de l'entreprise | Clés SSH, bases de données, documents internes | `C:\Users\<utilisateur>\.ssh\`, dossier `DATA` de SQL Server, `Desktop`, `Documents`, `Downloads` |

Deux façons de collecter :

- **À la main** : un attaquant humain ouvre les fichiers intéressants, les copie dans un dossier de transit, les archive (:attack[T1560.001]). Typique d'une intrusion dans un réseau d'entreprise ; cela peut prendre des heures.
- **Par un stealer** : un malware dédié, sur un poste personnel le plus souvent, qui ramasse tout en moins d'une minute (navigateurs, VPN, portefeuilles, Discord, Telegram, presse-papiers :attack[T1115], captures d'écran) avec son propre code, sans lancer de commande.

Puis vient l'**exfiltration** : l'envoi des données vers un serveur de l'attaquant, souvent un service de confiance pour passer inaperçu (Dropbox, Mega, Amazon S3, GitHub, Telegram :attack[T1567]) ou un domaine au nom rassurant comme `windows-updates.com`.

## Ce qu'on observe

| Étape | Exemple de commande |
| --- | --- |
| Lire | `notepad.exe C:\Users\<utilisateur>\Desktop\finances-2025.csv` : ouvrir un fichier intéressant (aussi `wordpad.exe`). |
| Fouiller | `type debug-logs.txt \| findstr password > C:\Temp\passwords.txt` : chercher des mots de passe dans un fichier. |
| Chercher | `Get-ChildItem C:\Users\<utilisateur> -Recurse -Filter *.pdf` : lister un type de fichier dans tout le dossier utilisateur. |
| Copier | `copy C:\Users\<utilisateur>\AppData\Roaming\Signal C:\Temp\` : rassembler dans un dossier de transit. |
| Archiver | `Compress-Archive C:\Temp\ C:\Temp\stolen_data.zip`, ou avec 7-Zip `7za.exe a -tzip C:\Temp\stolen_data.zip C:\Temp\*.*`. |
| Presse-papiers | `Get-Clipboard` : lire ce que l'utilisateur a copié. |

Dans les journaux :

- **Sysmon 1** : `notepad.exe` ou `wordpad.exe` ouverts en série sur des documents sensibles, outils d'archivage, commandes ci-dessus.
- **Sysmon 11** : un dossier de transit créé (`C:\Temp\…`, un nom aléatoire comme `staging_58f1`), des copies de documents dedans, puis une archive.
- **Sysmon 3 et 22** : le processus qui a créé l'archive contacte un service de stockage ou un domaine inconnu.

Un stealer lance peu ou pas de commandes : ce sont surtout ses fichiers créés (Sysmon 11) et ses connexions (Sysmon 3, 22) qui le trahissent. Sysmon ne journalise pas les lectures de fichiers : on voit ce qu'il a écrit et où il s'est connecté, rarement tout ce qu'il a lu.

## Détection

### PowerShell sur les journaux Sysmon

Sur un fichier exporté, remplacer `LogName='Microsoft-Windows-Sysmon/Operational'` par `Path='C:\chemin\Sysmon.evtx'`.

```powershell title="archives créées (Sysmon 11)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=11} |
  Where-Object { $_.Message -match '(?m)^TargetFilename: .*\.(zip|7z|rar)\s*$' } |
  Select-Object TimeCreated, Message
```

```powershell title="commandes de collecte et d'archivage (Sysmon 1)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=1} |
  Where-Object { $_.Message -match '(?m)^CommandLine: .*(Compress-Archive|7za?\.exe|rar\.exe|Get-Clipboard|findstr .*pass|-Recurse .*-Filter)' } |
  Select-Object TimeCreated, Message
```

```powershell title="requêtes DNS vers des services de stockage ou de messagerie (Sysmon 22)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=22} |
  Where-Object { $_.Message -match '(?m)^QueryName: .*(dropbox|mega\.nz|amazonaws\.com|github|telegram)' } |
  Select-Object TimeCreated, Message
```

Pour chaque résultat, regarder **quel processus** fait la requête : un navigateur vers Dropbox est banal, un exécutable de `Downloads` ou `powershell.exe` beaucoup moins.

## Faux positifs

:::faux-positifs
- **Archives légitimes** : sauvegardes, envoi d'un dossier à un collègue, outils de déploiement.
- **Services de stockage en ligne** utilisés par l'entreprise ou synchronisés par leur client officiel.
- **Utilisateur qui ouvre ses propres documents** dans le Bloc-notes : c'est la série, le moment et la session qui alertent.
:::

:::piege
- **Le volume trompe** : une collecte manuelle s'étale sur des heures, un stealer tient en une minute. Ne pas chercher seulement des rafales.
- **Une exfiltration vers un service connu ressemble à du trafic normal** : c'est le processus source et le moment, juste après la création d'une archive, qui la trahissent.
:::

## Réponse

À compléter.
