---
title: "Web shell"
description: "L'attaquant dépose sur un serveur web un script qui lui permet d'exécuter des commandes à distance, pour entrer ou pour garder l'accès."
tags: [web, apache, nginx, php, auditd, wireshark]
updated: 2026-11-23
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

Il arrive par une faille d'upload (une application qui ne contrôle ni le type, ni l'extension, ni le contenu, ni la destination des fichiers), une mauvaise configuration, ou un accès déjà obtenu. Il sert donc à la fois de porte d'entrée et de moyen de **persistance**, puis de base pour la suite : reconnaissance, élévation de privilèges, déplacement latéral, exfiltration.

## Ce qu'on observe

Trois sources se complètent ; c'est leur **corrélation** qui confirme l'attaque : une requête suspecte dans le journal web, le fichier sur le disque, et ce qu'il a fait dans auditd.

### Journal d'accès du serveur web

```text title="requête suspecte dans un journal d'accès"
203.0.113.45 - - [23/Jul/2025:03:12:44 +0000] "POST /uploads/awebshell.php?cmd=d2hvYW1p HTTP/1.1" 200 312 "-" "curl/7.68.0"
```

| Champ | Ce qui alerte |
| --- | --- |
| IP | Inconnue, ou externe sur un serveur qui ne voit normalement que du trafic interne. |
| Horodatage | Hors des heures de travail. |
| Requête | `POST` vers un script dans un dossier d'upload, paramètre `cmd=` ou `exec=`, anormalement long ou encodé (`d2hvYW1p` = `whoami` en Base64 ; décoder avec CyberChef). |
| Referrer | Absent (`-`) : le fichier est appelé directement. |
| User-Agent | Outil (`curl`, `wget`), tronqué (`Mozilla/4.0` seul) ou obsolète (`MSIE 6.0`, sorti en 2001). |

Sur la durée, depuis une même IP et un même User-Agent :

:::etapes
1. **Fuzzing**
   Une rafale de `GET` presque tous en `404` : l'attaquant cherche un dossier ou un formulaire d'upload.
2. **Cible trouvée**
   Un `200` sur un dossier, puis sur une page d'upload.
3. **Dépôt**
   Un `POST` (ou un `PUT`) qui envoie le fichier.
4. **Utilisation**
   Des `GET` ou `POST` répétés vers ce même fichier.
:::

Autres méthodes à surveiller : `DELETE` pour effacer ses traces, `OPTIONS` et `HEAD` pour la reconnaissance.

### Fichiers sur le serveur

| Où chercher | Pourquoi |
| --- | --- |
| `/var/www/html/` | Racine par défaut d'Apache sur la plupart des distributions. |
| `/usr/share/nginx/html/` | Racine par défaut de Nginx. |
| `\inetpub\wwwroot\` | IIS : sur les serveurs Exchange, le sous-dossier `aspnet_client\` est une cible connue. |
| `uploads/`, `images/`, `admin/` | Dossiers d'upload, trouvés par fuzzing même si la racine a été changée. |
| `/tmp` | Si les permissions sont trop larges. |

Ce qui doit attirer l'œil : un script (`.php`, `.jsp`) là où il ne devrait pas y en avoir, une double extension (`image.jpg.php`), un nom aléatoire ou qui détonne, une fonction comme `eval(`.

### auditd

auditd enregistre ce que ses règles lui demandent : fichiers écrits dans un dossier, programmes lancés. Un web shell se voit comme un appel système `creat` (écriture d'un fichier) ou `execve` (exécution d'une commande) par `www-data`, à la même heure qu'un `POST` suspect dans le journal web.

**Réseau :** dans la capture, le code source du web shell est lisible dans le corps du `POST` d'upload ; ensuite, les commandes passent dans les requêtes, en clair ou encodées. Autres signes : protocole ou port inattendu, processus du serveur web qui lance des outils en ligne de commande.

## Détection

### Fichiers

```bash title="scripts PHP créés ou modifiés entre deux dates (période de l'incident)"
find /var/www -type f -name "*.php" -newerct "2025-07-01" ! -newerct "2025-08-01"
```

```bash title="fonction eval( dans les fichiers d'un site WordPress"
grep -r "eval(" wp-content
```

### auditd

```bash title="événements de la règle web_shell"
ausearch -k web_shell
```

### Wireshark

```wireshark title="requêtes par méthode : rafales ou méthodes inhabituelles"
http.request.method == "POST"
```

```wireshark title="requêtes vers des scripts PHP"
http.request.uri contains ".php"
```

```wireshark title="User-Agent, à mettre en colonne pour repérer les outils et les versions obsolètes"
http.user_agent
```

### Splunk (requête prête)

Requête : requêtes réussies vers des scripts, regroupées par domaine. Voir [Splunk — requêtes d'investigation](../../02-outils/splunk-requetes.md#web).

## Faux positifs

:::faux-positifs
- **Referrer absent** : navigateur qui le bloque pour la vie privée, URL saisie directement.
:::

:::piege
- **Ne pas s'arrêter au premier shell trouvé** : les attaquants en déposent souvent un second, de secours, dans les minutes qui suivent.
- **Chercher aussi les fichiers modifiés**, pas seulement les nouveaux : un shell peut être injecté dans un fichier légitime existant.
- **Le disque ne montre pas tout** : WordPress ou Django stockent le contenu en base de données ; un code injecté dans un article, un thème ou un réglage échappe à `find` et `grep`.
- **Une persistance dans l'application échappe aux journaux système** : un web shell déposé par un compte d'administration du site n'a besoin ni de tâche cron ni de clé SSH, et auditd ne le voit souvent pas. Si un malware revient alors que toutes les persistances connues ont été vérifiées, penser à une application exposée compromise.
:::

## Réponse

À compléter.
