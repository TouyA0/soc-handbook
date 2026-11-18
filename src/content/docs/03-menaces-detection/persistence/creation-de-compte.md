---
title: "Création de compte"
description: "L'attaquant crée un compte, ou en réactive un ancien, et l'ajoute à des groupes privilégiés pour garder l'accès à la machine."
tags: [windows, comptes, persistance, event-id]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1136
tactic: persistence
severity: high
platforms: [Windows]
data_sources: [Journal Security]
related:
  - 03-menaces-detection/credential-access/force-brute
---

## Description

Une fois entré, l'attaquant se ménage un accès qui ne dépend plus du compte compromis : il crée un compte local (:attack[T1136.001]) ou de domaine (:attack[T1136.002]), en réactive un ancien, ou réinitialise le mot de passe d'un compte existant. Il l'ajoute ensuite à des groupes privilégiés, comme Administrators, Remote Desktop Users ou Backup Operators (:attack[T1098]).

Le nom imite souvent un compte système ou de service (`svc_…`, `backup`) : un compte inconnu n'est jamais « un truc de Windows » tant que personne ne l'a vérifié. Certains rançongiciels réinitialisent aussi tous les mots de passe pour ralentir la reprise.

## Ce qu'on observe

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4720 | **Compte créé**<br>Le nouveau compte et ses attributs. |
| 4722 | **Compte activé**<br>Suit souvent un 4720, ou réveille un ancien compte. |
| 4724 | **Mot de passe réinitialisé**<br>Prise de contrôle d'un compte existant. |
| 4732 | **Membre ajouté à un groupe local**<br>Le groupe visé est dans les détails de l'événement. |
| 4728 | **Membre ajouté à un groupe global du domaine**<br>Sur le contrôleur de domaine. |

Dans chaque événement : **Subject**, qui a fait l'action (avec son Logon ID) ; la **cible** (New Account, Member) ; les **détails** (groupe, attributs).

Signaux d'alerte :

- **Personne au service informatique** ne reconnaît l'action, et aucun ticket ne la justifie.
- **Hors des heures de travail** ou le week-end.
- **Un Subject inconnu ou inattendu** : un vieux compte d'administration qui crée des utilisateurs.
- **Un nom hors du modèle de l'entreprise** : `backup` au lieu de `thm_svc_backup`.
- **Un compte créé peu après une connexion suspecte**, par exemple à la suite d'une [force brute](../credential-access/force-brute.md).

## Détection

### Observateur d'événements

```xml title="créations, activations, réinitialisations et ajouts à un groupe"
<QueryList>
  <Query Id="0" Path="Security">
    <Select Path="Security">*[System[(EventID=4720 or EventID=4722 or EventID=4724 or EventID=4732 or EventID=4728)]]</Select>
  </Query>
</QueryList>
```

Pour chaque événement suspect, copier le Logon ID du Subject et retrouver le 4624 qui porte le même Logon ID : il donne l'origine de la session (IP, type de connexion). Méthode complète : [suivre une session](../../01-fondamentaux/journaux-windows.md#suivre-une-session).

### PowerShell

```powershell title="comptes locaux : état, dernière connexion, dernier changement de mot de passe"
Get-LocalUser | Select-Object Name, Enabled, LastLogon, PasswordLastSet
```

```powershell title="membres du groupe Administrators"
Get-LocalGroupMember -Group 'Administrators'
```

## Faux positifs

:::faux-positifs
- **Arrivée d'un employé**, réinitialisation de mot de passe par le support : vérifier le ticket correspondant.
- **Installation d'un logiciel** qui crée son propre compte de service.
:::

:::piege
- **L'état actuel ne suffit pas** : un compte créé, utilisé puis supprimé (4726) n'apparaît plus dans `Get-LocalUser`. Toujours chercher dans les journaux.
- **Pour un compte de domaine**, ces événements sont enregistrés sur le contrôleur de domaine, pas sur le poste où l'attaquant était connecté.
:::

## Réponse

À compléter.
