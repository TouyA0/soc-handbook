---
title: "Scan de ports"
description: "L'attaquant sonde les ports d'une ou plusieurs machines pour découvrir les services exposés, le plus souvent avec Nmap."
tags: [réseau, nmap, scan, wireshark]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1046
tactic: discovery
severity: med
data_sources: [Capture réseau]
---

## Description

Nmap sert à cartographier un réseau : machines actives, ports ouverts, services. Trois types de scan à reconnaître dans une capture :

| Scan | Commande | Principe |
| --- | --- | --- |
| TCP connect | `nmap -sT` | Termine la poignée de main TCP. Seule option pour un utilisateur sans privilèges. |
| SYN | `nmap -sS` | Ne termine pas la poignée de main. Demande des privilèges. |
| UDP | `nmap -sU` | Pas de poignée de main ; un port fermé répond par une erreur ICMP, un port ouvert ne répond pas. |

## Ce qu'on observe

| Scan | Port ouvert | Port fermé |
| --- | --- | --- |
| TCP connect | SYN → SYN/ACK → ACK, puis RST/ACK | SYN → RST/ACK |
| SYN | SYN → SYN/ACK → RST | SYN → RST/ACK |
| UDP | Pas de réponse | ICMP type 3, code 3 (port injoignable) |

Taille de fenêtre du SYN : en général **supérieure à 1024** pour un scan connect, qui attend des données ; **1024 ou moins** pour un scan SYN, qui n'ira pas au bout.

Pour un scan UDP, le message ICMP d'erreur contient la requête d'origine : déplier la partie ICMP dans le détail du paquet pour voir quel port a été sondé.

## Détection

### Wireshark

Sur une grosse capture, partir de ces filtres pour voir l'anomalie, puis zoomer sur un point du trafic. Valeurs de `tcp.flags` : voir la [cheat sheet Wireshark](../../02-outils/wireshark.md#tcp-et-udp).

```wireshark title="scan TCP connect"
tcp.flags.syn == 1 && tcp.flags.ack == 0 && tcp.window_size > 1024
```

```wireshark title="scan SYN"
tcp.flags.syn == 1 && tcp.flags.ack == 0 && tcp.window_size <= 1024
```

```wireshark title="scan UDP : ports fermés"
icmp.type == 3 && icmp.code == 3
```

## Faux positifs

À compléter.

## Réponse

À compléter.
