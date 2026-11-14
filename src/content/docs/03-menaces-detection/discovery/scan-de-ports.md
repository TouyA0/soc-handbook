---
title: "Scan de ports"
description: "L'attaquant sonde les ports d'une ou plusieurs machines pour découvrir les services exposés, le plus souvent avec Nmap."
tags: [réseau, nmap, scan, wireshark]
updated: 2026-11-14
draft: false
type: technique
attack_id: T1046
tactic: discovery
severity: med
data_sources: [Capture réseau]
---

## Description

Un scan de ports teste un à un les ports d'une machine pour savoir lesquels sont ouverts, donc quels services elle expose. Depuis l'intérieur du réseau, c'est souvent le signe d'une machine déjà compromise qui cherche où aller ensuite ; depuis Internet, c'est de la reconnaissance (:attack[T1595]).

Nmap est l'outil le plus courant. Trois types de scan à reconnaître :

| Scan | Commande | Principe |
| --- | --- | --- |
| TCP connect | `nmap -sT` | Termine la poignée de main TCP. Seul scan TCP possible sans privilèges. |
| SYN | `nmap -sS` | N'envoie que le SYN et ne termine jamais la poignée de main. Demande des privilèges ; c'est le scan par défaut de Nmap lancé en root. |
| UDP | `nmap -sU` | Envoie un paquet UDP ; seul un port fermé répond, par une erreur ICMP. |

## Ce qu'on observe

| Scan | Port ouvert | Port fermé |
| --- | --- | --- |
| TCP connect | SYN → SYN/ACK → ACK, puis RST/ACK | SYN → RST/ACK |
| SYN | SYN → SYN/ACK → RST | SYN → RST/ACK |
| UDP | Pas de réponse, ou une réponse du service | ICMP type 3, code 3 (port injoignable) |

Le signe général : **une même source**, des SYN vers **beaucoup de ports** en peu de temps, et en retour surtout des RST/ACK (ports fermés).

Pour distinguer les deux scans TCP, regarder la taille de fenêtre du SYN : un scan connect passe par le système et annonce une fenêtre normale, en général supérieure à 1024 ; un scan SYN forge ses paquets et annonce souvent 1024 ou moins.

Pour un scan UDP, le message ICMP d'erreur contient l'en-tête du paquet UDP d'origine : déplier la partie ICMP dans le détail du paquet pour voir quel port a été sondé.

## Détection

### Wireshark

```wireshark title="SYN sans ACK, fenêtre supérieure à 1024 : scan TCP connect"
tcp.flags.syn == 1 && tcp.flags.ack == 0 && tcp.window_size > 1024
```

```wireshark title="SYN sans ACK, fenêtre de 1024 ou moins : scan SYN"
tcp.flags.syn == 1 && tcp.flags.ack == 0 && tcp.window_size <= 1024
```

```wireshark title="ports UDP fermés : scan UDP"
icmp.type == 3 && icmp.code == 3
```

```wireshark title="réponses RST/ACK : ports TCP fermés"
tcp.flags == 20
```

```wireshark title="réponses SYN/ACK : ports TCP ouverts, ce que l'attaquant a appris"
tcp.flags == 18
```

:::astuce
Statistics › Conversations, onglet TCP, trié par adresse source : un scan ressort comme une source qui a des centaines de conversations de un ou deux paquets, chacune vers un port différent.
:::

Valeurs des drapeaux TCP pour `tcp.flags` : voir la [cheat sheet Wireshark](../../02-outils/wireshark.md#tcp-et-udp).

## Faux positifs

:::faux-positifs
- **Scanners de vulnérabilités et outils d'inventaire** de l'équipe sécurité ou informatique, depuis des IP connues.
- **Supervision** qui teste régulièrement la disponibilité de services.
- **Administrateur** qui vérifie un service ou une règle de pare-feu.
:::

:::piege
- **La taille de fenêtre est un indice, pas une preuve** : elle dépend de l'outil et du système. Elle aide à qualifier un scan, pas à le détecter.
- **Un scan lent passe sous les seuils** : Nmap peut espacer ses paquets sur des heures. Chercher aussi sur une longue période, par source.
:::

## Réponse

À compléter.
