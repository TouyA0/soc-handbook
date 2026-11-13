---
title: "Déni de service applicatif"
description: "L'attaquant sature un site ou une application web avec des requêtes HTTP, en nombre ou coûteuses, jusqu'à le rendre indisponible."
tags: [web, ddos, http, splunk, apache, nginx]
updated: 2026-11-13
draft: false
type: technique
attack_id: T1499
tactic: impact
severity: high
platforms: [Linux, Windows]
data_sources: [Journaux du serveur web]
---

## Description

Un déni de service (DoS) vise la **disponibilité** : le site rame, renvoie des erreurs ou ne répond plus. Au niveau applicatif (couche 7), l'attaquant n'a pas besoin d'un débit énorme : il cible ce qui coûte cher au serveur à chaque requête (authentification, recherche en base, écriture), ou exploite une entrée mal validée qui fait planter ou bloquer l'application.

Un DoS part d'une seule machine, limitée par son processeur, sa mémoire et sa connexion. Un **DDoS** (distribué) s'appuie sur un botnet, des milliers d'ordinateurs, objets connectés ou serveurs infectés, qui envoient tous des requêtes en même temps : beaucoup plus de volume, et des IP dispersées dans le monde.

| Type | Principe | Dans les journaux |
| --- | --- | --- |
| HTTP flood | Un très grand nombre de requêtes. | Pic de requêtes, souvent vers une même page. :attack[T1499.002] |
| Slowloris | Beaucoup de requêtes HTTP envoyées partiellement et laissées ouvertes, pour épuiser les connexions du serveur. | Peu de requêtes complètes ; des `408 Request Timeout` quand le serveur ferme les connexions. :attack[T1499.002] |
| Requête surdimensionnée | Forcer le serveur à traiter une requête très lourde. | Paramètres démesurés : `?limit=999999`, recherche géante. :attack[T1499.003] |
| Abus de formulaire | Saturer l'authentification avec des connexions ou des réinitialisations de mot de passe. | Rafale de `POST /login`, `/reset-password`. :attack[T1499.003] |
| Contournement du cache | Passer à côté des serveurs du CDN pour que le serveur d'origine réponde à tout. | Paramètres aléatoires ajoutés aux URL, qui rendent chaque requête unique. |
| Entrée mal validée | Une donnée inattendue qui fait bloquer ou planter l'application. | Peu de requêtes, au contenu anormal, suivies d'erreurs `5xx`. :attack[T1499.004] |

## Ce qu'on observe

| Indicateur | Exemple | Ce que ça indique |
| --- | --- | --- |
| Volume | `1000 × GET /login` depuis une IP | Une page coûteuse inondée. |
| Rafales | 50 requêtes dans la même seconde vers `/search` | Un rythme qu'aucun humain ne tient : de l'automatisation. |
| User-Agent | `curl/…`, `Python-urllib/3.x`, navigateur obsolète, ou un même User-Agent sur des centaines d'IP | Un outil ou un botnet ; certains varient les User-Agent pour paraître légitimes. |
| Géographie | IP venant du monde entier | Un botnet, quand les vrais clients viennent de quelques régions. |
| Paramètres | `GET /products?limit=999999` | Une requête conçue pour charger le serveur. |
| Erreurs `5xx` | Pic de `503 Service Unavailable` | Le serveur est à bout de ressources : l'attaque a de l'effet. |

Aucun indicateur ne suffit seul : c'est leur **accumulation** qui fait un DDoS.

**Pages visées en priorité**, parce que chaque requête y coûte cher au serveur : `/login` (authentification), `/search` (requêtes complexes en base), `/api/…` (contenu dynamique), `/register` et `/signup` (écriture en base), `/contact` et `/feedback` (écriture, envoi d'emails), `/cart` et `/checkout` (session, stock, paiement). Les pages statiques et les images coûtent peu et sont rarement visées.

À quoi ressemble l'attaque dans un journal d'accès, en condensé :

```text title="trafic normal, puis flood sur /login.php, puis service indisponible"
198.51.100.23 - - [23/Jul/2025:10:00:41 +0000] "GET /products/brakes HTTP/1.1" 200 5120 "https://shop.example/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
198.51.100.77 - - [23/Jul/2025:10:00:58 +0000] "GET /search?q=chain HTTP/1.1" 200 3310 "https://shop.example/" "Mozilla/5.0 (X11; Linux x86_64)"
203.0.113.55 - - [23/Jul/2025:10:01:10 +0000] "GET /login.php HTTP/1.1" 200 1024 "-" "curl/7.68.0"
203.0.113.55 - - [23/Jul/2025:10:01:10 +0000] "GET /login.php HTTP/1.1" 200 1024 "-" "curl/7.68.0"
203.0.113.55 - - [23/Jul/2025:10:01:10 +0000] "GET /login.php HTTP/1.1" 200 1024 "-" "curl/7.68.0"
198.51.100.23 - - [23/Jul/2025:10:02:05 +0000] "GET /cart HTTP/1.1" 503 299 "https://shop.example/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
```

Les trois questions de l'enquête : **quelle page** est visée, **depuis où** (une IP ou un botnet, quels User-Agent), et **à partir de quand** le service a cédé (premier `503` reçu par un vrai client).

## Détection

### Splunk — SPL

Champs extraits d'un journal d'accès Apache ou Nginx (`access_combined`) : `clientip`, `uri`, `status`, `useragent`. Remplacer `/login.php` par la page visée.

```spl title="pages les plus demandées : trouver la cible"
index=main
| top limit=10 uri
```

```spl title="IP qui sollicitent le plus la page visée"
index=main uri="/login.php"
| top limit=10 clientip
```

```spl title="nombre d'IP distinctes sur la page visée : taille du botnet"
index=main uri="/login.php"
| stats dc(clientip) AS ip_distinctes
```

Ce compte inclut les vrais clients : le restreindre à la fenêtre de l'attaque, ou aux IP qui dépassent un volume anormal.

```spl title="User-Agent les plus fréquents sur la page visée"
index=main uri="/login.php"
| top limit=10 useragent
```

```spl title="requêtes par seconde : forme et pic de l'attaque"
index=main
| timechart span=1s count
```

```spl title="codes de réponse par minute : quand le serveur a cédé"
index=main
| timechart span=1m count by status
```

```spl title="premières erreurs 503, dans l'ordre"
index=main status=503
| sort _time
| table _time clientip uri useragent
```

Dans ce dernier résultat, écarter les IP de l'attaque pour trouver le premier vrai client touché.

### Journal d'accès en ligne de commande

Pour un fichier `access.log` au format combiné, sans SIEM :

```bash title="IP les plus actives"
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head
```

```bash title="pages les plus demandées"
awk '{print $7}' access.log | sort | uniq -c | sort -rn | head
```

```bash title="secondes les plus chargées : rafales"
awk '{print $4}' access.log | sort | uniq -c | sort -rn | head
```

```bash title="erreurs 5xx par minute : début de l'indisponibilité"
awk '$9 ~ /^5/ {print substr($4, 2, 17)}' access.log | uniq -c
```

```bash title="User-Agent les plus fréquents"
awk -F'"' '{print $6}' access.log | sort | uniq -c | sort -rn | head
```

## Faux positifs

:::faux-positifs
- **Pic de trafic légitime** : soldes, lancement de produit, passage dans les médias. Les requêtes sont réparties sur de nombreuses pages, avec des navigateurs variés et des parcours cohérents (accueil, produit, panier).
- **Beaucoup de requêtes depuis une seule IP** : proxy d'entreprise, NAT ou CDN qui regroupent de nombreux utilisateurs derrière une même adresse.
- **`curl` ou scripts** : supervision, robots d'indexation, intégrations partenaires.
- **IP du monde entier** : normal pour un site à clientèle internationale.
:::

:::piege
- **Un botnet passe sous les seuils par IP** : des milliers d'IP qui envoient chacune peu de requêtes. Compter par page et par seconde, pas seulement par IP.
- **Un DDoS peut être une diversion** : pendant que l'équipe se concentre sur la disponibilité, une autre attaque est menée ailleurs. Garder un œil sur les autres alertes.
:::

## Réponse

À compléter.
