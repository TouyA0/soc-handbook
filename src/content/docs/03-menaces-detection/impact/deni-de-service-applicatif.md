---
title: "Déni de service applicatif"
description: "L'attaquant sature un site ou une application web avec des requêtes HTTP, en nombre ou coûteuses, jusqu'à le rendre indisponible."
tags: [web, ddos, http, splunk]
updated: 2026-11-23
draft: false
type: technique
attack_id: T1499
tactic: impact
severity: high
platforms: [Linux, Windows]
data_sources: [Journaux du serveur web]
---

## Description

Un déni de service (DoS) vise la **disponibilité** : le site rame, renvoie des erreurs ou ne répond plus. Au niveau applicatif (couche 7), une seule requête bien choisie peut suffire : un formulaire de recherche qui ne valide pas ses entrées peut bloquer l'application sur une donnée inattendue ou une requête énorme.

Un DoS part d'une seule machine, limitée par ses ressources et sa connexion. Un **DDoS** s'appuie sur un botnet (ordinateurs, objets connectés, serveurs infectés) : beaucoup plus de volume, et des IP du monde entier.

| Type | Principe |
| --- | --- |
| HTTP flood | Un très grand nombre de requêtes HTTP. |
| Slowloris | Beaucoup de requêtes HTTP partielles qui gardent occupées les ressources du serveur. |
| Contournement du cache | Passer à côté des serveurs du CDN pour forcer le serveur d'origine à répondre. |
| Requête surdimensionnée | Forcer le serveur à traiter des requêtes très lourdes. |
| Abus de formulaire | Saturer l'authentification de connexions ou de réinitialisations de mot de passe. |
| Entrée mal validée | Exploiter une gestion des entrées mal conçue. |

## Ce qu'on observe

| Indicateur | Exemple | Ce que ça indique |
| --- | --- | --- |
| Volume | `1000 × GET /login` depuis une IP | Une page coûteuse inondée. |
| Rafales | 50 requêtes dans la même seconde vers `/search` | De l'automatisation. |
| User-Agent | `curl/…`, `Python-urllib/3.x`, version obsolète | Un outil. Un botnet peut aussi varier les User-Agent pour paraître légitime. |
| Géographie | IP du monde entier | Un botnet, quand les vrais clients viennent de quelques régions. |
| Paramètres | `GET /products?limit=999999` | Une requête conçue pour charger le serveur. |
| Erreurs `5xx` | Pic de `503 Service Unavailable` | Le serveur est à bout de ressources. |

C'est **l'accumulation** de ces signaux qui fait un DDoS.

**Pages visées**, parce que chaque requête y coûte cher : `/login` (authentification), `/search` (requêtes en base), `/api/…` (contenu dynamique), `/register` et `/signup` (écriture en base), `/contact` et `/feedback` (écriture, envoi d'emails), `/cart` et `/checkout` (session, stock, paiement). Les pages statiques et les images coûtent peu.

```text title="trafic normal, puis flood sur /login.php, puis service indisponible"
198.51.100.23 - - [23/Jul/2025:10:00:41 +0000] "GET /products/brakes HTTP/1.1" 200 5120 "https://shop.example/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
203.0.113.55 - - [23/Jul/2025:10:01:10 +0000] "GET /login.php HTTP/1.1" 200 1024 "-" "curl/7.68.0"
203.0.113.55 - - [23/Jul/2025:10:01:10 +0000] "GET /login.php HTTP/1.1" 200 1024 "-" "curl/7.68.0"
203.0.113.55 - - [23/Jul/2025:10:01:10 +0000] "GET /login.php HTTP/1.1" 200 1024 "-" "curl/7.68.0"
198.51.100.23 - - [23/Jul/2025:10:02:05 +0000] "GET /cart HTTP/1.1" 503 299 "https://shop.example/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
```

Les questions de l'enquête : **quelle page** est visée, **depuis où** (combien d'IP, quels User-Agent), **à partir de quand** le service a cédé (premier `503` reçu par un vrai client).

## Détection

### Splunk — SPL

Dans le journal d'accès, Splunk extrait les champs `uri`, `clientip`, `useragent` et `status` : les ouvrir dans la barre latérale donne leurs valeurs les plus fréquentes.

```spl title="tous les événements du journal, point de départ"
index="main"
```

```spl title="les requêtes vers la page visée : regarder ensuite clientip et useragent"
index="main" uri="/login.php"
```

```spl title="requêtes par seconde : forme et pic de l'attaque"
index="main"
| timechart span=1s count
```

```spl title="les réponses 503 : quand le service a cédé"
index="main" status=503
```

Requête prête pour repérer plus de 100 000 réponses 503 en 10 minutes par IP : [Splunk — requêtes d'investigation](../../02-outils/splunk-requetes.md#web).

## Faux positifs

À compléter.

:::piege
**Un DDoS peut être une diversion** : pendant que l'équipe se bat pour la disponibilité, une autre attaque est menée ailleurs.
:::

## Réponse

À compléter.
