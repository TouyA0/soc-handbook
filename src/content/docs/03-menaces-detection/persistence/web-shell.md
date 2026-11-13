---
title: "Web shell"
description: "L'attaquant dépose sur un serveur web un script qui lui permet d'exécuter des commandes à distance, pour entrer ou pour garder l'accès."
tags: [web, apache, nginx, php, auditd, wireshark]
updated: 2026-11-13
draft: false
type: technique
attack_id: T1505.003
tactic: persistence
severity: high
platforms: [Linux, Windows]
data_sources: [Journaux du serveur web, auditd, Système de fichiers, Capture réseau]
---

## Description

Un web shell est un script déposé sur un serveur web (`.php`, `.jsp`, `.aspx`…) qui exécute les commandes qu'on lui passe dans une requête HTTP, par exemple `?cmd=whoami`. Il détourne les fonctions d'exécution système du langage : en PHP, `shell_exec()`, `exec()`, `system()`, `passthru()`.

Il arrive par une faille d'upload (une application qui ne contrôle ni le type, ni l'extension, ni le contenu, ni la destination des fichiers), une mauvaise configuration, ou un accès déjà obtenu. Il sert donc à la fois de porte d'entrée (:attack[T1190]) et de moyen de **persistance** : tant que le fichier est là, l'attaquant peut revenir.

## Ce qu'on observe

Trois sources se complètent ; c'est leur **corrélation** qui confirme l'attaque : une requête suspecte dans le journal web, le fichier correspondant sur le disque, et la commande qu'il a lancée dans auditd.

### Journal d'accès du serveur web

Une requête typique d'utilisation d'un web shell, au format combiné d'Apache et Nginx :

```text title="requête suspecte dans un journal d'accès"
203.0.113.45 - - [23/Jul/2025:03:12:44 +0000] "POST /uploads/awebshell.php?cmd=d2hvYW1p HTTP/1.1" 200 312 "-" "curl/7.68.0"
```

| Champ | Ce qui alerte ici |
| --- | --- |
| IP | Inconnue, ou externe alors que le serveur ne sert que le réseau interne. |
| Horodatage | 3 h du matin, hors des heures de travail. |
| Requête | Un `POST` vers un `.php` dans un dossier d'upload, avec un paramètre `cmd=` encodé en Base64 (`d2hvYW1p` = `whoami`). |
| Referrer | `-` : le fichier est appelé directement, sans venir d'une page du site. |
| User-Agent | `curl` : un outil, pas un navigateur. |

Sur la durée, l'enchaînement depuis une même IP et un même User-Agent :

:::etapes
1. **Fuzzing**
   Une rafale de requêtes, presque toutes en `404` : l'attaquant cherche un dossier ou un formulaire d'upload.
2. **Cible trouvée**
   Un `200` sur un dossier, puis sur une page d'upload.
3. **Dépôt**
   Un `POST` (ou un `PUT`) qui envoie le fichier.
4. **Utilisation**
   Des `GET` ou `POST` répétés vers ce même fichier, avec des commandes en paramètre.
:::

Autres User-Agent à repérer : tronqués (`Mozilla/4.0` seul), obsolètes (`MSIE 6.0`, sorti en 2001), outils (`wget`). Autres paramètres suspects : anormalement longs, `exec=`, encodés (Base64, URL) ; CyberChef décode la plupart des encodages.

### Fichiers sur le serveur

| Où chercher | Pourquoi |
| --- | --- |
| `/var/www/html/` | Racine par défaut d'Apache sur la plupart des distributions. |
| `/usr/share/nginx/html/` | Racine par défaut de Nginx sur beaucoup d'installations. |
| `\inetpub\wwwroot\` | Racine d'IIS (Windows, Exchange). |
| `uploads/`, `images/`, `admin/` | Dossiers d'upload, que l'attaquant trouve par fuzzing même si la racine a été changée. |
| `/tmp` | Si les permissions sont trop larges. |

Ce qui doit attirer l'œil : un script (`.php`, `.jsp`, `.aspx`) dans un dossier censé ne contenir que des images, une double extension (`image.jpg.php`), un nom aléatoire ou qui détonne, des fonctions comme `eval(` ou `shell_exec(`, et un fichier **légitime modifié** récemment.

### auditd

Avec des règles adaptées, auditd enregistre les fichiers créés dans les dossiers du site et les commandes lancées par l'utilisateur du serveur web. Un web shell se voit alors comme un appel système `creat` (écriture du fichier) ou `execve` (exécution d'une commande) fait par `www-data`, à la même heure qu'un `POST` suspect dans le journal web.

**Réseau :** dans la requête d'upload, le code source du web shell est lisible dans le corps du `POST` ; ensuite, les commandes passent dans les paramètres ou le corps des requêtes, en clair ou encodées.

## Détection

Dans les commandes, adapter les chemins : journal d'accès dans `/var/log/apache2/access.log` (Debian, Ubuntu), `/var/log/httpd/access_log` (Red Hat) ou `/var/log/nginx/access.log`.

### Journal d'accès

```bash title="requêtes avec une commande en paramètre"
grep -E "cmd=|exec=" /var/log/apache2/access.log
```

```bash title="POST vers un script PHP"
grep -E '"POST [^"]*\.php' /var/log/apache2/access.log
```

```bash title="IP qui génèrent le plus de 404 : le fuzzing"
awk '$9 == 404 {print $1}' /var/log/apache2/access.log | sort | uniq -c | sort -rn | head
```

```bash title="User-Agent les plus fréquents : repérer curl, wget, les navigateurs obsolètes"
awk -F'"' '{print $6}' /var/log/apache2/access.log | sort | uniq -c | sort -rn
```

Une fois le fichier suspect identifié, chercher **toutes** les requêtes vers lui et toutes celles de la même IP : elles donnent la date du dépôt et les commandes passées.

### Fichiers

```bash title="scripts PHP modifiés entre deux dates (période de l'incident)"
find /var/www -type f -name "*.php" -newerct "2025-07-01" ! -newerct "2025-08-01"
```

`-newerct` compare la date de **changement** (ctime) : elle bouge aussi quand un fichier existant est modifié, et l'attaquant ne peut pas la falsifier aussi facilement que la date de modification.

```bash title="scripts PHP dans un dossier d'upload"
find /var/www -type f -path "*upload*" -name "*.php"
```

```bash title="doubles extensions"
find /var/www -type f -name "*.*.php"
```

```bash title="fonctions d'exécution dans le code du site"
grep -rnE "eval\(|shell_exec\(|system\(|passthru\(" /var/www
```

Sur un CMS, cette dernière recherche remonte aussi du code légitime : regarder en priorité les fichiers récents ou situés dans des dossiers d'upload.

### auditd

```bash title="règle : écritures dans le dossier du site"
auditctl -w /var/www/html -p wa -k web_shell
```

```bash title="règle : commandes lancées par le serveur web (uid 33 = www-data sur Debian, Ubuntu)"
auditctl -a always,exit -F arch=b64 -S execve -F euid=33 -k web_exec
```

```bash title="lire les événements d'une règle"
ausearch -k web_exec -i
```

`-i` traduit les identifiants (uid, appels système) en noms lisibles. Vérifier l'uid du serveur web avec `id www-data` (ou `id apache` sur Red Hat).

### Wireshark

```wireshark title="uploads de fichiers"
http.request.method == "POST" && http.content_type contains "multipart/form-data"
```

```wireshark title="POST vers un script PHP"
http.request.method == "POST" && http.request.uri contains ".php"
```

```wireshark title="commande passée en paramètre"
http.request.uri contains "cmd="
```

:::astuce
Sur une requête suspecte, clic droit puis **Suivre › Flux HTTP** : on lit d'un bloc le code du shell envoyé ou les commandes et leurs résultats. Ajouter `http.user_agent` en colonne permet de repérer un `curl` au milieu du trafic.
:::

## Faux positifs

:::faux-positifs
- **Referrer absent** : navigateur qui le bloque pour la vie privée, URL saisie ou mise en favori.
- **`curl` ou `wget`** : scripts de supervision ou d'administration internes.
- **IP externe** : normale sur un site public ; suspecte seulement sur un serveur réservé au réseau interne.
- **Fonctions d'exécution dans le code** : utilisées légitimement par certains CMS et extensions.
:::

:::piege
- **Ne pas s'arrêter au premier shell trouvé** : les attaquants en déposent souvent un second, de secours, dans les minutes qui suivent.
- **Chercher aussi les fichiers modifiés**, pas seulement les nouveaux : un shell peut être injecté dans un fichier légitime existant.
- **Le disque ne montre pas tout** : WordPress ou Django stockent le contenu en base de données ; un code injecté dans un article, un thème ou un réglage échappe à `find` et `grep`.
:::

## Réponse

À compléter.
