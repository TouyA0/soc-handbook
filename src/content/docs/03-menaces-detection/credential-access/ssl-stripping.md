---
title: "SSL Stripping"
description: "L'attaquant, placé au milieu, retire le chiffrement TLS : la victime échange en HTTP en clair alors que le site utilise HTTPS."
tags: [réseau, tls, http, mitm, wireshark]
updated: 2026-10-05
draft: false
type: technique
attack_id: T1557
tactic: credential-access
severity: med
data_sources: [Capture réseau]
related:
  - 03-menaces-detection/credential-access/arp-spoofing
  - 03-menaces-detection/credential-access/dns-spoofing
---

## Description

Le SSL stripping est une technique de Man-in-the-Middle : l'attaquant intercepte le trafic et supprime, ou empêche, le chiffrement TLS entre le client et le serveur. Il garde de son côté une session HTTPS avec le vrai serveur, mais relaie le contenu à la victime en **HTTP simple**. Il peut ainsi lire tout ce qui passe, identifiants compris.

Le déroulement type :

1. La victime lance une requête HTTPS vers un site.
2. L'attaquant intercepte la requête, grâce à un [ARP spoofing](arp-spoofing.md) ou à un point d'accès pirate.
3. Il se connecte au site en HTTPS, mais renvoie la réponse à la victime en HTTP.
4. La victime utilise le site en HTTP sans s'en rendre compte : ses données sensibles circulent en clair.

Dans la chaîne d'attaque étudiée, le SSL stripping arrive après un [DNS spoofing](dns-spoofing.md) qui a déjà envoyé la victime vers l'IP de l'attaquant.

## Ce qu'on observe

- **Un passage de HTTPS à HTTP pour le même domaine** : la première requête vise HTTPS (port 443), puis les paquets suivants basculent aussitôt en HTTP non chiffré (port 80).
- **Des redirections ou des liens réécrits** : des redirections (codes HTTP 301, 302) qui ramènent systématiquement une requête HTTPS vers une ressource HTTP.
- **Des erreurs de certificat** : la poignée de main TLS initiale peut échouer, ou présenter un certificat auto-signé, si l'attaquant utilise un proxy plus direct. Il cherche en général à le cacher.

## Détection

### Wireshark

La démarche : prouver que le site utilise normalement TLS, montrer que la victime a été envoyée vers l'attaquant, puis constater que ses échanges avec lui sont en HTTP. Dans les exemples, `portail.exemple.local` est le domaine étudié, `192.168.1.20` la victime et `192.168.1.50` l'attaquant : les remplacer par ceux du réseau analysé.

```wireshark title="tout le trafic TLS / SSL"
tls || ssl
```

```wireshark title="poignées de main TLS vers le domaine (Client Hello + SNI)"
tls.handshake.type == 1 && tls.handshake.extensions_server_name == "portail.exemple.local"
```

Ce filtre montre que le domaine est bien joint en TLS en temps normal : c'est le point de comparaison.

```wireshark title="réponses DNS usurpées envoyées par l'attaquant pour ce domaine"
dns.flags.response == 1 && ip.src == 192.168.1.50 && dns.qry.name == "portail.exemple.local"
```

```wireshark title="HTTP en clair de la victime vers l'attaquant"
http && ip.src == 192.168.1.20 && ip.dst == 192.168.1.50
```

C'est le filtre décisif : après l'usurpation DNS, le domaine n'apparaît plus dans des poignées de main TLS et la victime échange en HTTP avec l'attaquant. Si elle s'est connectée au site, ses identifiants sont lisibles en clair dans ces paquets.

## Faux positifs

À compléter.

## Réponse

À compléter.
