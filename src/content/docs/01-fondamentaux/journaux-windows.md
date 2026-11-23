---
title: "Journaux Windows"
description: "Où trouver les journaux Windows et comment les lire dans l'Observateur d'événements, les Event IDs à connaître (Security, Sysmon), suivre une session ou un processus, et l'historique PowerShell."
tags: [windows, journaux, event-id, sysmon, powershell]
updated: 2026-11-18
draft: false
order: 1
---

## Où sont les journaux

Windows enregistre ses journaux au format binaire EVTX, un fichier par catégorie, dans `C:\Windows\System32\winevt\Logs`.

| Journal | Ce qu'il contient |
| --- | --- |
| Security | Connexions, processus, gestion des comptes. Le plus utile au SOC parmi les journaux actifs par défaut. |
| Application | Les événements des applications : serveur web IIS, base SQL Server… |
| Sysmon | Processus, réseau, fichiers, registre. Outil gratuit de Microsoft Sysinternals, à installer. Dans l'Observateur : Applications and Services › Microsoft › Windows › Sysmon › Operational. |

## Lire les journaux : l'Observateur d'événements

Win + R, `eventvwr`. Chaque journal est une entrée du panneau de gauche, chaque ligne un événement.

| Élément | À quoi il sert |
| --- | --- |
| Keywords | Pour certains événements, indique si l'action a réussi ou échoué. |
| Date and Time | L'heure de l'événement, **à l'heure du système, pas en UTC**. |
| Event ID | Le numéro du type d'événement : un échec de connexion est toujours 4625. |
| Onglet Details | Le contenu complet de l'événement, en texte ou en XML. |
| Filter Current Log | Filtrer par Event ID. |
| Find | Chercher une valeur dans les événements : un Logon ID, un ProcessId, un nom de fichier. |

## Event IDs essentiels

Plus de 500 Event IDs rien que pour Security, et tous ne sont pas journalisés par défaut.

### Connexions

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4624 | **Connexion réussie**<br>Connexions RDP ou réseau suspectes, point de départ d'une attaque. Champs clés : Logon ID, type de connexion, compte, IP et nom de la machine source. Journalisé sur la machine à laquelle on se connecte. Très bruyant. |
| 4625 | **Échec de connexion**<br>Force brute, pulvérisation de mots de passe, scan de vulnérabilités. Journalisé sur la machine visée. Plein de pièges d'interprétation. |

Types de connexion utiles : **3**, réseau (et RDP quand NLA est activé) ; **10**, bureau à distance (RDP).

### Comptes et groupes

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4720 | **Compte créé**<br>Compte de porte dérobée. |
| 4722 | **Compte activé**<br>Un ancien compte réactivé pour passer inaperçu. |
| 4738 | **Compte modifié** |
| 4725 | **Compte désactivé**<br>Des comptes privilégiés du SOC désactivés pour ralentir la réponse. |
| 4726 | **Compte supprimé** |
| 4723 | **Mot de passe changé par l'utilisateur** |
| 4724 | **Mot de passe réinitialisé**<br>Avec assez de droits, l'attaquant réinitialise le mot de passe d'un compte pour s'en servir. |
| 4732 | **Membre ajouté à un groupe**<br>Compte de porte dérobée ajouté à un groupe privilégié comme Administrators. |
| 4733 | **Membre retiré d'un groupe** |

Ces événements ont la même structure : **Subject**, le compte qui a fait l'action, avec son Logon ID ; l'**objet**, la cible (New Account, Member… selon l'événement) ; les **détails** (groupe visé, attributs du nouveau compte).

### Persistance

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 7045 | **Service installé (journal System)** |
| 7036 | **Service démarré ou arrêté (journal System)** |
| 4697 | **Service installé (journal Security)** |
| 4698 | **Tâche planifiée créée (journal Security)** |

### Processus

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4688 | **Processus créé (Security)**<br>Ligne de commande et processus parent. Désactivé par défaut. |
| 1 | **Processus créé (Sysmon)**<br>Processus (PID, chemin `Image`, ligne de commande), parent, binaire (hash, signature), utilisateur et Logon ID. À préférer à 4688. |

### Autres événements Sysmon

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 3 | **Connexion réseau**<br>Trafic d'un processus non fiable, ou vers une destination malveillante. |
| 11 | **Fichier créé**<br>Fichiers déposés par un malware. Équivalent Security (4656) désactivé par défaut. |
| 13 | **Valeur de registre modifiée**<br>Modifications du registre, par exemple pour la persistance. Équivalent Security (4657) désactivé par défaut. |
| 22 | **Requête DNS**<br>Domaines malveillants contactés. |

Sysmon se configure : on choisit ce qu'on journalise et ce qu'on ignore.

## Suivre une session

Chaque connexion réussie reçoit un **Logon ID** (par exemple `0x5D6AC`), identifiant unique de la session. C'est le fil qui relie ce qu'a fait un compte :

:::etapes
1. **Partir de la connexion**
   Dans le 4624, noter le Logon ID.
2. **Retrouver ses actions dans Security**
   Find sur ce Logon ID : comptes créés, groupes modifiés… Inversement, depuis un 4720 ou un 4732, son Logon ID mène au 4624 d'origine.
3. **Retrouver ses processus dans Sysmon**
   Find sur ce Logon ID dans le journal Sysmon : les événements 1 de la session.
4. **Retrouver l'activité de chaque processus**
   Les événements 3, 11, 13 et 22 n'ont ni Logon ID ni informations sur le parent : chercher leur `ProcessId` pour retrouver l'événement 1 correspondant.
:::

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
   Les événements Sysmon qui portent le même `ProcessId`.
5. **La session**
   Tous les événements Security et Sysmon du même Logon ID.
:::

| Champ | Ce qui alerte |
| --- | --- |
| Image | Un dossier inhabituel : `C:\Temp`, `C:\Users\Public`. |
| Nom | Suspect : trop court (`aa.exe`) ou aléatoire (`jqyvpqldou.exe`). |
| Hash | Connu comme malveillant sur VirusTotal. |
| ParentImage | Un parent inattendu : Notepad qui lance des commandes CMD. |
| Connexion (3) | IP externe sur le port 80 ou sur un port inhabituel comme 4444 ; IP connue comme malveillante. |
| DNS (22) | Domaine suspect : `.top`, `.click`, nom aléatoire. |
| Fichier (11) | Script (`.bat`, `.ps1`) ou exécutable (`.exe`, `.com`) déposé dans un dossier de transit, fichier servant à la persistance. |
| Registre (13) | Clé servant à la persistance. |

## Historique PowerShell

Une fois `powershell.exe` lancé, toutes les commandes tapées tournent dans le même processus : Sysmon ne voit qu'un seul événement 1, sans les commandes. L'historique PowerShell les garde :

```text title="historique PowerShell d'un utilisateur"
C:\Users\<utilisateur>\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadline\ConsoleHost_history.txt
```

- Un fichier texte **par utilisateur**, mis à jour dès qu'on appuie sur Entrée. Penser à regarder ceux de tous les comptes.
- Conservé après redémarrage, sans limite de durée, sauf suppression manuelle.
- Pas d'horodatage par commande : les Propriétés du fichier aident à dater.
- Ni le résultat des commandes, ni le contenu des scripts lancés (`.\script.ps1`).
