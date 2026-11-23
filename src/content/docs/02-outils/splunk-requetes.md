---
title: "Splunk — requêtes d'investigation"
description: "Ce qu'apporte un SIEM, les pièges du temps et de la normalisation, et des requêtes Splunk prêtes à l'emploi pour enquêter sur Windows, Linux et les serveurs web."
tags: [siem, splunk, spl, sysmon, auth-log]
updated: 2026-11-23
draft: false
---

## Ce qu'apporte le SIEM

| Atout | En pratique |
| --- | --- |
| Centralisation | Tous les journaux (réseau, postes, cloud, identités) au même endroit : pas besoin de se connecter à l'IPS puis à l'EDR. |
| Corrélation | Relier des événements de sources différentes. Une alerte IDS ne donne qu'une IP : les journaux Windows ou Sysmon disent quelle machine, quel utilisateur, quel outil. |
| Historique | Revenir en arrière : un utilisateur qui se connecte d'un lieu inhabituel s'y est-il déjà connecté ? |

Sources de journaux : **hôtes** (postes et serveurs, présents dans presque toute attaque), **réseau** (pare-feu, routeurs, IDS / IPS : qui communique avec qui), **web** (porte d'entrée fréquente), plus le cloud, les fournisseurs d'identité et les applications.

:::piege
**Le fuseau horaire.** Les sources n'enregistrent pas toutes l'heure de la même façon : UTC, heure locale, ou sans fuseau. Et l'heure affichée par le SIEM peut différer de la sienne : à 17 h en UTC-2, des journaux normalisés en UTC+2 s'affichent à 21 h. Ce n'est pas un retard d'ingestion. Toujours savoir dans quel fuseau on lit.
:::

**Normalisation** : chaque source a son format (JSON, XML, texte) et ses noms de champs. Le SIEM les ramène à une structure commune, ce qui rend la recherche, le filtrage et la corrélation possibles.

Dans les requêtes ci-dessous, adapter le nom de l'index et des champs à son propre SIEM.

## Windows

Les deux sources principales : les journaux d'événements Windows et Sysmon (à installer). Voir [Journaux Windows](../01-fondamentaux/journaux-windows.md).

```spl title="Sysmon 1 : PowerShell lancé avec une commande encodée"
index=winenv EventCode=1 *powershell* AND *EncodedCommand*
| table _time ComputerName ParentUser ParentImage ParentCommandLine Image CommandLine
```

Regarder le parent : par exemple un fichier `.js` lancé depuis `C:\Users\Public`, qui démarre `cmd.exe`, qui démarre PowerShell.

```spl title="Sysmon 3 : connexions réseau d'une machine"
index=winenv EventCode=3 ComputerName=WINHOST05
| table _time ComputerName Image SourceIp SourcePort DestinationIp DestinationPort Protocol
```

Ce qui alerte : un processus au nom aléatoire dans un dossier `Temp`, un port inhabituel (9999). Vérifier l'IP de destination dans la [threat intelligence](../05-threat-intel/ip-et-domaines.md).

```spl title="Security : comptes créés et activés"
index=winenv EventCode=4720 OR EventCode=4722
| table _time EventCode ComputerName Subject_Account_Name Target_Account_Name New_Account_Account_Name Keywords
```

```spl title="System : services créés, démarrés ou arrêtés"
index=winenv EventCode=7045 OR EventCode=7036 ComputerName=WINHOST05
| table _time EventCode ComputerName Service_Name Service_Account Service_File_Name Message
```

Un service qui lance un exécutable depuis `Temp` sous le compte SYSTEM, alors que l'attaquant n'avait qu'un compte utilisateur : probable élévation de privilèges.

## Linux

Les deux sources principales : `auth.log` (connexions, `sudo`) et `syslog` (services, redémarrages, cron). Voir [Journaux Linux](../01-fondamentaux/journaux-linux.md).

```spl title="auth.log : connexions SSH réussies et échouées pour un compte"
index=linux source="auth.log" *ubuntu* process=sshd
| search "Accepted password" OR "Failed password"
```

Beaucoup de `Failed password` puis des `Accepted password` : une force brute réussie, à escalader.

```spl title="auth.log : passages à un autre compte (su), dans l'ordre"
index=linux source="auth.log" *su*
| sort + _time
```

`auth.log` montre qu'un utilisateur est devenu root, pas comment : il faut d'autres journaux pour ça.

```spl title="syslog : tâches cron qui lancent un script ou un interpréteur"
index=linux sourcetype=syslog ("CRON" OR "cron")
| search ("python" OR "perl" OR "ruby" OR ".sh" OR "bash" OR "nc")
```

Ce qui alerte : un script de `/tmp` lancé toutes les 5 minutes, un reverse shell en Perl vers une IP et un port.

## Web

Dans les journaux d'accès (Apache, Nginx) : scans, dénis de service, attaques web, web shells. Les journaux d'erreurs aident aussi à comprendre une panne.

```spl title="force brute sur la connexion WordPress : plus de 25 POST en 5 minutes par IP"
index=* method=POST uri_path="/wp-login.php"
| bin _time span=5m
| stats values(referer_domain) as referer_domain values(status) as status values(useragent) as UserAgent values(uri_path) as uri_path count by clientip _time
| where count > 25
| table referer_domain clientip UserAgent uri_path count status
```

Regarder le User-Agent : un outil comme Hydra signe l'attaque.

```spl title="web shell possible : requêtes réussies vers des scripts ou exécutables"
index=*
| search status=200 AND uri_path IN(*.php, *.phtm, *.asp, *.aspx, *.jsp, *.exe) AND (method=POST OR method=GET)
| stats values(status) as status values(useragent) as UserAgent values(method) as method values(uri) as uri values(clientip) as clientip count by referer_domain
| where count > 2
| table referer_domain count method status clientip UserAgent uri
```

Chercher un nom qui détonne parmi les URI (`505.php`). Voir [Web shell](../03-menaces-detection/persistence/web-shell.md).

```spl title="déni de service : plus de 100 000 réponses 503 en 10 minutes par IP"
index=* status=503
| bin _time span=10m
| stats values(referer_domain) as referer_domain values(status) as status values(useragent) as UserAgent values(uri_path) as uri_path count by clientip _time
| where count > 100000
| table _time referer_domain clientip UserAgent uri_path count status
```

Voir [Déni de service applicatif](../03-menaces-detection/impact/deni-de-service-applicatif.md). Les seuils (25, 2, 100 000) sont des exemples.
