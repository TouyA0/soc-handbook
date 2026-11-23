---
title: "IP et domaines"
description: "Enrichir un domaine ou une IP : enregistrements DNS, âge du domaine, typosquatting et IDN, réputation, AS, géolocalisation, services exposés, certificats TLS, VPN, et le déroulé d'une enquête."
tags: [cti, dns, whois, ip, shodan, vpn]
updated: 2026-11-23
draft: false
order: 3
---

## Méthode

Des étapes peuvent être sautées ou inversées selon l'alerte.

:::etapes
1. **Le domaine a-t-il l'air légitime ?**
   Ressemble-t-il à un typosquatting ?
2. **Sa réputation**
   Est-il connu comme malveillant ?
3. **Sa date de création**
   Un domaine récent est suspect.
4. **L'IP derrière**
   Résoudre le domaine, puis enquêter sur l'IP.
5. **Un CDN ?**
   Si l'IP appartient à un CDN, inutile d'aller plus loin sur elle.
6. **Sa réputation**
   VirusTotal, AbuseIPDB.
7. **Sa localisation**
   Est-ce un VPN ? Est-ce cohérent avec l'alerte ? Un employé américain n'a pas de raison de se connecter depuis l'Asie.
8. **Son type d'AS**
   Cohérent avec l'alerte ? Un employé n'a pas de raison de se connecter depuis un hébergeur cloud.
:::

## Domaine

| Source | Ce qu'on y lit |
| --- | --- |
| Enregistrements A / AAAA | Les IP (v4, v6) du domaine. Hébergement cloud ou CDN ; IP liée à une infrastructure ou une campagne connue ? |
| Enregistrements TXT | Sécurité de la messagerie (SPF, DKIM) et outils utilisés (Google Workspace, Zapier…). Une infrastructure d'attaque a souvent des TXT vides, un SPF suspect ou une fausse signature DKIM, utile au phishing. |
| WHOIS / RDAP | Bureau d'enregistrement, dates de création et d'expiration, et surtout **l'âge** du domaine. Une infrastructure d'attaque vit rarement plus de quelques mois ; un domaine malveillant a souvent quelques jours. |

Outils : nslookup.io, dnschecker.org, whois.domaintools.com.

**Pièges des domaines :**

- **CDN** : l'attaquant passe derrière Cloudflare, Akamai ou Fastly pour cacher son serveur. Une IP de CDN sert des milliers de services, légitimes et malveillants : elle ne dit rien.
- **Typosquatting** : `tryhakme[.]com`, `micros0ft[.]net` jouent sur la ressemblance. Tout sosie d'une marque connue est à haut risque ; mais une entreprise enregistre parfois ses propres fautes de frappe, et un typosquatting qui pointe vers la vraie marque n'est pas forcément malveillant.
- **IDN** : des lettres cyrilliques ou grecques identiques aux latines, comme le « а » cyrillique de `tryhаckme[.]com`. Convertir en Punycode (punycoder.com) : si le résultat commence par `xn--`, le domaine contient des caractères non ASCII et mérite un examen.

## IP

**Réputation** : AbuseIPDB (scans de ports, force brute) et VirusTotal (réputation, commentaires de la communauté). Hors CDN, **une seule détection** suffit à rendre l'IP risquée.

**Système autonome (AS)** : l'ensemble des plages d'IP d'une organisation, identifié par un numéro (ASN). bgp.tools donne le plus d'informations sur un AS et son rôle.

| Type d'AS | Exemple | Ce que ça indique |
| --- | --- | --- |
| Résidentiel | AS124888 (Vodafone) | Un VPN, ou un appareil personnel compromis. |
| Hébergement de serveurs | AS215439 (PLAY2GO) | Le plus risqué : souvent utilisé pour distribuer des malwares. |
| Cloud, CDN | AS16509 (Amazon AWS) | Utilisé par des services légitimes comme par des attaquants : à creuser. |

**Géolocalisation** : ipinfo.io, iplocation.net. Le pays est fiable, la ville rarement. Utile pour une connexion anormale (un employé américain qui se connecte depuis les Pays-Bas) ou un trafic inattendu (une entreprise européenne locale qui échange avec le Vietnam).

## Services exposés

Utile dans les deux sens. Sur l'IP publique d'une **victime** : un SSH exposé est sans doute le point d'entrée. Sur l'IP d'un **attaquant** : des services obsolètes ou un RDP exposé indiquent une machine compromise, servant de rebond.

- **Shodan** : ports ouverts et bannières de service (une vieille version est souvent vulnérable).
- **Censys** : voit aussi les services sur des ports non standard ; certaines fonctions demandent un compte.

Shodan et Censys ne gardent les informations que quelques semaines.

**Certificats TLS** (crt.sh, souvent indisponible ; Censys, SSL Shopper) :

| Champ | Ce qui alerte |
| --- | --- |
| Émetteur | Un certificat auto-signé mérite qu'on regarde le site de près. |
| Validité | Un certificat tout récent, ou à très longue durée de validité, peut signaler une infrastructure malveillante. |
| Sujet | Pour un certificat auto-signé, peut révéler le logiciel derrière le HTTPS (pfSense…). |

## VPN

Une connexion à Microsoft 365 hors des heures de travail, depuis le bon pays, la bonne ville, avec le bon User-Agent : l'analyste inexpérimenté clôture en faux positif, et c'est ce que l'attaquant attend. Un VPN (ProtonVPN, NordVPN…) permet de prendre n'importe quelle localisation.

**IP2Proxy** et **Spur** repèrent les IP de VPN, de proxy et les sorties Tor (offre gratuite pour un usage personnel, à intégrer au SIEM en entreprise). Derrière un VPN, la géolocalisation ne vaut plus rien : une connexion de Londres, pour un utilisateur londonien, par un VPN comme Mullvad, est à prioriser. Et si l'IP n'est liée à aucun VPN connu, ce n'est pas pour autant une raison de clôturer en faux positif.

Les informations sur les domaines et les IP changent vite : une infrastructure d'attaque est souvent démontée en quelques jours. Garder une trace de ce qu'on a trouvé au moment de l'enquête.
