---
title: "Création de compte"
description: "L'attaquant crée un compte, ou en réactive un ancien, et l'ajoute à un groupe privilégié pour garder l'accès à la machine."
tags: [windows, linux, comptes, persistance, event-id]
updated: 2026-11-19
draft: false
type: technique
attack_id: T1136
tactic: persistence
severity: high
platforms: [Windows, Linux]
data_sources: [Journal Security, auth.log]
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

**Linux :** les mêmes actions sont dans `/var/log/auth.log`, sous le nom de la commande. L'équivalent de l'ajout aux administrateurs est l'ajout au groupe `sudo`.

```text title="un ancien compte supprimé, un compte créé puis ajouté au groupe sudo"
2025-08-07T22:11:11 thm-vm userdel[1887]: delete user 'oldbackdoor'
2025-08-07T22:11:29 thm-vm useradd[1878]: new user: name=backdoor, UID=1002, GID=1002, shell=/bin/sh
2025-08-07T22:11:54 thm-vm usermod[1906]: add 'backdoor' to group 'sudo'
```

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

### auth.log (Linux)

```bash title="mots de passe changés, comptes créés, modifiés, supprimés"
cat /var/log/auth.log | grep -E '(passwd|useradd|usermod|userdel)\['
```

Le numéro entre crochets est le PID de la commande : `useradd[27254]` → `ausearch -i --ppid 27254` dans auditd, puis remonter l'[arbre des processus](../../01-fondamentaux/journaux-linux.md#remonter-larbre-des-processus) pour savoir qui a créé le compte. Autre accès persistant sans malware : une [clé SSH ajoutée](cle-ssh-ajoutee.md).

## Faux positifs

À compléter.

## Réponse

À compléter.
