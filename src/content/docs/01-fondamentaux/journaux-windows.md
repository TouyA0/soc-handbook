---
title: "Journaux Windows"
description: "Où trouver les journaux Windows et comment les lire, les Event IDs à connaître (Security, Sysmon), suivre une session ou un processus d'un événement à l'autre, et l'historique PowerShell."
tags: [windows, journaux, event-id, sysmon, powershell]
updated: 2026-11-18
draft: false
---

## Où sont les journaux

Windows enregistre ses journaux au format binaire EVTX, un fichier par catégorie, dans `C:\Windows\System32\winevt\Logs`. Les trois à connaître :

| Journal | Ce qu'il contient |
| --- | --- |
| Security | Connexions, gestion des comptes et des groupes, processus (si activé). Le plus utile au SOC parmi les journaux actifs par défaut. |
| Application | Les événements des applications : serveur web IIS, base SQL Server… |
| Sysmon | Processus, réseau, fichiers, registre : à installer (outil gratuit de Microsoft Sysinternals). Dans l'Observateur : Applications and Services Logs › Microsoft › Windows › Sysmon › Operational. |

Pour les lire : l'**Observateur d'événements** (Win + R, `eventvwr`). Filter Current Log filtre par Event ID, Find cherche un texte, l'onglet Details donne l'événement complet en XML. Un fichier `.evtx` exporté s'ouvre par Action › Open Saved Log.

:::piege
La colonne Date and Time de l'Observateur est à l'**heure locale** de la machine qui affiche le journal, pas en UTC. Pour corréler avec d'autres sources, prendre l'horodatage UTC du XML (`TimeCreated SystemTime`).
:::

## Event IDs essentiels

Plus de 500 Event IDs rien que pour le journal Security, et tous ne sont pas activés par défaut. Ceux-ci couvrent l'essentiel du travail de L1.

### Connexions

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4624 | **Connexion réussie**<br>Type de connexion, compte, IP et nom de la machine source, Logon ID. Enregistré sur la machine à laquelle on se connecte. Très bruyant : des centaines par minute sur un serveur chargé. |
| 4625 | **Échec de connexion**<br>Force brute, pulvérisation de mots de passe, scan. Mêmes champs, plus le motif de l'échec (Status, SubStatus). |

Le type de connexion (`LogonType`) dit comment on s'est connecté :

| Type | Connexion |
| --- | --- |
| 2 | Interactive : au clavier de la machine. |
| 3 | Réseau : partage de fichiers, et RDP quand NLA est activé (étape d'authentification). |
| 4 | Batch : tâche planifiée. |
| 5 | Service. |
| 7 | Déverrouillage de session. |
| 10 | Bureau à distance (RDP). |
| 11 | Avec des identifiants mis en cache, hors connexion au domaine. |

### Comptes et groupes

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4720 | **Compte créé**<br>Compte de porte dérobée. |
| 4722 | **Compte activé**<br>Un ancien compte réactivé pour passer inaperçu. |
| 4738 | **Compte modifié**<br>Attributs changés, par exemple l'expiration du mot de passe. |
| 4725 | **Compte désactivé**<br>Un compte d'administration ou du SOC désactivé pour ralentir la réponse. |
| 4726 | **Compte supprimé**<br>Effacer un compte après usage. |
| 4723 | **Mot de passe changé par l'utilisateur**<br>Tentative de changement de son propre mot de passe. |
| 4724 | **Mot de passe réinitialisé**<br>Un compte réinitialisé par un autre : l'attaquant prend la main dessus. |
| 4732 | **Membre ajouté à un groupe local**<br>Ajout à Administrators, Remote Desktop Users, Backup Operators… |
| 4733 | **Membre retiré d'un groupe local** |
| 4728 | **Membre ajouté à un groupe global du domaine**<br>Ajout à Domain Admins, par exemple. Enregistré sur le contrôleur de domaine. |

Ces événements ont tous la même structure en trois parties : **Subject**, le compte qui a fait l'action, avec son Logon ID ; la **cible** (New Account, Member… selon l'événement) ; les **détails** (groupe visé, attributs du nouveau compte).

### Processus

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4688 | **Processus créé (Security)**<br>Désactivé par défaut. La ligne de commande demande un réglage supplémentaire. |
| 1 | **Processus créé (Sysmon)**<br>Image, ligne de commande, processus parent, hash, signature, utilisateur et Logon ID. À préférer à 4688. |

### Autres événements Sysmon

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 3 | **Connexion réseau**<br>Un processus inattendu qui sort vers Internet. |
| 11 | **Fichier créé**<br>Fichiers déposés par un malware. |
| 13 | **Valeur de registre modifiée**<br>Persistance, changement de configuration. |
| 22 | **Requête DNS**<br>Le domaine contacté, et le processus qui l'a demandé. |

Sysmon se configure : on choisit ce qu'on journalise. Les équivalents dans le journal Security (accès aux fichiers, 4657 pour le registre) sont désactivés par défaut.

## Suivre une session

Chaque connexion réussie reçoit un **Logon ID** (par exemple `0x5D6AC`), unique pour la session. C'est le fil qui relie tout ce qu'a fait un compte :

:::etapes
1. **Partir de la connexion**
   Dans le 4624, noter le Logon ID (champ `TargetLogonId` dans le XML).
2. **Retrouver ses actions dans Security**
   Les événements où `SubjectLogonId` vaut ce Logon ID : comptes créés, groupes modifiés, processus.
3. **Retrouver ses processus dans Sysmon**
   Les événements 1 dont le champ `LogonId` vaut ce Logon ID.
4. **Retrouver l'activité de chaque processus**
   Les événements 3, 11, 13 et 22 n'ont pas de Logon ID : les relier à leur événement 1 par `ProcessId` (ou `ProcessGuid`, plus sûr, car un numéro de processus est réutilisé).
:::

Dans l'Observateur : Filter Current Log › onglet XML › Edit query manually.

```xml title="tous les événements Security d'une session"
<QueryList>
  <Query Id="0" Path="Security">
    <Select Path="Security">*[EventData[Data[@Name='TargetLogonId']='0x5D6AC']] or *[EventData[Data[@Name='SubjectLogonId']='0x5D6AC']]</Select>
  </Query>
</QueryList>
```

## Analyser un processus

À partir d'un événement Sysmon 1 :

:::etapes
1. **Le processus**
   Son emplacement, son nom, son hash.
2. **Son parent**
   Un parent inattendu, ou qui présente lui-même un signal d'alerte.
3. **Remonter l'arbre**
   Tant que le doute subsiste : chercher l'événement 1 dont le `ProcessId` est le `ParentProcessId` du processus étudié, et recommencer.
4. **Son activité**
   Les événements 3, 11, 13 et 22 qui portent le même `ProcessId`.
5. **La session**
   Tous les événements du même Logon ID, Security et Sysmon.
:::

| Champ | Ce qui alerte |
| --- | --- |
| Image | Un dossier de transit : `C:\Temp`, `C:\Users\Public`, `Downloads`, `AppData`. |
| Nom | Aléatoire (`jqyvpqldou.exe`) ou trop court (`aa.exe`). |
| Hashes | Connu comme malveillant sur VirusTotal. |
| ParentImage | Un parent qui n'a pas de raison de lancer ce processus : Notepad qui lance `cmd.exe`. |
| Connexion (3) | IP externe sur le port 80 ou sur un port inhabituel comme 4444 ; IP connue comme malveillante. |
| DNS (22) | Domaine au nom aléatoire, ou extension souvent abusée (`.top`, `.click`). |
| Fichier (11) | Script (`.bat`, `.ps1`) ou exécutable (`.exe`, `.com`) déposé dans un dossier de transit, ou fichier placé dans le dossier Startup. |
| Registre (13) | Clé de démarrage automatique, comme `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`. |

## Historique PowerShell

Une fois `powershell.exe` lancé, toutes les commandes tapées tournent dans le même processus : Sysmon ne voit qu'un seul événement 1, sans les commandes. L'historique PowerShell, lui, les garde, un fichier texte par utilisateur :

```text title="historique PowerShell d'un utilisateur"
C:\Users\<utilisateur>\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

```powershell title="historiques de tous les utilisateurs de la machine"
Get-ChildItem C:\Users\*\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt
```

- Une ligne par commande, écrite dès qu'on appuie sur Entrée. Conservé après redémarrage, sans limite de date.
- Pas d'horodatage par commande : la date de création du fichier (Propriétés) donne celle de la première commande, sa date de modification celle de la dernière.
- Penser à **tous** les utilisateurs : un fichier par compte qui a utilisé PowerShell.

:::piege
L'historique ne contient ni le résultat des commandes, ni le contenu des scripts lancés (`.\script.ps1`), ni les commandes passées hors console interactive (`powershell -Command …`). Un attaquant peut aussi le supprimer ou désactiver son enregistrement : un fichier absent ne prouve rien.
:::
