---
title: "Elastic — requêtes d'investigation"
description: "Enquêter dans Kibana : préparer la vue, construire un tableau de champs, et des requêtes KQL pour suivre une attaque des journaux web jusqu'à Sysmon, Security et PowerShell."
tags: [siem, elastic, kibana, kql, sysmon]
updated: 2026-11-23
draft: false
---

## Préparer Kibana

:::etapes
1. **Choisir la vue de données**
   Le *Data view* qui regroupe les index de l'enquête.
2. **Choisir la période**
   *Entire data range* pour voir tous les journaux, puis resserrer.
3. **Filtrer sur un index**
   `_index:weblogs` par exemple, pour commencer par une seule source.
4. **Construire un tableau**
   Le bouton « + » à côté d'un champ, dans la liste de gauche, l'ajoute en colonne : les journaux deviennent lisibles d'un coup d'œil.
5. **Trier de l'ancien au récent**
   *Old-New*, pour lire l'attaque dans l'ordre.
:::

La syntaxe est le KQL de Kibana : `champ:valeur`, `and`, `or`, parenthèses, et comparaisons de dates comme `@timestamp >= "2025-07-20T05:11:22"`.

**Repérer une valeur rare.** Un clic sur un champ, dans la liste de gauche, affiche ses valeurs les plus fréquentes avec leur pourcentage. La valeur très minoritaire est la première à regarder (un `user_agent` qui n'est pas un navigateur, à 0,4 % contre 99,6 % de `Mozilla/5.0`) ; le « + » à côté l'ajoute en filtre. Les pourcentages portent sur un échantillon (500 événements), pas sur tous les résultats. Pratiqué dans [ItsyBitsy](../06-write-ups/siem/itsybitsy.md).

## Journaux web (IIS)

```kql title="les POST d'une IP suspecte"
_index:weblogs and client.ip:203.0.113.55 and http.request.method:POST
```

Colonnes utiles : `client.ip`, `user.agent`, `http.request.method`, `url.path`, `http.response.status_code`. Un User-Agent de script et une page vulnérable connue (`proxyLogon.ecp`, la faille ProxyLogon d'Exchange) : des requêtes automatisées qui exploitent la faille.

```kql title="les GET d'une IP vers un fichier : web shell"
_index:weblogs and client.ip:203.0.113.55 and http.request.method:GET and errorEE.aspx
```

Un paramètre `cmd=` dans `url.path` est la signature d'un web shell : la commande est ajoutée directement à l'URL (`cmd=id`). Trié de l'ancien au récent, `url.path` montre les commandes passées une à une. Voir [Web shell](../03-menaces-detection/persistence/web-shell.md).

## Connexions (Security 4624)

```kql title="connexions d'un compte à une machine, après une heure donnée"
@timestamp >= "2025-07-20T05:11:22" and winlog.event_id:4624 and host.name:winserv2019.some.corp and winlog.event_data.TargetUserName:Administrator
```

| Information | Champ |
| --- | --- |
| Event ID | `winlog.event_id` |
| Machine | `host.name` : celle sur laquelle la connexion a lieu. |
| Compte | `winlog.event_data.TargetUserName` : le compte connecté. |
| Type | `winlog.logon.type` : le type de connexion (RDP…). |
| IP source | `winlog.event_data.IpAddress` : la même que l'attaque web ? |

## Processus (Sysmon 1)

```kql title="processus lancés par un compte après sa connexion"
@timestamp >= "2025-07-20T05:11:22" and winlog.event_id:1 and user.name:Administrator
```

Colonnes : `user.name`, `process.parent.name`, `process.command_line`. Juste après une connexion, une chaîne de processus d'ouverture de session est normale : il faut regarder la suite.

```kql title="commandes lancées par cmd.exe"
@timestamp >= "2025-07-20T05:13:15" and process.parent.name:cmd.exe and user.name:Administrator
```

## Comptes et groupes (Security)

```kql title="gestion des comptes, par catégorie lisible"
@timestamp >= "2025-07-20T05:13:10.000" and winlog.channel:Security and winlog.task:User Account Management
```

`winlog.task` donne en clair le type d'activité. Colonnes : `winlog.event_id`, `winlog.task`, `message`.

```kql title="corréler commandes et ajouts à un groupe (Sysmon 1 et Security 4732)"
@timestamp >= "2025-07-20T05:13:15" and (winlog.event_id:4732 or process.parent.name:cmd.exe)
```

## PowerShell (4104)

```kql title="commandes PowerShell en clair"
@timestamp >= "2025-07-20T05:13:15" and event.module:powershell and event.code:4104
```

Ajouter la colonne `powershell.file.script_block_text` : les commandes passées, en texte. `whoami` et `whoami /priv` en premier : de la [découverte](../03-menaces-detection/discovery/decouverte-du-systeme.md).

## Une ligne de commande suspecte : premiers réflexes

:::etapes
1. **Délimiter**
   Quels processus enfants `cmd.exe` a-t-il lancés ?
2. **Remonter l'origine**
   Qui a lancé `cmd.exe`, et pourquoi ?
3. **Chercher un changement de droits**
   Des commandes comme `net` qui ajoutent un compte à un groupe.
4. **Corréler**
   Confirmer avec Sysmon et les journaux Security.
:::

## Sans alerte

Toute action malveillante ne déclenche pas d'alerte. Un logiciel légitime chez le client (un outil d'archivage comme `Rar.exe`) ne lève rien, même utilisé par l'attaquant pour préparer une exfiltration.

```kql title="toutes les exécutions d'un programme"
process.name: "Rar.exe"
```

Trois questions : y a-t-il assez d'éléments pour dire que c'est malveillant ? Quel compte l'a lancé, quand, comment (corrélation entre sources) ? Le moment ou le processus parent trahissent-ils un abus ? Si oui, on escalade avec des preuves.

Pour Splunk, voir [Splunk — requêtes d'investigation](splunk-requetes.md).
