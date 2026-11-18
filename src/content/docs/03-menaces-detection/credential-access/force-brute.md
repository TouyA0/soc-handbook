---
title: "Force brute et pulvérisation de mots de passe"
description: "L'attaquant enchaîne les tentatives de connexion : beaucoup de mots de passe sur un compte, ou un mot de passe courant sur beaucoup de comptes."
tags: [windows, rdp, authentification, event-id]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1110
tactic: credential-access
severity: med
platforms: [Windows]
data_sources: [Journal Security, Capture réseau]
related:
  - 03-menaces-detection/persistence/creation-de-compte
---

## Description

L'attaquant essaie des mots de passe sur un service exposé (bureau à distance, SSH, FTP, formulaire web) jusqu'à ce que l'un fonctionne. Deux variantes :

- **Force brute** (:attack[T1110.001]) : un compte, souvent `Administrator`, et une longue liste de mots de passe.
- **Pulvérisation de mots de passe** (:attack[T1110.003]) : quelques mots de passe courants essayés sur beaucoup de comptes, lentement, pour ne pas déclencher le verrouillage des comptes.

Si l'attaque réussit, elle se termine par une connexion réussie : c'est le point d'entrée de la suite de l'attaque.

## Ce qu'on observe

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4625 | **Échec de connexion**<br>En série depuis une même source. Type 3 pour du RDP avec NLA (le cas par défaut aujourd'hui), type 10 sans NLA. |
| 4624 | **Connexion réussie**<br>Après les échecs, depuis la même IP : l'attaque a abouti. En RDP, type 10, précédé d'un type 3 quand NLA est activé. |

Ce qui oriente le diagnostic :

- **Beaucoup d'échecs sur un seul compte** : force brute.
- **Beaucoup de comptes différents** (`admin`, `helpdesk`, `cctv`…) : pulvérisation.
- **Un nom de machine source hors du modèle de l'entreprise** : `kali` au lieu de `THM-PC-06`.
- **Une IP source inattendue** : une imprimante qui se connecte en RDP à un serveur.

Le motif de l'échec (champ `SubStatus`, sinon `Status`) distingue les deux variantes :

| Code | Signification |
| --- | --- |
| `0xC000006A` | Mot de passe incorrect pour un compte existant : force brute sur ce compte. |
| `0xC0000064` | Le compte n'existe pas : l'attaquant devine les noms de comptes. |
| `0xC0000234` | Compte verrouillé : le seuil de verrouillage a été atteint. |
| `0xC0000072` | Compte désactivé. |

**Réseau :** sur un protocole en clair, les échecs se voient aussi dans la capture : réponses [FTP `530`](../../02-outils/wireshark.md#ftp), [HTTP `401`](../../02-outils/wireshark.md#http).

## Détection

### Observateur d'événements

Filtrer le journal Security sur `4625` (Filter Current Log), puis trier par compte ou par IP. Pour les connexions réussies, filtre XML (Filter Current Log › onglet XML › Edit query manually) :

```xml title="connexions RDP réussies (type 10)"
<QueryList>
  <Query Id="0" Path="Security">
    <Select Path="Security">*[System[(EventID=4624)]] and *[EventData[Data[@Name='LogonType']='10']]</Select>
  </Query>
</QueryList>
```

```xml title="connexions réussies depuis l'IP de l'attaque"
<QueryList>
  <Query Id="0" Path="Security">
    <Select Path="Security">*[System[(EventID=4624)]] and *[EventData[Data[@Name='IpAddress']='203.0.113.45']]</Select>
  </Query>
</QueryList>
```

### PowerShell

Pour compter, plus rapide que l'Observateur. Sur un fichier exporté, remplacer `LogName='Security'` par `Path='C:\chemin\Security.evtx'`.

```powershell title="échecs de connexion par IP source"
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} |
  ForEach-Object { ([xml]$_.ToXml()).Event.EventData.Data | Where-Object Name -eq 'IpAddress' } |
  Group-Object '#text' | Sort-Object Count -Descending | Select-Object Count, Name
```

```powershell title="échecs de connexion par compte visé"
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} |
  ForEach-Object { ([xml]$_.ToXml()).Event.EventData.Data | Where-Object Name -eq 'TargetUserName' } |
  Group-Object '#text' | Sort-Object Count -Descending | Select-Object Count, Name
```

Une fois la connexion réussie trouvée, noter son **Logon ID** et [suivre la session](../../01-fondamentaux/journaux-windows.md#suivre-une-session) : comptes créés, processus lancés.

## Faux positifs

:::faux-positifs
- **Utilisateur qui se trompe** : quelques échecs, puis une réussite, depuis son poste habituel.
- **Mot de passe changé récemment** : un téléphone, un lecteur réseau ou un service garde l'ancien et échoue à intervalle régulier, toujours sur le même compte.
- **Scanner de vulnérabilités** autorisé, depuis une IP connue.
:::

:::piege
- **Avec NLA, un RDP qui échoue est de type 3**, pas 10 : filtrer seulement le type 10 fait rater la force brute RDP.
- **Le nom de machine d'un 4624 de type 10 n'est pas fiable** : le vrai nom du poste source est dans le 4624 de type 3 qui le précède.
- **La pulvérisation est lente** : une tentative par compte, de loin en loin. Compter les comptes distincts par IP sur plusieurs heures, pas les échecs par minute.
:::

## Réponse

À compléter.
