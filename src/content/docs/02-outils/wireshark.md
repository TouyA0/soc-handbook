---
title: "Wireshark — filtres et analyse"
description: "Analyser une capture dans Wireshark : premiers réflexes sur un pcap, filtrer au clic, retrouver, annoter et extraire des paquets, filtres d'affichage de base."
tags: [réseau, wireshark, pcap]
updated: 2026-11-13
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

## Filtres d'affichage de base

Un filtre d'affichage masque des paquets sans les supprimer. Un filtre de capture, posé avant la capture, n'enregistre que ce qui correspond : le reste est perdu. Les deux n'ont pas la même syntaxe : `tcp.port == 80` à l'affichage, `tcp port 80` (BPF) à la capture.

| Filtre | Description |
| --- | --- |
| `http` | Un protocole, par son nom. Autres exemples : `dns`, `arp`, `dhcp`, `ftp`, `smtp`, `pop`, `imap`. |
| `tcp.port == 80` | Un port TCP, en source ou en destination. |
| `udp.port == 53` | Un port UDP, en source ou en destination. |
| `ip.addr == 192.0.2.10` | Une adresse IP, en source ou en destination. |
| `ip.src == 192.0.2.10` | Une adresse IP en source seulement. |
| `ip.dst == 192.0.2.10` | Une adresse IP en destination seulement. |

:::astuce
`http` ne montre que ce que Wireshark a reconnu comme du HTTP ; `tcp.port == 80` montre tout ce qui passe sur le port 80, HTTP ou non. Un HTTP sur un port inhabituel peut échapper au premier : clic droit › Decode As pour forcer le décodage.
:::
