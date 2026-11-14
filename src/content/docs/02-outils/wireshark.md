---
title: "Wireshark — filtres et analyse"
description: "Analyser une capture dans Wireshark : premiers réflexes, vue d'ensemble par les statistiques, filtres d'affichage par protocole, opérateurs avancés, filtres de capture."
tags: [réseau, wireshark, pcap]
updated: 2026-11-14
draft: false
type: cheatsheet
tool: Wireshark
---

Wireshark décode une capture (ou le trafic en direct) protocole par protocole. Ce n'est pas un IDS : il ne lève aucune alerte et ne modifie aucun paquet, c'est l'analyste qui repère l'anomalie. Les menus sont nommés comme dans l'interface anglaise.

## Premiers réflexes sur un pcap

| Action | Pourquoi |
| --- | --- |
| Statistics › Capture File Properties | Hash du fichier, dates du premier et du dernier paquet, interface, commentaires : identifier la capture et noter son hash avant de l'analyser. Aussi par l'icône en bas à gauche de la barre d'état. |
| View › Time Display Format › UTC Date and Time of Day | Par défaut, l'heure est en secondes depuis le début de la capture : passer en UTC pour corréler avec les journaux et le SIEM. |
| Analyze › Expert Information | Anomalies relevées par les dissecteurs : paquets malformés, erreurs de somme de contrôle, protocoles obsolètes. Aussi par le rond en bas à gauche de la barre d'état. |
| File › Merge | Fusionner une seconde capture avec celle qui est ouverte. Enregistrer le résultat avant de travailler dessus. |

Niveaux des informations expertes, du moins au plus grave : **Chat** (bleu, déroulement normal), **Note** (cyan, codes d'erreur applicatifs), **Warn** (jaune, codes inhabituels), **Error** (rouge, paquets malformés). Ce sont des pistes, pas des verdicts : faux positifs et faux négatifs possibles.

## Vue d'ensemble : menu Statistics

Avant de filtrer, se faire une idée de la capture pour poser une hypothèse : quels protocoles, quelles machines, quels volumes. Dans chaque fenêtre, clic droit sur une ligne pour filtrer dessus.

| Action | Ce qu'on y lit |
| --- | --- |
| Statistics › Protocol Hierarchy | La part de chaque protocole, en paquets et en pourcentage. Fait ressortir un protocole ou un service inattendu. |
| Statistics › Conversations | Les échanges entre deux points (Ethernet, IPv4, IPv6, TCP, UDP) et leur volume : qui parle à qui. Trier par octets fait ressortir un gros transfert. |
| Statistics › Endpoints | Chaque adresse ou port vu dans la capture, une seule fois. Le bouton Name resolution affiche le fabricant d'une carte réseau d'après les trois premiers octets de sa MAC (fabricants connus seulement). |
| Statistics › Resolved Addresses | Les noms associés aux IP, tirés des réponses DNS présentes dans la capture : les ressources consultées. |
| Statistics › IPv4 Statistics | Adresses, destinations et ports, limités à IPv4. Même chose pour IPv6. |
| Statistics › DNS | Le trafic DNS ventilé : codes de réponse (rcode), opcode, types de requête. |
| Statistics › HTTP › Requests | Les URL demandées, par hôte. Packet Counter donne la répartition des méthodes et des codes de réponse. |
| Edit › Preferences › Name Resolution | Activer la résolution des IP et des ports, désactivée par défaut, et indiquer le dossier des bases MaxMind pour la géolocalisation des IP (affichée dans le détail IP et sur une carte depuis Endpoints). |

:::piege
Pour résoudre les IP en noms, Wireshark peut envoyer des requêtes DNS inverses à l'extérieur : sur une capture d'incident, elles peuvent atteindre l'infrastructure de l'attaquant. Sur une machine d'analyse isolée, s'en tenir à Resolved Addresses, qui ne lit que la capture.
:::

## Filtrer au clic

Tout ce qu'on peut cliquer, on peut le filtrer : clic droit sur un champ du panneau de détail, ou menu Analyze.

| Action | Effet | Fiche |
| --- | --- | --- |
| Apply as Filter | Filtre aussitôt sur la valeur du champ cliqué. La barre d'état donne le nombre de paquets affichés sur le total. | |
| Prepare as Filter | Écrit le filtre sans l'appliquer : on l'ajuste ou on le combine (« …and Selected », « …or Selected ») avant de valider avec Entrée. | |
| Conversation Filter | Ne garde que la conversation du paquet (IP et ports) et masque le reste. | |
| Colorize Conversation | Colore la conversation sans rien masquer. Annuler : View › Colorize Conversation › Reset Colorization. | |
| Apply as Column | Ajoute le champ en colonne de la liste pour voir sa valeur sur tous les paquets, par exemple `http.user_agent`. Clic droit sur l'en-tête des colonnes pour en masquer. | |
| Follow › TCP Stream (Ctrl + Alt + Maj + T) | Reconstitue l'échange au niveau applicatif, client en rouge, serveur en bleu : un protocole en clair y montre identifiants, mots de passe et contenus. Existe aussi pour UDP et HTTP. | [Web shell](../03-menaces-detection/persistence/web-shell.md) |

Suivre un flux applique un filtre (`tcp.stream eq n`) : le retirer avec la croix de la barre de filtre pour revoir toute la capture.

## Retrouver un paquet

| Action | Effet |
| --- | --- |
| Go › Go to Packet (Ctrl + G) | Aller à un numéro de paquet. Chaque paquet garde son numéro : on y revient facilement et on le cite dans un rapport. |
| Edit › Find Packet (Ctrl + F) | Chercher par contenu : Display filter, Hex value, String ou Regular Expression. Insensible à la casse par défaut. |

:::piege
La recherche porte sur **un seul panneau** : Packet list, Packet details ou Packet bytes. Une valeur visible seulement dans le détail d'un paquet n'est pas trouvée si on cherche dans la liste, même si elle est dans la capture.
:::

## Annoter et extraire

| Action | Effet |
| --- | --- |
| Edit › Mark Packet (Ctrl + M) | Marque un paquet, affiché en noir, pour le retrouver ou l'exporter. Perdu à la fermeture du fichier. |
| Packet Comment (clic droit) | Commentaire enregistré dans la capture, qui reste jusqu'à ce qu'on le supprime : laisser une note à l'analyste suivant. Demande le format pcapng. |
| File › Export Specified Packets | Exporter seulement les paquets affichés ou marqués : transmettre le périmètre utile, pas toute la capture. |
| File › Export Objects › HTTP | Extraire les fichiers transférés. Protocoles pris en charge, notamment : HTTP, SMB, TFTP, IMF (emails), DICOM. |

:::piege
Un fichier extrait peut être un malware : ne pas l'ouvrir sur son poste. Calculer son hash pour le rechercher, et l'analyser dans un bac à sable.
:::

## Écrire un filtre d'affichage

Un filtre d'affichage masque des paquets sans les supprimer, et se change à tout moment. Il s'écrit en minuscules ; l'autocomplétion descend dans les champs du protocole, séparés par des points (`http.request.method`). La barre de filtre se colore : **vert**, filtre valide ; **rouge**, filtre invalide ; **jaune**, le filtre fonctionne mais son résultat n'est pas fiable, à réécrire. Les valeurs s'écrivent en décimal ou en hexadécimal.

| Filtre | Description |
| --- | --- |
| `http` | Un protocole, par son nom. Autres exemples : `dns`, `arp`, `dhcp`, `ftp`, `smtp`, `pop`, `imap`. |
| `ip.ttl == 64` | Égal. S'écrit aussi `eq`. |
| `ip.ttl > 250` | Supérieur. Aussi `<`, `>=`, `<=`, ou en toutes lettres `gt`, `lt`, `ge`, `le`. |
| `ip.ttl >= 0xFA` | Même comparaison, en hexadécimal. |
| `ip.src == 192.0.2.10 && tcp.port == 80` | Et logique. S'écrit aussi `and`. |
| `ip.src == 192.0.2.10 \|\| ip.src == 192.0.2.11` | Ou logique. S'écrit aussi `or`. |
| `!(ip.addr == 192.0.2.10)` | Négation : tout sauf ce qui correspond. S'écrit aussi `not`. |

:::piege
Sur un champ présent plusieurs fois dans un paquet, comme `ip.addr` (source et destination), `ip.addr != 192.0.2.10` peut donner un résultat trompeur selon la version de Wireshark. Écrire la négation `!(ip.addr == 192.0.2.10)`, qui exclut à coup sûr tout paquet impliquant cette IP.
:::

## IP

| Filtre | Description |
| --- | --- |
| `ip` | Tous les paquets IPv4. |
| `ip.addr == 192.0.2.10` | Une adresse IP, en source ou en destination. |
| `ip.addr == 192.0.2.0/24` | Toute une plage d'adresses. |
| `ip.src == 192.0.2.10` | Les paquets émis par cette adresse. |
| `ip.dst == 192.0.2.10` | Les paquets envoyés à cette adresse. |

## TCP et UDP

| Filtre | Description |
| --- | --- |
| `tcp.port == 80` | Un port TCP, en source ou en destination. |
| `tcp.srcport == 1234` | Port TCP source. |
| `tcp.dstport == 80` | Port TCP de destination. |
| `udp.port == 53` | Un port UDP, en source ou en destination. |
| `udp.srcport == 1234` | Port UDP source. |
| `udp.dstport == 5353` | Port UDP de destination. |

## HTTP

| Filtre | Description |
| --- | --- |
| `http.request.method == "GET"` | Les requêtes GET. |
| `http.request.method == "POST"` | Les requêtes POST : formulaires, envois de fichiers. |
| `http.response.code == 200` | Les réponses avec ce code. |

:::astuce
`http` ne montre que ce que Wireshark a reconnu comme du HTTP ; `tcp.port == 80` montre tout ce qui passe sur le port 80, HTTP ou non. Un HTTP sur un port inhabituel peut échapper au premier : clic droit › Decode As pour forcer le décodage.
:::

## DNS

| Filtre | Description |
| --- | --- |
| `dns.flags.response == 0` | Les requêtes DNS. |
| `dns.flags.response == 1` | Les réponses DNS. |
| `dns.qry.type == 1` | Les requêtes d'enregistrement A (adresse IPv4). |
| `dns.qry.name == "example.com"` | Les requêtes pour un nom précis. |

## Opérateurs avancés

| Filtre | Description |
| --- | --- |
| `http.server contains "Apache"` | `contains` cherche une valeur dans un champ. Sensible à la casse. |
| `lower(http.server) contains "apache"` | `lower` passe le champ en minuscules : un `contains` insensible à la casse. `upper` fait l'inverse. |
| `http.request.uri matches "\.(php\|html)"` | `matches` applique une expression régulière. Insensible à la casse ; une expression complexe peut se tromper. |
| `tcp.port in {80 443 8080}` | `in` teste l'appartenance à un ensemble de valeurs. |
| `string(frame.number) matches "[13579]$"` | `string` convertit un champ non textuel en texte, pour lui appliquer `contains` ou `matches` (ici, les paquets de numéro impair). |

## Filtres de capture (BPF)

Un filtre de capture se pose **avant** la capture et ne se change pas pendant : seul ce qui correspond est enregistré, le reste est perdu. Sa syntaxe (BPF) n'est pas celle de l'affichage. En pratique, on capture tout et on filtre à l'affichage ; un filtre de capture mal écrit fait rater l'événement cherché.

| Filtre | Description |
| --- | --- |
| `tcp port 80` | Le port 80 en TCP. À l'affichage : `tcp.port == 80`. |
| `host 192.0.2.10` | Une machine, en source ou en destination. |
| `src host 192.0.2.10` | Une machine en source seulement. Aussi `dst`, `src or dst`, `src and dst`. |
| `net 192.0.2.0/24` | Une plage d'adresses. |
| `portrange 8000-8100` | Une plage de ports. |

Portées : `host`, `net`, `port`, `portrange`. Protocoles : `ether`, `wlan`, `ip`, `ip6`, `arp`, `rarp`, `tcp`, `udp`. Aide-mémoire intégré : Capture › Capture Filters.

## Garder ses filtres

| Action | Effet |
| --- | --- |
| Signet à gauche de la barre de filtre | Enregistrer un filtre, pour le rappeler en deux clics. |
| Bouton « + » à droite de la barre de filtre | Créer un bouton qui applique le filtre en un clic. |
| View › Coloring Rules | Colorer les paquets qui correspondent à un filtre, pour les voir sans masquer le reste. |
| Edit › Configuration Profiles | Un profil par type d'investigation, avec ses règles de couleur, boutons et colonnes. Aussi par Profile, en bas à droite de la barre d'état. |
| Analyze › Display Filter Expression | Tous les champs d'un protocole, le type de valeur attendu et les valeurs prédéfinies : pour construire un filtre dont on ne connaît pas le champ. |
| Analyze › Display Filters | Les filtres d'affichage enregistrés, à réutiliser comme aide-mémoire. |
