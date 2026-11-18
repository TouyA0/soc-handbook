---
title: "Découverte du système"
description: "Juste après l'intrusion, l'attaquant enchaîne les commandes pour savoir où il est : qui est l'utilisateur, à quoi sert la machine, quel réseau, quel antivirus."
tags: [windows, sysmon, cmd, powershell]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1082
tactic: discovery
severity: med
platforms: [Windows]
data_sources: [Sysmon, Historique PowerShell]
related:
  - 03-menaces-detection/discovery/scan-de-ports
  - 03-menaces-detection/collection/collecte-de-donnees
---

## Description

Un attaquant qui vient d'entrer ne connaît pas la machine. Avant d'aller plus loin, il cherche à savoir qui l'utilise, avec quels droits, à quoi elle sert, si elle appartient à un réseau d'entreprise et quelle protection la surveille. Un malware de phishing le fait souvent tout seul dès son lancement, et peut même s'effacer si la victime ne l'intéresse pas ou si un antivirus précis est présent. Ensuite, l'attaquant humain complète à la main.

| Cible | Commandes courantes |
| --- | --- |
| Comptes | Qui utilise la machine, avec quels droits : `whoami`, `whoami /priv`, `net user`, `net localgroup`, `query user`, `Get-LocalUser`. :attack[T1087] |
| Système | À quoi sert la machine, quelles failles, quelles applications : `systeminfo`, `tasklist /v`, `wmic product get name,version`, `Get-Service`. :attack[T1082] |
| Réseau | Si la machine appartient à un réseau d'entreprise : `ipconfig /all`, `netstat -ano`, `netsh advfirewall show allprofiles`. :attack[T1016] |
| Fichiers | Le métier et les intérêts de la victime : `dir`, `type`, `Get-ChildItem`, `Get-Content`. :attack[T1083] |
| Protection | Le risque de se faire bloquer : `Get-MpPreference`, `tasklist /v \| findstr MsSense.exe`, requête WMI sur `root\SecurityCenter2` (`AntivirusProduct`). :attack[T1518.001] |

## Ce qu'on observe

Le signe, c'est **une rafale** de ces commandes en quelques secondes ou minutes, lancées par un **même parent** inattendu. Chaque commande CMD est un nouveau processus, donc un événement Sysmon 1 :

```text title="commandes de découverte lancées par une pièce jointe"
C:\Users\victim\Downloads\invoice.pdf.exe
├── cmd.exe
│   ├── ipconfig
│   ├── whoami /priv
│   ├── net user
│   ├── tasklist /v
│   └── wmic computersystem get model
└── powershell.exe
    ├── Get-Service
    └── Get-MpPreference
```

Les cmdlets PowerShell (`Get-Service`, `Get-MpPreference`) ne créent pas de nouveau processus : Sysmon ne voit que `powershell.exe`. Elles se lisent dans l'[historique PowerShell](../../01-fondamentaux/journaux-windows.md#historique-powershell).

Après une intrusion par le bureau à distance, l'attaquant a l'interface graphique : moins de `whoami`, mais des outils d'administration lancés par `explorer.exe`.

```text title="découverte par l'interface graphique"
C:\Windows\System32\explorer.exe
├── cmd.exe
├── mmc.exe C:\Windows\system32\compmgmt.msc        gestion de l'ordinateur
├── control.exe netconnections                      cartes réseau
├── SystemSettings.exe                              paramètres
├── notepad.exe C:\...\secrets.txt                  lecture d'un fichier
└── taskmgr.exe                                     gestionnaire des tâches
```

## Détection

### PowerShell sur les journaux Sysmon

```powershell title="commandes de découverte, avec leur parent, dans l'ordre (Sysmon 1)"
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=1} |
  ForEach-Object {
    $d = @{}; ([xml]$_.ToXml()).Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
    [pscustomobject]@{ Heure = $_.TimeCreated; Image = $d.Image; Commande = $d.CommandLine; Parent = $d.ParentImage; ParentPID = $d.ParentProcessId }
  } |
  Where-Object { $_.Image -match '\\(whoami|net1?|ipconfig|systeminfo|tasklist|netstat|quser|query|wmic|netsh|nltest)\.exe$' } |
  Sort-Object Heure
```

Sur un fichier exporté, remplacer `LogName='Microsoft-Windows-Sysmon/Operational'` par `Path='C:\chemin\Sysmon.evtx'`. `net user` crée deux événements : `net.exe`, puis `net1.exe` qu'il lance.

Une fois la rafale trouvée, remonter le parent (`ParentPID`) jusqu'à l'origine, puis chercher ses connexions réseau (Sysmon 3 et 22) : le malware envoie souvent le résultat de sa découverte à son serveur. Méthode : [analyser un processus](../../01-fondamentaux/journaux-windows.md#analyser-un-processus).

## Faux positifs

:::faux-positifs
- **Service informatique et support** : `ipconfig`, `whoami` ou `systeminfo` tapés par un technicien, depuis une console qu'il a ouverte lui-même.
- **Outils d'inventaire, de supervision ou d'EDR** qui lancent ces commandes à intervalle régulier, toujours depuis le même parent connu.
- **Scripts de connexion** lancés à l'ouverture de session.
:::

:::piege
Une commande seule ne dit rien : c'est **qui la lance** qui compte. Un `whoami` dont le parent est un technicien dans `cmd.exe` est banal ; le même `whoami` lancé par `invoice.pdf.exe` dans `Downloads` est une alerte.
:::

## Réponse

À compléter.
