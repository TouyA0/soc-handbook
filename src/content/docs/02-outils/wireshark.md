---
title: "Wireshark — filtres et analyse"
description: "Analyser une capture dans Wireshark : premiers réflexes, statistiques, filtres d'affichage protocole par protocole (TCP, ARP, DHCP, Kerberos, DNS, ICMP, HTTP, TLS, FTP), filtres de capture."
tags: [réseau, wireshark, pcap]
updated: 2026-11-18
draft: false
type: cheatsheet
tool: Wireshark
---

Wireshark décode une capture protocole par protocole. Ce n'est pas un IDS : il ne lève aucune alerte et ne modifie aucun paquet, c'est l'analyste qui repère l'anomalie. Les menus sont nommés comme dans l'interface anglaise.

## Premiers réflexes sur un pcap

| Action | Pourquoi |
| --- | --- |
| Statistics › Capture File Properties | Hash du fichier, heure de capture, interface, commentaires, statistiques : identifier et classer la capture. Aussi par l'icône en bas à gauche. |
| View › Time Display Format › UTC Date and Time of Day | Par défaut, l'heure est en secondes depuis le début de la capture ; l'UTC est le format le plus utilisé. |
| Analyze › Expert Information | Anomalies relevées par les dissecteurs : sommes de contrôle, paquets malformés, protocoles obsolètes. Aussi par le rond en bas à gauche. |
| File › Merge | Fusionner une seconde capture avec celle qui est ouverte. Enregistrer le résultat avant de travailler dessus. |

Niveaux des informations expertes : **Chat** (bleu, déroulement normal), **Note** (cyan, codes d'erreur applicatifs), **Warn** (jaune, codes inhabituels), **Error** (rouge, paquets malformés). Ce sont des pistes : faux positifs et faux négatifs possibles.

## Vue d'ensemble : menu Statistics

Pour se faire une idée de la capture et poser une hypothèse. Dans chaque fenêtre, clic droit pour filtrer sur une ligne.

| Action | Ce qu'on y lit |
| --- | --- |
| Statistics › Protocol Hierarchy | Les protocoles de la capture, en paquets et en pourcentage : les services utilisés. |
| Statistics › Conversations | Les échanges entre deux points (Ethernet, IPv4, IPv6, TCP, UDP) : qui parle à qui. |
| Statistics › Endpoints | Chaque adresse vue dans la capture, une seule fois. Name resolution affiche le fabricant d'une carte réseau d'après les trois premiers octets de sa MAC (fabricants connus seulement). |
| Statistics › Resolved Addresses | Les noms associés aux IP, tirés des réponses DNS de la capture : les ressources consultées. |
| Statistics › IPv4 Statistics | Les mêmes informations limitées à IPv4. Même chose pour IPv6. |
| Statistics › DNS | Le trafic DNS ventilé : rcode, opcode, classes, types de requête. |
| Statistics › HTTP | Codes de requête et de réponse, et les requêtes elles-mêmes. |
| Edit › Preferences › Name Resolution | Activer la résolution des IP et des ports (désactivée par défaut), et indiquer le dossier des bases MaxMind pour la géolocalisation des IP. |

## Filtrer au clic

Tout ce qu'on peut cliquer, on peut le filtrer : clic droit sur un champ, ou menu Analyze.

| Action | Effet | Fiche |
| --- | --- | --- |
| Apply as Filter | Filtre aussitôt sur la valeur du champ cliqué. La barre d'état donne le nombre de paquets affichés. | |
| Prepare as Filter | Écrit le filtre sans l'appliquer, pour le combiner (« …and », « …or ») avant de valider. | |
| Conversation Filter | Ne garde que la conversation du paquet (IP et ports). | |
| Colorize Conversation | Colore la conversation sans rien masquer. Annuler : View › Colorize Conversation › Reset Colorization. | |
| Apply as Column | Ajoute le champ en colonne, pour voir sa valeur sur tous les paquets. | |
| Follow › TCP Stream | Reconstitue l'échange au niveau applicatif, client en rouge, serveur en bleu : un protocole en clair y montre identifiants et mots de passe. Existe aussi pour UDP et HTTP. Applique un filtre : le retirer avec la croix pour revoir toute la capture. | [Web shell](../03-menaces-detection/persistence/web-shell.md) |

## Retrouver un paquet

| Action | Effet |
| --- | --- |
| Go › Go to Packet | Aller à un numéro de paquet ; chaque paquet garde le sien. |
| Edit › Find Packet | Chercher par contenu : Display filter, Hex value, String ou Regular Expression. Insensible à la casse par défaut. |

:::piege
La recherche porte sur **un seul panneau** : Packet list, Packet details ou Packet bytes. Une valeur visible seulement dans le détail d'un paquet n'est pas trouvée si on cherche dans la liste.
:::

## Annoter et extraire

| Action | Effet |
| --- | --- |
| Edit › Mark Packet | Marque un paquet (affiché en noir) pour le retrouver ou l'exporter. Perdu à la fermeture du fichier. |
| Packet Comment (clic droit) | Commentaire enregistré dans la capture, jusqu'à ce qu'on le supprime. |
| File › Export Specified Packets | Exporter seulement les paquets utiles. |
| File › Export Objects | Extraire les fichiers transférés, pour HTTP, SMB, TFTP, IMF et DICOM. |
| Tools › Credentials | Les identifiants en clair trouvés par les dissecteurs FTP, HTTP, IMAP, POP et SMTP (Wireshark 3.1 et suivants). Liste incomplète : vérifier aussi à la main. |
| Tools › Firewall ACL Rules | Règles de blocage par IP, port ou MAC, prêtes pour iptables, Cisco IOS, ipfilter, ipfw, pf, pare-feu Windows (netsh). Prévues pour l'interface externe du pare-feu. |

## Écrire un filtre d'affichage

Un filtre d'affichage masque des paquets sans les supprimer. Il s'écrit en minuscules, l'autocomplétion descend dans les champs du protocole (`http.request.method`). Barre de filtre **verte** : valide ; **rouge** : invalide ; **jaune** : fonctionne mais peu fiable, à réécrire. Valeurs en décimal ou en hexadécimal.

| Filtre | Description |
| --- | --- |
| `http` | Un protocole, par son nom : `dns`, `arp`, `dhcp`, `ftp`, `smtp`, `pop`, `imap`… |
| `ip.src == 192.0.2.10` | Égal (`eq`). |
| `ip.ttl > 250` | Supérieur (`gt`). Aussi `<` (`lt`), `>=` (`ge`), `<=` (`le`). |
| `ip.ttl >= 0xFA` | La même comparaison en hexadécimal. |
| `ip.src == 192.0.2.10 && tcp.port == 80` | Et (`and`). |
| `ip.src == 192.0.2.10 \|\| ip.src == 192.0.2.11` | Ou (`or`). |
| `!(ip.src == 192.0.2.10)` | Négation (`not`). Préférer cette forme à `!=`, déprécié et aux résultats incohérents. |

## IP

| Filtre | Description |
| --- | --- |
| `ip` | Tous les paquets IP. |
| `ip.addr == 192.0.2.10` | Une adresse, en source ou en destination. |
| `ip.addr == 192.0.2.0/24` | Une plage d'adresses. |
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
| `tcp.flags.syn == 1` | SYN levé, quels que soient les autres drapeaux. Même forme pour `ack`, `reset`, `fin`. | |
| `tcp.flags == 2` | SYN seul. | [Scan de ports](../03-menaces-detection/discovery/scan-de-ports.md) |
| `tcp.flags == 18` | SYN et ACK seuls. | [Scan de ports](../03-menaces-detection/discovery/scan-de-ports.md) |
| `tcp.flags == 20` | RST et ACK seuls. | [Scan de ports](../03-menaces-detection/discovery/scan-de-ports.md) |
| `tcp.flags == 4` | RST seul. | |
| `tcp.flags == 16` | ACK seul. | |
| `tcp.flags == 1` | FIN seul. | |

## ARP

| Filtre | Description | Fiche |
| --- | --- | --- |
| `arp` | Tout le trafic ARP. | |
| `arp.opcode == 1` | Les requêtes. | |
| `arp.opcode == 2` | Les réponses. | [ARP Spoofing](../03-menaces-detection/credential-access/arp-spoofing.md) |
| `arp.dst.hw_mac == 00:00:00:00:00:00` | Requêtes à MAC cible vide : à regarder en masse pour un balayage ARP. | [ARP Spoofing](../03-menaces-detection/credential-access/arp-spoofing.md) |
| `arp.duplicate-address-detected \|\| arp.duplicate-address-frame` | Une même IP annoncée par deux MAC. | [ARP Spoofing](../03-menaces-detection/credential-access/arp-spoofing.md) |
| `arp.opcode == 1 && arp.src.hw_mac == 00:0c:29:e2:18:b4` | Les requêtes d'une MAC : une rafale vers toute une plage d'IP est une inondation ARP. | [ARP Spoofing](../03-menaces-detection/credential-access/arp-spoofing.md) |

## Hôtes et utilisateurs : DHCP, NetBIOS, Kerberos

Pour mettre un nom de machine ou d'utilisateur derrière une IP. Les entreprises nomment machines et comptes selon un modèle : pratique, mais un attaquant peut l'imiter.

| Filtre | Description |
| --- | --- |
| `dhcp` | Tout le trafic DHCP. |
| `dhcp.option.dhcp == 3` | DHCP Request : nom de la machine (option 12), IP demandée (50), durée de bail (51), MAC du client (61). |
| `dhcp.option.dhcp == 5` | DHCP ACK, demande acceptée : nom de domaine (option 15), durée de bail (51). |
| `dhcp.option.dhcp == 6` | DHCP NAK, demande refusée : lire le motif (option 56) plutôt que de filtrer dessus. |
| `dhcp.option.hostname contains "keyword"` | Les machines dont le nom contient un mot. |
| `dhcp.option.domain_name contains "keyword"` | Les ACK qui attribuent un domaine donné. |
| `nbns` | Le trafic NetBIOS : noms, TTL et IP des machines. |
| `nbns.name contains "keyword"` | Les requêtes NetBIOS sur un nom. |
| `kerberos` | Tout le trafic Kerberos. |
| `kerberos.CNameString contains "keyword"` | Un nom de compte. Un nom qui finit par `$` est une machine. |
| `kerberos.CNameString && !(kerberos.CNameString contains "$")` | Les comptes utilisateurs seulement. |
| `kerberos.realm contains ".org"` | Le domaine pour lequel le ticket est demandé. |
| `kerberos.SNameString == "krbtgt"` | Les demandes de TGT. Le champ `addresses` (IP et nom NetBIOS du client) n'existe que dans les requêtes. |

## DNS

| Filtre | Description | Fiche |
| --- | --- | --- |
| `dns.flags.response == 0` | Les requêtes DNS. | |
| `dns.flags.response == 1` | Les réponses DNS. | |
| `dns.qry.type == 1` | Les requêtes d'enregistrement A. | |
| `dns.qry.name.len > 15 && !mdns` | Les noms longs, sans le trafic mDNS local : sous-domaines encodés d'un tunnel. | [Tunnel ICMP et DNS](../03-menaces-detection/command-and-control/tunnel-icmp-dns.md) |
| `dns contains "dnscat"` | Traces de l'outil de tunnel dnscat. | [Tunnel ICMP et DNS](../03-menaces-detection/command-and-control/tunnel-icmp-dns.md) |

## ICMP

| Filtre | Description | Fiche |
| --- | --- | --- |
| `icmp` | Tout le trafic ICMP. | |
| `data.len > 64 && icmp` | Charge utile plus grande que celle d'un ICMP normal (64 octets). | [Tunnel ICMP et DNS](../03-menaces-detection/command-and-control/tunnel-icmp-dns.md) |
| `icmp.type == 3 && icmp.code == 3` | Port injoignable : réponse d'un port UDP fermé. | [Scan de ports](../03-menaces-detection/discovery/scan-de-ports.md) |

## HTTP

| Filtre | Description |
| --- | --- |
| `http.request` | Toutes les requêtes. |
| `http2` | Le trafic HTTP/2. |
| `http.request.method == "GET"` | Les requêtes GET. |
| `http.request.method == "POST"` | Les requêtes POST. |
| `http.response.code == 200` | Codes de réponse utiles : 200 OK, 301 / 302 redirection, 400 requête incomprise, 401 authentification requise, 403 accès interdit, 404 introuvable, 405 méthode refusée, 408 délai dépassé, 500 erreur interne, 503 service indisponible. |
| `http.user_agent` | Les User-Agent, à mettre en colonne. |
| `(http.user_agent contains "sqlmap") \|\| (http.user_agent contains "Nmap") \|\| (http.user_agent contains "Wfuzz") \|\| (http.user_agent contains "Nikto")` | User-Agent d'outils d'audit. |
| `http.request.uri contains "admin"` | Les requêtes vers une ressource. `http.request.full_uri` contient l'URL complète. |
| `http.host == "keyword"` | Les requêtes vers un hôte. |
| `http.server contains "apache"` | Le logiciel serveur annoncé. |
| `data-text-lines contains "keyword"` | Le texte en clair renvoyé par le serveur. |
| `(frame contains "jndi") \|\| (frame contains "Exploit")` | Log4j : motifs connus `jndi:ldap` et `Exploit.class`. L'attaque commence par un `POST`. |
| `(http.user_agent contains "$") \|\| (http.user_agent contains "==")` | Log4j : charge glissée dans le User-Agent. |

:::piege
**Ne jamais mettre un User-Agent en liste blanche**, même s'il paraît normal : il se modifie librement. Ce qui doit alerter : plusieurs User-Agent pour une même machine en peu de temps, un User-Agent non standard, une faute (`Mozlila` au lieu de `Mozilla`), un outil d'audit (Nmap, Nikto, Wfuzz, sqlmap), une charge dans le champ. Le User-Agent est une source d'appoint, pas une preuve à lui seul.
:::

## TLS et HTTPS

| Filtre | Description |
| --- | --- |
| `tls` | Tout le trafic TLS. |
| `tls.handshake.type == 1` | Client Hello. |
| `tls.handshake.type == 2` | Server Hello. |
| `ssdp` | SSDP, découverte de services du réseau local. |
| `(http.request \|\| tls.handshake.type == 1) && !(ssdp)` | Les débuts de connexion : quelles IP prennent part à une poignée de main TLS. Avec `type == 2` pour les réponses. |

Pour **déchiffrer**, il faut le fichier de clés de session (*key log file*), que Chrome et Firefox écrivent si la variable d'environnement `SSLKEYLOGFILE` est définie. Les clés sont propres à chaque session : elles doivent être enregistrées **pendant** la capture. Ajouter le fichier par clic droit, ou Edit › Preferences › Protocols › TLS. Une fois déchiffré, le panneau des octets propose les onglets Decrypted TLS, Decompressed Header, Reassembled TCP.

## FTP

| Filtre | Description |
| --- | --- |
| `ftp` | Tout le trafic FTP. |
| `ftp.request.command == "USER"` | Les identifiants envoyés. |
| `ftp.request.command == "PASS"` | Les mots de passe envoyés. |
| `ftp.request.arg == "password"` | Un mot de passe précis. |
| `ftp.response.code == 230` | Connexion réussie. |
| `ftp.response.code == 530` | Connexion refusée : en série, de la force brute. |
| `(ftp.request.command == "PASS") && (ftp.request.arg == "password")` | Un même mot de passe essayé sur plusieurs comptes : pulvérisation de mots de passe. |
| `ftp.response.code == 227` | Passage en mode passif. |

Autres codes : `211` état du système, `212` d'un dossier, `213` d'un fichier, `220` service prêt, `228` et `229` modes passifs long et étendu, `231` déconnexion, `331` identifiant valide, `430` identifiant ou mot de passe invalide.

## Opérateurs avancés

| Filtre | Description |
| --- | --- |
| `http.server contains "Apache"` | `contains` cherche une valeur dans un champ. Sensible à la casse. |
| `http.request.uri matches "\.(php\|html)"` | `matches` applique une expression régulière. Insensible à la casse ; une expression complexe peut se tromper. |
| `tcp.port in {80 443 8080}` | `in` teste l'appartenance à un ensemble de valeurs. |
| `upper(http.server) contains "APACHE"` | `upper` passe le champ en majuscules ; `lower` en minuscules. |
| `string(frame.number) matches "[13579]$"` | `string` convertit un champ non textuel en texte (ici, les paquets de numéro impair). |

## Filtres de capture (BPF)

Un filtre de capture se pose **avant** la capture et ne se change pas pendant : ce qui ne correspond pas est perdu. Sa syntaxe n'est pas celle de l'affichage. En pratique, on capture tout et on filtre à l'affichage.

| Filtre | Description |
| --- | --- |
| `tcp port 80` | Le port 80 en TCP. À l'affichage : `tcp.port == 80`. |

Portées : `host`, `net`, `port`, `portrange`. Direction : `src`, `dst`, `src or dst`, `src and dst`. Protocoles : `ether`, `wlan`, `ip`, `ip6`, `arp`, `rarp`, `tcp`, `udp`. Aide-mémoire : Capture › Capture Filters.

## Garder ses filtres

| Action | Effet |
| --- | --- |
| Signet de la barre de filtre | Enregistrer un filtre pour le rappeler en deux clics. |
| Bouton « + » de la barre de filtre | Un bouton qui applique le filtre en un clic. |
| View › Coloring Rules | Colorer les paquets qui correspondent à un filtre. |
| Edit › Configuration Profiles | Un profil par type d'investigation (couleurs, boutons). Aussi par Profile, en bas à droite. |
| Analyze › Display Filter Expression | Tous les champs d'un protocole, le type de valeur attendu et les valeurs prédéfinies. |
| Analyze › Display Filters | Les filtres d'affichage enregistrés, comme aide-mémoire. |
