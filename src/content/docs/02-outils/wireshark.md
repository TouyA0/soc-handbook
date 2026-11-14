---
title: "Wireshark — filtres et analyse"
description: "Analyser une capture dans Wireshark : premiers réflexes, statistiques, filtres d'affichage protocole par protocole (TCP, ARP, DHCP, Kerberos, DNS, ICMP, HTTP, TLS, FTP), filtres de capture."
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
| Tools › Credentials | Les identifiants passés en clair, trouvés par les dissecteurs FTP, HTTP, IMAP, POP et SMTP (Wireshark 3.1 et suivants) : un clic sur le numéro mène au paquet du mot de passe, un clic sur le nom à celui de l'identifiant. Liste incomplète : vérifier aussi à la main. |
| Tools › Firewall ACL Rules | Génère, pour le paquet sélectionné, des règles de blocage par IP, port ou MAC : iptables, Cisco IOS, ipfilter, ipfw, pf, pare-feu Windows (netsh). Prévues pour l'interface externe du pare-feu ; à relire avant de les appliquer. |

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

| Filtre | Description | Fiche |
| --- | --- | --- |
| `tcp.port == 80` | Un port TCP, en source ou en destination. | |
| `tcp.srcport == 1234` | Port TCP source. | |
| `tcp.dstport == 80` | Port TCP de destination. | |
| `udp.port == 53` | Un port UDP, en source ou en destination. | |
| `udp.srcport == 1234` | Port UDP source. | |
| `udp.dstport == 5353` | Port UDP de destination. | |
| `tcp.flags.syn == 1` | Drapeau SYN levé, quels que soient les autres. Même forme pour `ack`, `reset`, `fin`, `push`. | |
| `tcp.flags == 2` | SYN seul : une demande de connexion. | [Scan de ports](../03-menaces-detection/discovery/scan-de-ports.md) |
| `tcp.flags == 18` | SYN et ACK seuls : réponse d'un port ouvert. | [Scan de ports](../03-menaces-detection/discovery/scan-de-ports.md) |
| `tcp.flags == 20` | RST et ACK seuls : réponse d'un port fermé. | [Scan de ports](../03-menaces-detection/discovery/scan-de-ports.md) |
| `tcp.flags == 4` | RST seul : connexion coupée. | |
| `tcp.flags == 16` | ACK seul. | |
| `tcp.flags == 1` | FIN seul. | |

`tcp.flags` vaut la somme des drapeaux levés : FIN 1, SYN 2, RST 4, PSH 8, ACK 16, URG 32. `tcp.flags == 18` correspond à SYN + ACK et à rien d'autre ; `tcp.flags.syn == 1` accepte toute combinaison qui contient SYN.

## ARP

| Filtre | Description | Fiche |
| --- | --- | --- |
| `arp` | Tout le trafic ARP. | |
| `arp.opcode == 1` | Les requêtes (`who-has`). | |
| `arp.opcode == 2` | Les réponses (`is-at`). | [ARP Spoofing](../03-menaces-detection/credential-access/arp-spoofing.md) |
| `arp.duplicate-address-detected \|\| arp.duplicate-address-frame` | Une même IP annoncée par deux MAC. | [ARP Spoofing](../03-menaces-detection/credential-access/arp-spoofing.md) |
| `arp.opcode == 1 && arp.src.hw_mac == 11:22:33:44:55:66` | Les requêtes d'une MAC : une rafale vers toute une plage d'IP est un balayage ARP. | [ARP Spoofing](../03-menaces-detection/credential-access/arp-spoofing.md) |
| `eth.dst == 11:22:33:44:55:66` | Tout ce qui est envoyé à une MAC, quelle que soit l'IP de destination. | [ARP Spoofing](../03-menaces-detection/credential-access/arp-spoofing.md) |

## Hôtes et utilisateurs : DHCP, NetBIOS, Kerberos

Pour mettre un nom de machine ou d'utilisateur derrière une IP. Les entreprises nomment machines et comptes selon un modèle : pratique pour s'y retrouver, mais un attaquant peut l'imiter.

| Filtre | Description |
| --- | --- |
| `dhcp` | Tout le trafic DHCP. Avant Wireshark 3.0 : `bootp`. |
| `dhcp.option.dhcp == 3` | DHCP Request : nom de la machine (option 12), IP demandée (50), durée de bail demandée (51), identifiant client, souvent la MAC (61). |
| `dhcp.option.dhcp == 5` | DHCP ACK, demande acceptée : nom de domaine (option 15), durée de bail accordée (51). |
| `dhcp.option.dhcp == 6` | DHCP NAK, demande refusée : lire le motif (option 56) plutôt que de filtrer dessus. |
| `dhcp.option.hostname contains "desktop"` | Les machines dont le nom contient un mot. |
| `dhcp.option.domain_name contains "corp"` | Les ACK qui attribuent un domaine donné. |
| `nbns` | Tout le trafic NetBIOS Name Service : noms, TTL et IP des machines. |
| `nbns.name contains "desktop"` | Les requêtes NetBIOS sur un nom. |
| `kerberos` | Tout le trafic Kerberos. |
| `kerberos.CNameString contains "admin"` | Un compte dans les échanges Kerberos. |
| `kerberos.CNameString && !(kerberos.CNameString contains "$")` | Les comptes utilisateurs seulement : un nom qui finit par `$` est un compte machine. |
| `kerberos.realm contains ".local"` | Le domaine (realm) pour lequel le ticket est demandé. |
| `kerberos.SNameString == "krbtgt"` | Les demandes de TGT. Le champ `addresses` (IP et nom NetBIOS du client) n'existe que dans les requêtes. |

## HTTP

| Filtre | Description |
| --- | --- |
| `http.request` | Toutes les requêtes HTTP. |
| `http2` | Le trafic HTTP/2 (binaire, multiplexé) ; le plus souvent chiffré, voir TLS. |
| `http.request.method == "GET"` | Les requêtes GET. |
| `http.request.method == "POST"` | Les requêtes POST : formulaires, envois de fichiers. |
| `http.response.code == 200` | Les réponses avec ce code. |
| `http.response.code == 401` | Authentification requise : en série, une tentative de force brute. |
| `http.response.code == 404` | Ressource introuvable : en rafale depuis une IP, du fuzzing. |
| `http.response.code >= 500` | Erreurs du serveur : 500 erreur interne, 503 service indisponible. |
| `http.request.uri contains "admin"` | Les requêtes vers une ressource. `http.request.full_uri` contient l'URL complète, avec l'hôte. |
| `http.host == "example.com"` | Les requêtes vers un site. |
| `http.user_agent` | Toutes les requêtes qui ont un User-Agent : à mettre en colonne. |
| `http.user_agent matches "sqlmap\|nmap\|nikto\|wfuzz"` | User-Agent d'outils d'audit. |
| `data-text-lines contains "password"` | Le texte en clair renvoyé par le serveur. |
| `urlencoded-form` | Les formulaires web envoyés, avec leurs champs et valeurs. |
| `frame contains "jndi:"` | Log4Shell (CVE-2021-44228) : la charge `${jndi:ldap://…}`, souvent dans un en-tête comme le User-Agent. Chercher aussi `Exploit.class`. |
| `http.user_agent contains "$"` | Un User-Agent qui contient du code (`${…}`) au lieu d'un navigateur. |

:::astuce
`http` ne montre que ce que Wireshark a reconnu comme du HTTP ; `tcp.port == 80` montre tout ce qui passe sur le port 80, HTTP ou non. Un HTTP sur un port inhabituel peut échapper au premier : clic droit › Decode As pour forcer le décodage.
:::

:::piege
- **Ne jamais mettre un User-Agent en liste blanche** : il se modifie librement et peut imiter un navigateur. Chercher plutôt les incohérences : plusieurs User-Agent pour une même machine en peu de temps, des fautes (`Mozlila` au lieu de `Mozilla`), du code dans le champ.
- **`contains` est sensible à la casse et les charges Log4Shell sont souvent masquées** (`${${lower:j}ndi:…}`) : un filtre sur `jndi` ne les attrape pas toutes.
:::

## TLS et HTTPS

| Filtre | Description |
| --- | --- |
| `tls` | Tout le trafic TLS. |
| `tls.handshake.type == 1` | Client Hello : début de chaque connexion chiffrée, avec l'IP du client. |
| `tls.handshake.type == 2` | Server Hello : la réponse du serveur. |
| `tls.handshake.extensions_server_name` | Le nom du site demandé (SNI), lisible en clair dans le Client Hello : à mettre en colonne. |
| `(http.request \|\| tls.handshake.type == 1) && !(ssdp)` | Les débuts de connexion, en clair ou chiffrés, sans le bruit SSDP (découverte de services du réseau local, en HTTP sur UDP). |

Pour **déchiffrer**, il faut le fichier de clés de session (*key log file*) : Chrome et Firefox l'écrivent si la variable d'environnement `SSLKEYLOGFILE` désigne un fichier. Les clés sont propres à chaque session : elles doivent être enregistrées **pendant** la capture, on ne peut pas les produire après. Puis Edit › Preferences › Protocols › TLS › (Pre)-Master-Secret log filename, ou clic droit sur un paquet TLS › Protocol Preferences. Une fois déchiffré, le trafic apparaît en HTTP ou HTTP/2, et le panneau des octets propose les onglets Decrypted TLS, Decompressed Header, Reassembled TCP.

## FTP

| Filtre | Description |
| --- | --- |
| `ftp` | Les commandes et réponses FTP, en clair. |
| `ftp-data` | Les données transférées : contenu des fichiers et des listes de dossiers. |
| `ftp.request.command == "USER"` | Les identifiants envoyés. |
| `ftp.request.command == "PASS"` | Les mots de passe envoyés, en clair. |
| `ftp.response.code == 230` | Connexion réussie. |
| `ftp.response.code == 530` | Connexion refusée : en série, de la force brute. |
| `ftp.request.command == "PASS" && ftp.request.arg == "Password1"` | Un même mot de passe essayé sur plusieurs comptes : de la pulvérisation de mots de passe. |
| `ftp.response.code == 227` | Passage en mode passif : la réponse donne l'IP et le port du canal de données. |

Autres codes utiles : `220` service prêt, `331` identifiant accepté, mot de passe attendu, `430` identifiant ou mot de passe invalide, `211` à `213` état du système, d'un dossier, d'un fichier.

:::piege
Quelques `530` peuvent venir d'un utilisateur qui se trompe de mot de passe. La force brute se reconnaît au **nombre** d'échecs en peu de temps, depuis une même source, souvent sur un même compte ; la pulvérisation, à un même mot de passe essayé sur beaucoup de comptes.
:::

## DNS

| Filtre | Description | Fiche |
| --- | --- | --- |
| `dns.flags.response == 0` | Les requêtes DNS. | |
| `dns.flags.response == 1` | Les réponses DNS. | |
| `dns.qry.type == 1` | Les requêtes d'enregistrement A (adresse IPv4). | |
| `dns.qry.name == "example.com"` | Les requêtes pour un nom précis. | |
| `dns.qry.name.len > 15 && !mdns` | Les noms longs, sans le bruit mDNS du réseau local : sous-domaines encodés d'un tunnel. Ajuster le seuil. | [Tunnel ICMP et DNS](../03-menaces-detection/command-and-control/tunnel-icmp-dns.md) |
| `dns contains "dnscat"` | Traces de l'outil de tunnel dnscat. | [Tunnel ICMP et DNS](../03-menaces-detection/command-and-control/tunnel-icmp-dns.md) |

## ICMP

| Filtre | Description | Fiche |
| --- | --- | --- |
| `icmp` | Tout le trafic ICMP. | |
| `icmp && data.len > 64` | Charge utile plus grande que celle d'un ping : données cachées. | [Tunnel ICMP et DNS](../03-menaces-detection/command-and-control/tunnel-icmp-dns.md) |
| `icmp.type == 3 && icmp.code == 3` | Port injoignable : réponse d'un port UDP fermé. En série, un scan UDP. | [Scan de ports](../03-menaces-detection/discovery/scan-de-ports.md) |

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
