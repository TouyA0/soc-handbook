---
title: "Création de compte"
description: "L'attaquant crée un compte, ou en réactive un ancien, et l'ajoute à un groupe privilégié pour garder l'accès à la machine."
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

Après une intrusion par un service exposé (RDP avec un mot de passe faible), l'attaquant crée un compte pour revenir par le même chemin, et le rend privilégié (:attack[T1098]). Un compte créé ne peut ni se connecter en RDP ni administrer la machine : il l'ajoute donc à un groupe, le plus souvent **Administrators** ou **Remote Desktop Users**. Plus discret : réactiver un ancien compte, ou réinitialiser le mot de passe d'un compte inutilisé.

```text title="créer un compte et le rendre administrateur, en CMD puis en PowerShell"
net user "mr.backd00r" "p@ssw0rd!" /add
net localgroup Administrators "mr.backd00r" /add

New-LocalUser "mr.backd00r" -Password [...]
Add-LocalGroupMember "Administrators" -Member "mr.backd00r"
```

Par l'interface : Gestion de l'ordinateur, ou `lusrmgr.msc`.

Un compte inconnu au nom de service n'est pas forcément « un truc de Windows » : ne pas y toucher sans vérifier peut finir en rançongiciel. Certains rançongiciels réinitialisent aussi tous les mots de passe pour ralentir la reprise.

## Ce qu'on observe

| ID | Événement · ce qu'on cherche |
| --- | --- |
| 4720 | **Compte créé**<br>Le nouveau compte et ses attributs. |
| 4722 | **Compte activé**<br>Un ancien compte réveillé. |
| 4724 | **Mot de passe réinitialisé**<br>Prise de contrôle d'un compte existant. |
| 4732 | **Membre ajouté à un groupe**<br>Le groupe visé est dans les détails de l'événement. |

Dans chaque événement : **Subject**, qui a fait l'action (avec son Logon ID) ; l'**objet**, la cible (New Account, Member) ; les **détails** (groupe, attributs).

## Détection

### Observateur d'événements

Ne pas se fier au nom du compte (« hacker » n'arrive jamais) :

:::etapes
1. **Lister les créations et les ajouts**
   Journal Security, Filter Current Log sur `4720` et `4732` ; relire chaque événement.
2. **Qui a créé le compte ?**
   Le Subject. Quelqu'un de l'informatique peut-il confirmer l'action ?
3. **D'où venait sa session ?**
   Copier le Logon ID du Subject, le chercher (Find) : le 4624 correspondant donne l'IP source et l'heure de connexion. Sont-elles attendues ?
4. **Qu'a-t-elle fait d'autre ?**
   Les autres événements de la même session : [suivre une session](../../01-fondamentaux/journaux-windows.md#suivre-une-session).
:::

Signaux d'alerte :

- **Personne au service informatique** ne confirme l'action.
- **Hors des heures de travail** ou le week-end.
- **Un Subject inconnu ou inattendu** : `adm.old.2008` qui crée des utilisateurs.
- **Un nom hors du modèle de l'entreprise** : `backup` au lieu de `thm_svc_backup`.

## Faux positifs

À compléter.

## Réponse

À compléter.
