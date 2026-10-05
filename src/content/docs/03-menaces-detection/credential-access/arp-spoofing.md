---
title: "ARP Spoofing"
description: "L'attaquant associe sa propre adresse MAC à l'adresse IP d'une autre machine, souvent la passerelle, pour se placer au milieu du trafic."
tags: [réseau, arp, mitm, wireshark]
updated: 2026-10-05
draft: false
type: technique
attack_id: T1557.002
tactic: credential-access
severity: med
data_sources: [Capture réseau]
---

## Description

ARP (Address Resolution Protocol) fait le lien entre une adresse IP et une adresse MAC sur un réseau local. Avant d'envoyer des données à une IP, une machine demande « qui a cette IP ? » (`who-has`) et la machine concernée répond avec son adresse MAC (`is-at`).

Dans une attaque par ARP spoofing, l'attaquant envoie de fausses réponses ARP pour que les autres machines associent **son** adresse MAC à une IP légitime, le plus souvent celle de la passerelle. Le cache ARP de la victime est alors empoisonné : tout le trafic destiné à la passerelle passe d'abord par l'attaquant, qui peut l'intercepter, le modifier ou le rediriger (Man-in-the-Middle).

L'attaque fonctionne parce qu'ARP n'a **aucune authentification** : n'importe quelle machine peut envoyer une réponse `is-at` que personne n'a demandée, et les autres l'acceptent.

## Ce qu'on observe

Dans les journaux ou dans une capture réseau, les signes à chercher sont :

- **Une même IP annoncée par plusieurs adresses MAC** : quelqu'un se fait passer pour une autre machine.
- **Des réponses ARP non sollicitées** : beaucoup de réponses `is-at` sans requête `who-has` correspondante.
- **Un volume ARP anormal** : un grand nombre de paquets ARP sur un intervalle court.
- **Un routage inhabituel** : du trafic qui transite par l'adresse MAC de l'attaquant.
- **Plusieurs MAC de destination pour l'IP de la passerelle**.
- **Des boucles de requêtes** du type `Who has 192.168.1.x? Tell 192.168.1.y`, répétées en grand nombre.

## Détection

### Wireshark

Les filtres suivent l'ordre de l'enquête : isoler ARP, séparer requêtes et réponses, puis se concentrer sur la passerelle. Dans les exemples, `192.168.1.1` est l'IP de la passerelle, `aa:bb:cc:dd:ee:ff` sa véritable adresse MAC et `11:22:33:44:55:66` l'adresse MAC suspecte : les remplacer par celles du réseau étudié.

```wireshark title="tout le trafic ARP"
arp
```

```wireshark title="requêtes ARP (who-has)"
arp.opcode == 1
```

```wireshark title="réponses ARP (is-at)"
arp.opcode == 2
```

Une réponse légitime suit en général une requête `who-has` récente. De nombreuses réponses sans requête visible, ou la même IP annoncée en boucle par une MAC inattendue, sont suspectes.

```wireshark title="annonces ARP gratuites"
arp.isgratuitous
```

Des annonces gratuites répétées peuvent indiquer un attaquant qui entretient l'empoisonnement.

```wireshark title="ARP émis par la passerelle légitime (IP + MAC connues)"
arp && arp.src.proto_ipv4 == 192.168.1.1 && eth.src == aa:bb:cc:dd:ee:ff
```

```wireshark title="toutes les réponses qui annoncent l'IP de la passerelle"
arp.opcode == 2 && arp.src.proto_ipv4 == 192.168.1.1
```

C'est le filtre décisif : si des réponses associent l'IP de la passerelle à une **autre** MAC que la sienne, et qu'elles reviennent fréquemment, c'est de l'ARP spoofing.

```wireshark title="même recherche, sur le texte de la colonne Info"
arp.opcode == 2 && _ws.col.info contains "192.168.1.1 is at"
```

```wireshark title="réponses usurpées émises par la MAC suspecte"
arp.opcode == 2 && arp.src.proto_ipv4 == 192.168.1.1 && eth.src == 11:22:33:44:55:66
```

```wireshark title="adresses IP en double détectées par Wireshark"
arp.duplicate-address-detected || arp.duplicate-address-frame
```

Ce dernier filtre confirme qu'une même IP est associée à deux adresses MAC : l'attaquant s'est bien placé entre la victime et la passerelle.

:::astuce
`Ctrl + Alt + 1` affiche la date et l'heure réelles de chaque paquet au lieu du temps écoulé depuis le début de la capture : utile pour mesurer la fréquence des réponses.
:::

:::piege
`arp.isgratuitous` ne repère que les annonces ARP « gratuites » au sens strict, celles où l'IP émettrice et l'IP cible sont identiques. Une fausse réponse adressée directement à une victime n'en fait pas forcément partie : ne pas conclure sur ce seul filtre, toujours vérifier les réponses qui annoncent l'IP de la passerelle.
:::

## Faux positifs

À compléter.

## Réponse

À compléter.
