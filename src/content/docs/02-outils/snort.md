---
title: "Snort — règles et commandes"
description: "Écrire des règles Snort et utiliser ses modes : sniffer, journalisation, IDS / IPS et lecture de pcap."
tags: [ids, ips, snort, réseau, détection]
updated: 2026-10-05
draft: false
type: cheatsheet
tool: Snort
tested_version: "2.9 et 3"
---

Snort est un système de détection et de prévention d'intrusion (IDS / IPS) : il compare le trafic réseau à des règles et lève une alerte, ou bloque le paquet, quand une règle correspond. Par défaut, il ne voit que le trafic destiné à sa propre machine ; pour surveiller tout un réseau, l'interface doit être en mode promiscuité.

Deux générations coexistent : **Snort 2**, configuré par `snort.conf`, et **Snort 3**, configuré par `snort.lua`. Sauf mention contraire, les commandes de cette fiche sont celles de Snort 2 ; les différences de Snort 3 sont regroupées en fin de page.

## Format d'une règle

Une règle tient sur une ligne : un en-tête (action, protocole, source, direction, destination), puis des options entre parenthèses. Sans en-tête, la règle n'est pas traitée ; les options sont facultatives, mais indispensables pour détecter autre chose que du trafic grossier.

```text title="règle d'exemple : alerte sur tout ping vers le réseau surveillé"
alert icmp any any -> $HOME_NET any (msg:"Ping Detected"; sid:1000001; rev:1;)
```

| Élément | Rôle |
| --- | --- |
| `alert` | **Action** à exécuter quand la règle correspond. |
| `icmp` | **Protocole**. Snort 2 n'en accepte que quatre : `ip`, `tcp`, `udp`, `icmp`. Pour viser un protocole applicatif, on passe par le port (FTP : TCP sur le port 21). |
| `any any` | **IP source** puis **port source** ; `any` accepte n'importe quelle valeur. |
| `->` | **Direction** du flux : la source est à gauche, la destination à droite. |
| `$HOME_NET any` | **IP de destination** puis **port de destination**. `$HOME_NET` est une variable de la configuration : le réseau surveillé. |
| `(msg:"…"; sid:…; rev:…;)` | **Options**, séparées par des points-virgules. |

## Actions et direction

| Mot-clé | Effet |
| --- | --- |
| `alert` | Lève une alerte et journalise le paquet. |
| `log` | Journalise le paquet. |
| `drop` | Bloque le paquet et le journalise. |
| `reject` | Bloque le paquet, le journalise et met fin à la session. |
| `->` | Flux de la source vers la destination. |
| `<>` | Flux dans les deux sens. Il n'existe pas d'opérateur `<-`. |

`alert` sert en mode IDS ; `drop` et `reject` n'ont d'effet qu'en mode IPS.

## Adresses et ports

| Règle | Ce qu'elle filtre |
| --- | --- |
| `alert icmp 192.168.1.56 any <> any any (msg:"ICMP Packet From"; sid:1000001; rev:1;)` | Une adresse IP précise. |
| `alert icmp 192.168.1.0/24 any <> any any (msg:"ICMP Packet Found"; sid:1000001; rev:1;)` | Une plage d'adresses. |
| `alert icmp [192.168.1.0/24, 10.1.1.0/24] any <> any any (msg:"ICMP Packet Found"; sid:1000001; rev:1;)` | Plusieurs plages, entre crochets. |
| `alert icmp !192.168.1.0/24 any <> any any (msg:"ICMP Packet Found"; sid:1000001; rev:1;)` | Tout **sauf** cette plage : `!` est l'opérateur de négation. |
| `alert tcp any any <> any 21 (msg:"FTP Port 21 Command Activity Detected"; sid:1000001; rev:1;)` | Un port précis. |
| `alert tcp any any <> any !21 (msg:"Traffic Activity Without FTP Port 21 Command Channel"; sid:1000001; rev:1;)` | Tous les ports sauf celui-ci. |
| `alert tcp any any <> any 1:1024 (msg:"TCP 1-1024 System Port Activity"; sid:1000001; rev:1;)` | Une plage de ports, de 1 à 1024. |
| `alert tcp any any <> any :1024 (msg:"TCP 0-1024 System Port Activity"; sid:1000001; rev:1;)` | Les ports inférieurs ou égaux à 1024. |
| `alert tcp any any <> any 1025: (msg:"TCP Non-System Port Activity"; sid:1000001; rev:1;)` | Les ports supérieurs ou égaux à 1025. |
| `alert tcp any any <> any [21,23] (msg:"FTP and Telnet Port 21-23 Activity Detected"; sid:1000001; rev:1;)` | Une liste de ports : 21 et 23. |

## Options générales

| Option | Rôle |
| --- | --- |
| `msg:"ICMP Packet Found";` | Message affiché dans la console ou le journal quand la règle se déclenche : une ligne qui résume l'événement. |
| `sid:1000001;` | Identifiant unique de la règle. Moins de 100 : réservé. De 100 à 999 999 : règles livrées avec Snort. À partir de 1 000 000 : règles de l'utilisateur. Deux règles ne doivent jamais partager le même. |
| `rev:1;` | Numéro de révision, à incrémenter à chaque modification. Snort ne garde pas l'historique : c'est à l'analyste de le tenir. |
| `reference:cve,CVE-XXXX;` | Référence qui explique la règle ou la menace (identifiant CVE, source externe) : précieuse pendant l'investigation d'une alerte. |

## Options sur le contenu

Elles inspectent les données transportées par le paquet. Plus une règle cumule de motifs précis, plus l'analyse de chaque paquet prend du temps.

| Règle | Ce qu'elle fait |
| --- | --- |
| `alert tcp any any <> any 80 (msg:"GET Request Found"; content:"GET"; sid:1000001; rev:1;)` | `content` cherche un motif en texte. Sensible à la casse. Utilisable plusieurs fois dans une règle. |
| `alert tcp any any <> any 80 (msg:"GET Request Found"; content:"\|47 45 54\|"; sid:1000001; rev:1;)` | Même recherche, le motif étant donné en hexadécimal entre barres verticales. |
| `alert tcp any any <> any 80 (msg:"GET Request Found"; content:"GET"; nocase; sid:1000001; rev:1;)` | `nocase` rend la recherche insensible à la casse. |
| `alert tcp any any <> any 80 (msg:"GET Request Found"; content:"GET"; fast_pattern; content:"www"; sid:1000001; rev:1;)` | `fast_pattern` désigne le motif à tester en premier pour trier les paquets ; par défaut, Snort prend le plus long. Insensible à la casse, une seule fois par règle. |

## Options hors contenu

Elles portent sur les en-têtes du paquet, pas sur ses données.

| Règle | Ce qu'elle filtre |
| --- | --- |
| `alert tcp any any <> any any (msg:"ID TEST"; id:12345; sid:1000001; rev:1;)` | `id` : la valeur du champ IP ID. |
| `alert tcp any any <> any any (msg:"FLAG TEST"; flags:S; sid:1000001; rev:1;)` | `flags` : les drapeaux TCP. `F` FIN, `S` SYN, `R` RST, `P` PSH, `A` ACK, `U` URG. |
| `alert ip any any <> any any (msg:"SIZE TEST"; dsize:100<>300; sid:1000001; rev:1;)` | `dsize` : la taille des données du paquet. S'écrit aussi `dsize:>100;` ou `dsize:<100;`. |
| `alert ip any any <> any any (msg:"SAME-IP TEST"; sameip; sid:1000001; rev:1;)` | `sameip` : les paquets dont l'IP source et l'IP de destination sont identiques. |

## Vérifier l'installation

| Commande | Description |
| --- | --- |
| `snort -V` | Afficher la version installée. S'écrit aussi `--version`. |
| `sudo snort -c /etc/snort/snort.conf -T` | Tester le fichier de configuration : `-c` désigne le fichier, `-T` lance l'autotest. À faire avant toute utilisation. |
| `-q` | Mode silencieux : masque la bannière et les informations de démarrage. |

Un seul fichier de configuration est utilisé à l'exécution, mais on peut en garder plusieurs pour des usages différents et choisir avec `-c`.

## Mode sniffer

Snort affiche les paquets à l'écran, à la manière de tcpdump. `Ctrl + C` arrête la capture et affiche un résumé.

| Commande | Ce qui s'affiche |
| --- | --- |
| `sudo snort -v` | Mode verbeux : les en-têtes TCP/IP de chaque paquet. |
| `sudo snort -d` | Les données du paquet (payload) en plus. |
| `sudo snort -e` | Les en-têtes de la couche liaison, avec les adresses MAC. |
| `sudo snort -X` | Le paquet complet en hexadécimal. |
| `sudo snort -v -i eth0` | `-i` choisit l'interface à écouter. Avec une seule interface, Snort la prend par défaut. |
| `sudo snort -de` | Les options se combinent, collées ou séparées : `-vd`, `-de`, `-v -d -e`. |

## Mode journalisation

Snort enregistre les paquets au lieu de seulement les afficher. Lancé avec `sudo`, il crée des journaux qui appartiennent à `root`.

| Commande | Description |
| --- | --- |
| `sudo snort -dev -l .` | `-l` active la journalisation et fixe le dossier de sortie, ici le dossier courant. Sans lui, le dossier par défaut est `/var/log/snort`. Format par défaut : binaire, celui de tcpdump. |
| `sudo snort -dev -K ASCII -l .` | `-K ASCII` écrit des journaux lisibles dans un éditeur de texte : un dossier par adresse IP, un fichier par flux. Snort ne peut pas les relire. |
| `sudo snort -r snort.log.1638459842` | `-r` relit un journal binaire et l'affiche comme en mode sniffer. |
| `sudo snort -r logname.log -X` | Relire en affichant les paquets complets en hexadécimal. |
| `sudo snort -r logname.log icmp` | Relire en ne gardant qu'un protocole, grâce à un filtre BPF. |
| `sudo snort -r logname.log 'udp and port 53'` | Filtre BPF plus précis : protocole et port. |
| `sudo snort -dvr logname.log -n 10` | `-n` limite le nombre de paquets traités, ici les 10 premiers. |
| `sudo tcpdump -r snort.log.1638459842 -ntc 10` | Lire le même journal avec tcpdump. Wireshark sait aussi l'ouvrir. |
| `sudo chown username -R directory` | Devenir propriétaire d'un dossier de journaux pour les lire sans `sudo` ; `-R` traite le contenu récursivement. |

## Mode IDS / IPS

Snort applique ses règles au trafic. Si une alerte se déclenche, il crée un fichier `alert` dans le dossier des journaux. Les options d'affichage et de journalisation des modes précédents restent utilisables (`-i`, `-v`, `-d`, `-e`, `-X`, `-l`, `-K ASCII`).

| Commande | Description |
| --- | --- |
| `sudo snort -c /etc/snort/snort.conf -A console` | `-A console` : alertes courtes affichées dans la console. |
| `sudo snort -c /etc/snort/snort.conf -A cmg` | `-A cmg` : en-têtes de base et données du paquet, en hexadécimal et en texte, dans la console. |
| `sudo snort -c /etc/snort/snort.conf -A fast` | `-A fast` : message, horodatage, IP et ports source et destination. Rien dans la console, tout dans le fichier `alert`. |
| `sudo snort -c /etc/snort/snort.conf -A full` | `-A full` : toutes les informations disponibles sur l'alerte, dans le fichier `alert`. C'est le mode par défaut. |
| `sudo snort -c /etc/snort/snort.conf -A none` | `-A none` : aucune alerte, pas de fichier `alert`. Le trafic est quand même journalisé en binaire. |
| `sudo snort -c /etc/snort/snort.conf -N` | `-N` désactive la journalisation ; l'affichage dans la console reste possible. |
| `sudo snort -c /etc/snort/snort.conf -D` | `-D` lance Snort en arrière-plan : plus de sortie dans la console, les journaux continuent. Surtout utilisé dans des scripts, avec une configuration stable. |
| `ps -ef \| grep snort` | Retrouver le processus Snort lancé en arrière-plan. |
| `sudo kill -9 2898` | Arrêter ce processus, avec son numéro. |
| `sudo snort -c /etc/snort/rules/local.rules -A console` | Lancer Snort avec un fichier de règles seul, sans configuration : pratique pour tester ses propres règles, mais moins performant. |
| `sudo snort -c /etc/snort/snort.conf -q -Q --daq afpacket -i eth0:eth1 -A console` | Mode IPS : `-Q --daq afpacket` active le mode en coupure, `-i eth0:eth1` désigne les deux interfaces, minimum requis. Les paquets bloqués sont marqués `[Drop]`. |

Une alerte s'affiche sur une ligne, sous cette forme :

```text title="forme d'une alerte dans la console"
date-heure [**] [1:sid:rev] message [**] [Classification: …] [Priority: n] {PROTOCOLE} IP source -> IP destination
```

## Lire des pcap

Lu sans autre option, un pcap ne donne qu'un aperçu des paquets et des statistiques. L'intérêt est de lui appliquer les règles, pour retrouver vite des motifs de menace connus.

| Commande | Description |
| --- | --- |
| `snort -r icmp-test.pcap` | Lire un pcap : aperçu et statistiques. S'écrit aussi `--pcap-single=`. |
| `sudo snort -c /etc/snort/snort.conf -q -r icmp-test.pcap -A console -n 10` | Appliquer les règles à un pcap et afficher les alertes, sur les 10 premiers paquets. |
| `sudo snort -c /etc/snort/snort.conf -q --pcap-list="icmp-test.pcap http2.pcap" -A console` | `--pcap-list` traite plusieurs pcap, séparés par des espaces. |
| `sudo snort -c /etc/snort/snort.conf -q --pcap-list="icmp-test.pcap http2.pcap" -A console --pcap-show` | `--pcap-show` affiche le nom de chaque pcap pendant le traitement, pour savoir d'où vient chaque alerte. |

## Configuration (snort.conf)

`snort.conf` est le fichier de configuration principal : règles, greffons, mécanismes de détection, actions par défaut et sorties. Ne jamais le remplacer en bloc : le modifier à la main, ou mettre à jour les règles avec les outils prévus pour cela. Une ligne qui commence par `#` est en commentaire ; retirer le `#` l'active.

| Réglage | Rôle |
| --- | --- |
| `sudo gedit /etc/snort/snort.conf` | Ouvrir le fichier de configuration. |
| `sudo gedit /etc/snort/rules/local.rules` | Ouvrir le fichier des règles de l'utilisateur. |
| `HOME_NET` | Le réseau à protéger : `any` ou une plage comme `192.168.1.1/24`. |
| `EXTERNAL_NET` | Le réseau extérieur : `any` ou `!$HOME_NET`. |
| `RULE_PATH` | Dossier des règles : `/etc/snort/rules`. |
| `SO_RULE_PATH` | Règles fournies avec les jeux enregistré et abonné : `$RULE_PATH/so_rules`. |
| `PREPROC_RULE_PATH` | Règles fournies avec les jeux enregistré et abonné : `$RULE_PATH/plugin_rules`. |
| `config daq: afpacket` | Choix du module d'acquisition pour le mode IPS. |
| `config daq_mode: inline` | Active le mode en coupure. |
| `config logdir` | Dossier des journaux par défaut. |
| `include $RULE_PATH/local.rules` | Charge les règles de l'utilisateur. |
| `include $RULE_PATH/rulename` | Charge un fichier de règles livré ou téléchargé. |

Les réglages se trouvent dans les sections « Step #1 » (variables réseau), « Step #2 » (décodeur et mode IPS), « Step #6 » (sorties : format des journaux et des alertes) et « Step #7 » (règles chargées).

## Composants et jeux de règles

Les composants de Snort, dans l'ordre où un paquet les traverse :

- **Décodeur de paquets** : collecte les paquets et les prépare.
- **Préprocesseurs** : réorganisent et modifient les paquets pour le moteur de détection.
- **Moteur de détection** : le composant principal ; il analyse les paquets en leur appliquant les règles.
- **Journalisation et alertes** : produit les journaux et les alertes.
- **Sorties et greffons** : envoi des alertes vers syslog ou une base de données, greffons supplémentaires.

Les modules d'acquisition (DAQ) gèrent l'entrée et la sortie des paquets. Les deux plus utilisés sont `pcap`, le mode par défaut (sniffer), et `afpacket`, le mode en coupure (IPS). Les autres : `ipq` et `nfq` (coupure sous Linux), `ipfw` (coupure sous OpenBSD et FreeBSD), `dump` (test).

Trois jeux de règles existent :

- **Community** : gratuit, sous licence GPLv2, sans inscription.
- **Registered** : gratuit avec inscription ; ce sont les règles des abonnés, avec 30 jours de retard.
- **Subscriber** : payant ; le jeu principal, mis à jour deux fois par semaine.

## Snort 3

Snort 3 se configure avec `snort.lua` au lieu de `snort.conf`, et son dossier dépend de l'installation : `/etc/snort` sur certains systèmes, souvent `/usr/local/etc/snort` pour une compilation depuis les sources.

| Commande | Description |
| --- | --- |
| `sudo nano /etc/snort/rules/local.rules` | Ouvrir le fichier des règles personnalisées. Ajouter la règle à la suite des règles existantes, puis `Ctrl + X` et `y` pour enregistrer. |
| `alert icmp any any -> 127.0.0.1 any (msg:"Loopback Ping Detected"; sid:1000003; rev:1;)` | Règle de test : alerte sur tout paquet ICMP envoyé à l'adresse de bouclage. |
| `sudo snort -q -l /var/log/snort -i lo -A alert_fast -c /etc/snort/snort.lua` | Lancer Snort 3 en détection sur l'interface `lo`. Le mode d'alerte court s'appelle ici `alert_fast`. |
| `ping 127.0.0.1` | Dans un second terminal : générer le trafic qui doit déclencher la règle de test. |
| `sudo snort -q -l /var/log/snort -r Task.pcap -A alert_fast -c /etc/snort/snort.lua` | Appliquer les règles à un pcap avec Snort 3. Remplacer `Task.pcap` par le chemin de la capture. |
