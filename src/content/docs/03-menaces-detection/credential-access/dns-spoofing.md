---
title: "DNS Spoofing"
description: "L'attaquant répond à la place du serveur DNS pour qu'un nom de domaine légitime pointe vers sa propre machine."
tags: [réseau, dns, mitm, wireshark]
updated: 2026-10-05
draft: false
type: technique
attack_id: T1557
tactic: credential-access
severity: med
data_sources: [Capture réseau]
related: [03-menaces-detection/credential-access/arp-spoofing]
---

## Description

Le DNS traduit un nom de domaine lisible (`www.exemple.com`) en adresse IP, comme un répertoire téléphonique : on retient le nom, pas le numéro.

Dans une attaque par DNS spoofing (ou empoisonnement de cache DNS), l'attaquant fausse cette traduction : la victime reçoit une mauvaise adresse IP pour le site qu'elle veut visiter. Le déroulement type :

1. La victime veut joindre un site légitime et envoie une requête DNS.
2. L'attaquant, déjà présent sur le réseau local (par exemple grâce à un [ARP spoofing](arp-spoofing.md)), intercepte cette requête.
3. Il envoie rapidement une **fausse réponse DNS** : le domaine demandé se trouverait à sa propre adresse IP.
4. La machine de la victime fait confiance à cette réponse et la garde dans son cache DNS. En se connectant au site, elle se connecte en réalité au serveur de l'attaquant, qui peut héberger une copie fidèle du site.

L'attaquant est alors « au milieu » (Man-in-the-Middle) et récupère tout ce que la victime saisit, identifiants compris.

## Ce qu'on observe

Dans les journaux ou dans une capture réseau, les signes à chercher sont :

- **Plusieurs réponses DNS pour une même requête** : le résolveur légitime et le faux répondent tous les deux. C'est l'indicateur le plus fiable.
- **Une réponse DNS venant d'une source inattendue** : une IP qui ne correspond à aucun résolveur configuré.
- **Des TTL anormalement courts** (de 1 à 30 secondes) : l'attaquant garde des entrées empoisonnées de courte durée pour pouvoir reprendre la main.
- **Des réponses DNS non sollicitées** : une réponse sans requête correspondante de la victime.

## Détection

### Wireshark

La démarche : isoler le DNS, regarder à quoi ressemblent les réponses normales, puis chercher les réponses qui ne viennent pas du résolveur attendu. Dans les exemples, `8.8.8.8` est le résolveur légitime et `portail.exemple.local` le domaine étudié : les remplacer par ceux du réseau analysé.

```wireshark title="tout le trafic DNS"
dns
```

```wireshark title="réponses du résolveur légitime (la référence)"
dns.flags.response == 1 && ip.src == 8.8.8.8
```

```wireshark title="toutes les réponses DNS"
dns.flags.response == 1
```

Dans cette liste, on cherche les réponses dont l'IP source n'est pas celle du résolveur habituel.

```wireshark title="tout le DNS concernant le domaine étudié"
dns && dns.qry.name == "portail.exemple.local"
```

```wireshark title="réponses du résolveur légitime pour ce domaine"
dns.flags.response == 1 && ip.src == 8.8.8.8 && dns.qry.name == "portail.exemple.local"
```

```wireshark title="réponses pour ce domaine venant d'une autre source"
dns.flags.response == 1 && ip.src != 8.8.8.8 && dns.qry.name == "portail.exemple.local"
```

C'est le filtre décisif : s'il renvoie des paquets, une machine du réseau se comporte comme un faux serveur DNS et envoie des réponses usurpées.

## Faux positifs

À compléter.

## Réponse

À compléter.
