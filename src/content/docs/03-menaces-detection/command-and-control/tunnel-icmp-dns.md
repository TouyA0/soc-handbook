---
title: "Tunnel ICMP et DNS"
description: "L'attaquant cache ses commandes ou des données volées dans des protocoles de confiance, ICMP et DNS, pour passer les défenses du périmètre."
tags: [réseau, dns, icmp, tunnel, c2, exfiltration, wireshark]
updated: 2026-11-18
draft: false
type: technique
attack_id: T1572
tactic: command-and-control
severity: high
data_sources: [Capture réseau]
---

## Description

Un tunnel encapsule des données dans un autre protocole. Les attaquants utilisent ICMP et DNS, protocoles de confiance du trafic quotidien, pour la commande et contrôle (C2) et l'exfiltration. Le tunnel apparaît en général **après** l'exécution d'un malware ou l'exploitation d'une vulnérabilité.

- **ICMP** : les données (TCP, HTTP, SSH…) voyagent dans la charge utile des paquets. Beaucoup de réseaux d'entreprise bloquent les paquets ICMP personnalisés, ou exigent des droits d'administrateur pour en créer.
- **DNS** : l'attaquant configure un domaine comme serveur de C2. Le malware envoie des requêtes pour des sous-domaines qui sont en fait des commandes encodées, `encoded-commands.maliciousdomain.com` ; le serveur répond avec les commandes à exécuter. Outils connus : dnscat, dns2tcp.

## Ce qu'on observe

| Indicateur | ICMP | DNS |
| --- | --- | --- |
| Volume | Beaucoup de trafic ICMP. | Volume anormal de requêtes vers une même cible. |
| Taille | Paquets plus grands que la normale (64 octets). | Requêtes plus longues que la normale. |
| Contenu | Traces d'un autre protocole dans la charge utile. | Sous-domaines longs, encodés, aux noms irréguliers ; motifs d'outils connus. |
| Destination | Adresses de destination à vérifier. | Le domaine visé. |

Un attaquant peut garder des paquets ICMP à la taille normale de 64 octets : il faut savoir ce qui est normal sur le réseau pour repérer l'anomalie, et escalader pour analyse.

## Détection

### Wireshark

```wireshark title="tout le trafic ICMP"
icmp
```

```wireshark title="ICMP avec une charge utile plus grande que la normale"
data.len > 64 && icmp
```

```wireshark title="noms DNS longs, sans le trafic mDNS du réseau local"
dns.qry.name.len > 15 && !mdns
```

```wireshark title="traces de l'outil dnscat"
dns contains "dnscat"
```

## Faux positifs

À compléter.

## Réponse

À compléter.
