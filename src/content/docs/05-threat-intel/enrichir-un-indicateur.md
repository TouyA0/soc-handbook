---
title: "Enrichir un indicateur"
description: "Transformer un artefact d'alerte (IP, domaine, URL, hash, email, clé de registre) en renseignement : où chercher, comment juger la source, quel niveau de confiance, et comment respecter le TLP."
tags: [cti, ioc, enrichissement, tlp, virustotal]
updated: 2026-11-23
draft: false
order: 1
---

## De la donnée au renseignement

| Niveau | Action du L1 | Définition | Exemple |
| --- | --- | --- | --- |
| Donnée | Relever l'artefact. | Un observable brut. | `45.155.205.3:443` |
| Information | Noter ses attributs. | La donnée et des faits sur elle. | IP enregistrée chez Hetzner, vue pour la première fois le 14/07/2023. |
| Renseignement | Escalader, ou écarter. | L'information analysée, qui répond à « et alors ? ». | L'IP appartient au C2 actuel de BumbleBee : à bloquer tout de suite. |

Le rôle du L1 : **enrichir** l'artefact jusqu'à ce qu'il devienne du renseignement, ou montrer qu'il ne le sera jamais. L'enrichissement, ce sont des recherches rapides et méthodiques dans des sources publiques, commerciales et internes, sur l'origine, le comportement et la pertinence de l'indicateur.

| Terme | Ce que c'est | Exemple |
| --- | --- | --- |
| IOC | *Indicator of Compromise* : la preuve d'une intrusion. | Une adresse de C2 dans les journaux. |
| IOA | *Indicator of Attack* : une action malveillante en cours. | PowerShell qui lance un service inconnu. |
| TTP | *Tactics, Techniques and Procedures* : la méthode de l'attaquant, exprimée en identifiants MITRE ATT&CK. | T1059.001, PowerShell. |

## Où chercher selon l'indicateur

Retenir quel **type** d'indicateur on a et où le chercher compte plus que connaître tous les outils.

| Indicateur | IOA ou TTP associé | Où chercher |
| --- | --- | --- |
| IP (v4, v6) | Échecs SSH répétés : T1110.001. | WHOIS (ASN, date d'attribution), relations dans VirusTotal, bannières dans Shodan. |
| Domaine | Pic de requêtes DNS vers un domaine créé il y a 24 h. | Âge dans le WHOIS, DNS passif (RiskIQ, SecurityTrails), urlscan.io. |
| URL | Un `POST` du navigateur vers `/gateway.php` avec une charge. | Réputation dans URLhaus, graphe de comportement dans urlscan.io, exécution dans Any.Run (réseau coupé). |
| Hash | Injection dans `regsvr32.exe` : T1055. | VirusTotal (statique et dynamique), Hybrid Analysis, MalShare. Détail : [fichiers et hashes](fichiers-et-hashes.md). |
| Email | Échec SPF et domaine enregistré récemment. | Analyse des en-têtes dans MXToolbox, Have I Been Pwned. |
| Artefact local | Clé Run : T1547.001. | Règles Sigma, prévalence dans l'EDR, base de connaissances de l'éditeur. |

:::astuce
Un dossier de favoris, ou un panneau de lancement dans le SIEM, qui ouvre ses recherches habituelles avec l'indicateur déjà rempli. Trente secondes gagnées par alerte, des heures sur un mois.
:::

## Juger la source

Noter **d'où vient** chaque indicateur : la crédibilité en dépend, et c'est ce qu'on examinera si un blocage perturbe l'activité.

| Source | Ce qu'elle vaut |
| --- | --- |
| Interne | Journaux du SIEM, détections de l'EDR, emails signalés comme phishing : la plus pertinente sur le moment. |
| Commerciale | Flux payants des éditeurs, sandboxes payantes : très fiable, mais licence qui peut limiter l'export et le partage. |
| OSINT | AbuseIPDB, URLhaus, blogs avec IOC, recherche : à recouper avant d'agir. |
| Communautés, ISAC | Listes propres à un secteur (FS-ISAC), avec étiquettes et contexte. |

## Niveau de confiance

Bloquer tout ce qui paraît suspect crée des faux positifs. Avant d'agir, vérifier que l'indicateur concerne vraiment l'organisation : l'IP a-t-elle déjà tenté quelque chose sur le réseau (recherche dans le SIEM) ? Le malware vise-t-il un logiciel qu'on utilise ?

| Confiance | Sources | Vu localement | Action |
| --- | --- | --- | --- |
| Haute | Le même IOC dans au moins 2 sources. | Au moins une tentative. | Blocage immédiat. |
| Moyenne | Une seule source de confiance. | Rien. | Alerte seulement. |
| Faible | OSINT seulement. | Pas de contexte. | Surveiller 14 jours. |

## TLP : ce qu'on a le droit de partager

Le *Traffic Light Protocol* (FIRST.org) fixe jusqu'où un renseignement peut circuler. L'étiquette TLP d'un indicateur doit le **suivre** partout : plateforme, note de triage. La violer peut rompre un contrat et la confiance des partenaires.

| TLP | Partage | Ce que fait le L1 |
| --- | --- | --- |
| CLEAR | Sans restriction. | Wiki ou plateforme interne. |
| GREEN | La communauté de pairs, pas le public. | MISP ou espace Slack réservé aux SOC partenaires. |
| AMBER | Toute l'organisation ; à l'extérieur, seulement les clients qui en ont besoin. | Garder dans la plateforme CTI ; dans les tickets, y faire référence sans recopier. |
| RED | Les destinataires nommés seulement. | Note chiffrée ; pas dans les tickets sans autorisation. |

Quand un même indicateur arrive avec deux étiquettes différentes, **la plus stricte l'emporte**.
