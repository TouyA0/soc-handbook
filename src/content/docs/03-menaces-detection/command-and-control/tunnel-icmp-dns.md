---
title: "Tunnel ICMP et DNS"
description: "L'attaquant cache ses commandes ou des données volées dans des protocoles autorisés et peu surveillés, ICMP et DNS, pour passer les défenses du périmètre."
tags: [réseau, dns, icmp, tunnel, c2, exfiltration, wireshark]
updated: 2026-11-14
draft: false
type: technique
attack_id: T1572
tactic: command-and-control
severity: high
data_sources: [Capture réseau, Journaux DNS]
---

## Description

Un tunnel encapsule un trafic (commandes, fichiers, session TCP ou SSH) dans un autre protocole. Les attaquants choisissent ICMP et DNS parce qu'ils sont autorisés presque partout et rarement inspectés : le tunnel sert de canal de commande et contrôle (C2) ou d'exfiltration (:attack[T1048]). Il apparaît en général **après** une compromission : exécution d'un malware ou exploitation d'une vulnérabilité.

- **ICMP** : les données voyagent dans la charge utile des paquets, par exemple des `echo request` et `echo reply` (ping).
- **DNS** : l'attaquant contrôle un domaine. Le malware encode ses données dans des sous-domaines, `données-encodées.domaine-malveillant.com` ; le serveur DNS de l'attaquant reçoit la requête et renvoie les commandes dans la réponse (:attack[T1071.004]). Outils connus : dnscat2, dns2tcp.

## Ce qu'on observe

| Indicateur | ICMP | DNS |
| --- | --- | --- |
| Volume | Beaucoup de paquets ICMP vers un même hôte. | Beaucoup de requêtes vers un même domaine, chacune avec un sous-domaine différent. |
| Taille | Charge utile plus grande que celle d'un ping (32 octets sous Windows, 56 sous Linux). | Noms de domaine longs. |
| Contenu | Traces d'un autre protocole dans la charge utile : en-têtes HTTP, bannière SSH. | Sous-domaines aléatoires ou encodés (Base32, Base64, hexadécimal), nom d'un outil comme `dnscat`. |
| Destination | Un hôte externe inhabituel. | Un domaine inconnu, récent, qui ne sert aucun autre trafic. |

Aucun indicateur ne suffit seul : un attaquant peut garder des paquets ICMP de taille normale. C'est la répétition vers une même destination qui trahit le tunnel.

## Détection

### Wireshark

```wireshark title="tout le trafic ICMP"
icmp
```

```wireshark title="ICMP avec une charge utile anormalement grande"
icmp && data.len > 64
```

```wireshark title="noms DNS longs, sans le trafic mDNS du réseau local"
dns.qry.name.len > 15 && !mdns
```

Le seuil de 15 caractères est un point de départ : l'ajuster à ce qui est normal sur le réseau étudié.

```wireshark title="traces de l'outil dnscat"
dns contains "dnscat"
```

```wireshark title="requêtes TXT, qui peuvent transporter des données"
dns.qry.type == 16
```

:::astuce
Ajouter `dns.qry.name` en colonne (clic droit › Apply as Column) puis trier : les centaines de sous-domaines d'un même domaine sautent aux yeux. Pour ICMP, Statistics › Conversations montre le volume échangé avec chaque hôte.
:::

## Faux positifs

:::faux-positifs
- **Noms DNS longs légitimes** : CDN, services cloud, et certains antivirus ou services de réputation qui encodent leurs interrogations dans des sous-domaines.
- **Gros paquets ICMP** : tests réseau (ping avec une taille choisie, recherche de MTU).
- **Requêtes TXT** : vérifications de messagerie (SPF, DKIM) et de propriété de domaine.
:::

:::piege
La longueur seule ne prouve rien : regarder **le domaine parent**. Un tunnel, c'est un même domaine interrogé avec des sous-domaines toujours différents, en grand nombre et souvent à intervalle régulier.
:::

## Réponse

À compléter.
