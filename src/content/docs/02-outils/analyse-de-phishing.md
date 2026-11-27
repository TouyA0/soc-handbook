---
title: "Phishing — outils d'analyse"
description: "Analyser un e-mail suspect : les artefacts à relever dans l'en-tête et le corps, et un outil par étape (en-têtes, réputation, liens, pièces jointes, sandbox, PhishTool)."
tags: [phishing, email, sandbox, any-run, virustotal]
updated: 2026-11-27
draft: false
---

Face à un e-mail suspect, le premier objectif est de relever les artefacts clés : ils servent ensuite aux vérifications de réputation, aux recherches de threat intelligence et à l'analyse de comportement. Une partie se lit directement dans le client de messagerie ; l'**IP de l'expéditeur** et le **Reply-To** ne se trouvent que dans l'en-tête (dans Thunderbird : **View › Message Source**).

## Artefacts à relever

| Où | Artefact | La question à se poser |
| --- | --- | --- |
| En-tête | Adresse de l'expéditeur | D'où vient l'e-mail ? |
| En-tête | IP de l'expéditeur | Quelle est l'IP source, et que donne une résolution inverse ? |
| En-tête | Objet | Joue-t-il sur l'urgence ou appelle-t-il à une action ? |
| En-tête | Destinataires | À qui est-il destiné (To, CC, BCC) ? |
| En-tête | Reply-To | Où partent les réponses ? |
| En-tête | Date et heure | Quand a-t-il été envoyé ? |
| Corps | URL et liens | Où mènent-ils vraiment ? Déplier les URL raccourcies. |
| Corps | Nom des pièces jointes | Le nom ou l'extension sont-ils suspects ? |
| Corps | Hash des pièces jointes | À calculer pour les recherches de threat intelligence. |

## En-têtes

On colle l'en-tête complet dans l'outil, qui en extrait l'IP de l'expéditeur, le chemin de transmission et les erreurs de configuration éventuelles, dont le résultat SPF.

| Outil | Ce qu'il fait |
| --- | --- |
| Messageheader | Outil de la Google Admin Toolbox : analyse d'un en-tête collé. |
| Message Header Analyzer | Même analyse. |

Dans la source du message, le champ **Return-Path** peut révéler un domaine sans rapport avec la marque affichée : un domaine à surveiller.

## Réputation des IP et des URL

Vérifier d'où viennent les IP relevées, et la réputation des IP et des URL : l'infrastructure est-elle légitime, ou déjà liée à une activité malveillante ? Voir aussi [IP et domaines](../05-threat-intel/ip-et-domaines.md).

| Outil | Ce qu'il fait |
| --- | --- |
| IPinfo | Localisation et organisation d'une IP. |
| URLScan.io | Visite un site à notre place : simule une navigation réelle, enregistre toute l'activité de la page et prend une capture d'écran. |
| Talos Reputation Center | Outil de Cisco : réputation et classification d'une IP, d'un domaine ou d'un réseau, et d'un hash de fichier. |

## Liens du corps

Les liens se relèvent dans le contenu visible, ou dans le HTML et la source brute, où se cachent les URL masquées ou obfusquées.

- **Clic droit › Copier l'adresse du lien** (le nom varie selon le navigateur ou le client) : on évalue l'URL sans la suivre.
- **Extracteur d'URL** : on colle le contenu brut de l'e-mail, l'outil liste tous les liens, y compris ceux qu'on aurait manqués.
- **CyberChef**, recette **Extract URLs** : même usage.

Un bouton comme « Mettre à jour mon compte » mène souvent à une URL raccourcie (`t.co`…), qui cache la vraie destination.

## Pièces jointes

Ne pas les télécharger depuis le client de messagerie : seulement dans un environnement contrôlé (machine de lab, sandbox), pour éviter une exécution accidentelle. Puis calculer le hash :

```bash title="hash SHA-256 d'une pièce jointe"
sha256sum <pièce jointe>
```

| Outil | Ce qu'il fait |
| --- | --- |
| Talos Reputation Center | Réputation du hash : un fichier classé *Phishing*, *Malicious*, *Spam* est sans doute dangereux. |
| VirusTotal | Réputation de fichiers, URL, IP et domaines d'après des dizaines d'éditeurs ; accepte aussi l'envoi de fichiers et d'URL. Voir [Lire un rapport VirusTotal](../05-threat-intel/fichiers-et-hashes.md#lire-un-rapport-virustotal). |

## Sandboxes

Pas besoin de savoir analyser un malware pour comprendre une pièce jointe : une sandbox en ligne l'exécute dans un environnement contrôlé. On y voit les URL qu'elle contacte, les charges qu'elle télécharge et les autres IOC.

| Sandbox | Particularité |
| --- | --- |
| ANY.RUN | Interactive : on agit dans la machine pendant l'exécution, en suivant processus, réseau et modifications du système en temps réel. |
| Hybrid Analysis | Gratuite : comportement du fichier, modifications du système, activité réseau, IOC. |
| Joe Sandbox | De Joe Security : analyses statique et dynamique, rapports complets (comportement, IOC, classification). |

Où lire chaque information dans ANY.RUN :

| Information | Où |
| --- | --- |
| Verdict | La classification de l'analyse, par exemple *Suspicious activity*. |
| URL ouverte par un processus | L'onglet **Processes**, à droite. |
| IP résolue par un domaine | L'onglet **Connections**, ou **DNS Requests**. |
| Chemin d'un processus | Sélectionner le processus, puis **More Info**. |
| Alerte réseau associée | Les menaces réseau : nom de la signature IDS déclenchée (règles `ET …`). |

:::piege
Un fichier Excel qui lance `EQNEDT32.EXE` (l'éditeur d'équations de Microsoft Office) à son ouverture exploite la **CVE-2017-11882**, puis télécharge la suite. Ce processus enfant d'un document Office est un signal à lui seul.
:::

## PhishTool

Une plateforme qui automatise une grande partie de l'analyse d'un e-mail, en réunissant threat intelligence, OSINT, métadonnées et analyse automatisée.

:::etapes
1. **Importer l'e-mail**
   Les artefacts s'affichent, avec à droite le rendu HTML (comme dans la boîte de réception), le HTML brut et la source du message.
2. **Parcourir les onglets**
   Authentification, transmission (chemin du message), URL, pièces jointes.
3. **Consulter VirusTotal**
   Intégré : réputation et détections sans quitter l'outil.
4. **Clôturer**
   Classer l'e-mail (malveillant…), signaler les artefacts clés (expéditeur, IP d'origine, URL), ajouter des notes, puis **Resolve** : comme la documentation et la clôture d'un cas au SOC.
:::
