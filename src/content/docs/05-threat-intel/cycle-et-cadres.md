---
title: "Cycle et cadres de la CTI"
description: "Types de renseignement, flux et plateformes, cycle du renseignement en six phases, et cadres communs : MITRE ATT&CK, D3FEND, Cyber Kill Chain, CVE et CVSS, STIX et TAXII."
tags: [cti, mitre-attack, kill-chain, stix, taxii, cve]
updated: 2026-11-23
draft: false
order: 3
---

## Types de renseignement

| Type | Ce qu'il couvre | Exemple |
| --- | --- | --- |
| Stratégique | Le paysage des menaces, les tendances, pour les décisions de l'entreprise. | Un rapport annuel qui prévoit, dans la santé, un passage du rançongiciel à l'extorsion par destruction de données. |
| Tactique | Les comportements des attaquants (TTP). | Un avis sur un nouvel usage de Visual Basic (T1059.005) dans des campagnes de spam. |
| Opérationnel | Une campagne précise : motivations, intentions, ce qu'elle vise dans l'organisation. | Quels actifs (personnes, processus, technologies) une campagne peut viser. |
| Technique | Les indicateurs atomiques : IP, hashes. | Les IOC d'une attaque. |

Le L1 escalade surtout du **technique**, observe et documente du **tactique**, et repère des tendances qui nourrissent l'**opérationnel**.

## Flux et plateformes

- **Flux** : une liste d'indicateurs livrée régulièrement (CSV, JSON, STIX, ou par TAXII). En ingérer trop sans tri noie les analystes sous les faux positifs.
- **Plateforme** : le référentiel qui stocke les indicateurs, suit leur enrichissement, relie les éléments entre eux et applique les droits de partage. Exemples open source : **MISP**, **OpenCTI**. C'est la source de vérité : on l'interroge en premier.

Bonne pratique : ajouter les flux un par un, vérifier qu'ils correspondent aux menaces qui visent l'organisation, et ne les verser dans la plateforme qu'après avoir mesuré leur utilité.

## Le cycle du renseignement

:::etapes
1. **Direction**
   Définir la mission : l'actif à protéger, le risque, les contrôles disponibles (blocage par IP ou domaine au pare-feu, mise en quarantaine par hash dans l'EDR), et des questions mesurables. Exemple : quelles IP exploitent en ce moment des serveurs PostgreSQL ? Quels malwares visent leurs identifiants cette semaine, avec quels hashes ?
2. **Collecte**
   Réunir les indicateurs depuis plusieurs sources (flux de l'éditeur du pare-feu, AbuseIPDB, MISP interne, rapport d'éditeur), et en garder une copie datée.
3. **Traitement**
   **Normaliser** (format commun : domaines en minuscules, IPv6 compressées, sans masque de sous-réseau), **corréler** et dédoublonner avec ce qu'on a déjà (et repérer les contradictions, comme une IP jugée bénigne hier et malveillante aujourd'hui), étiqueter chaque entrée (source, date, TLP), puis produire des fichiers exploitables : liste de blocage pour le pare-feu, règles YARA pour l'EDR.
4. **Analyse**
   Juger la pertinence pour l'organisation et attribuer un [niveau de confiance](enrichir-un-indicateur.md#niveau-de-confiance) à chaque indicateur.
5. **Diffusion**
   Donner à chacun ce dont il a besoin pour agir, pas plus : un CSV et un ticket à l'équipe pare-feu, des règles YARA à l'équipe poste de travail, les indicateurs complets à la plateforme CTI, un résumé de 200 mots à la direction.
6. **Retour**
   Mesurer : temps de présence des IP avant blocage, taux de faux positifs des nouveaux blocages. Ajuster la direction et relancer le cycle.
:::

## MITRE ATT&CK

Un langage commun pour nommer un comportement, partagé par les éditeurs, les collègues et les auditeurs.

:::etapes
1. **Associer**
   Rattacher le comportement de l'alerte à une tactique et une technique.
2. **Noter l'identifiant**
   Dans la note de triage : « T1071.001 (C2 par le web) observé sur FINANCE-TRYHATME-00 ».
3. **Transmettre**
   Le L2 ou la réponse à incident savent aussitôt quelles mesures et quels profils d'attaquants s'appliquent.
:::

## MITRE D3FEND

L'inverse d'ATT&CK : un catalogue des **techniques de défense** (renforcement des identifiants, obfuscation des données…). Exemple : pour une alerte de tunnel DNS (T1048.003), D3FEND propose l'analyse des requêtes DNS, avec des contrôles concrets (bloquer les gros enregistrements TXT, alerter sur une entropie de requête inhabituelle). On ajoute la mesure la plus réaliste aux « prochaines actions » : une remédiation, pas seulement un diagnostic.

## Cyber Kill Chain

Le découpage d'une attaque en étapes par Lockheed Martin, pour situer ce qui s'est passé. Il a été enrichi depuis par d'autres cadres comme ATT&CK, jusqu'à l'*Unified Kill Chain*.

| Étape | But | Exemples |
| --- | --- | --- |
| Reconnaissance | Se renseigner sur la victime. | Collecte d'emails, OSINT, réseaux sociaux, scans. |
| Weaponisation | Préparer le malware selon l'objectif. | Exploit avec porte dérobée, document Office malveillant. |
| Delivery | Livrer le malware. | Email, lien web, clé USB. |
| Exploitation | Exploiter une faille pour exécuter du code. | EternalBlue, Zerologon. |
| Installation | Installer malwares et outils pour garder l'accès. | Vol de mots de passe, portes dérobées, RAT. |
| Command & Control | Contrôler la machine à distance, déposer d'autres outils, se déplacer, élever ses privilèges. | Empire, Cobalt Strike. |
| Actions on Objectives | Atteindre le but : gain financier, espionnage, exfiltration. | Chiffrement, rançongiciel, défiguration. |

## CVE, CVSS et NVD

| Sigle | Ce que c'est |
| --- | --- |
| CVE | Le numéro de catalogue d'une vulnérabilité connue, par exemple `CVE-2023-4863`. |
| CVSS | Son score de gravité, de 0 à 10, ajustable selon le temps et l'environnement. |
| NVD | La base de référence qui relie chaque CVE à son score CVSS, aux exploits et aux produits touchés. |

## STIX et TAXII : partager

- **STIX** : un format JSON pour décrire indicateurs, relations et contexte de façon lisible par une machine.
- **TAXII** : des API sécurisées pour échanger du renseignement presque en temps réel. Deux modèles : **Collection** (le producteur héberge les données) et **Channel** (un serveur central les publie aux abonnés).

Partager raccourcit le délai entre l'incident d'une autre organisation et sa propre protection, et rend la pareille. Mais tout ne se partage pas : lois sur la vie privée, accords de confidentialité, informations concurrentielles, et partager trop tôt peut prévenir l'attaquant qu'il a été repéré.

Les rapports des éditeurs (Mandiant, Unit 42 de Palo Alto) sont une autre forme de diffusion du renseignement.
