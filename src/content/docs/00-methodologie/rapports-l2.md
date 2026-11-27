---
title: "Rapports L2"
description: "Rendre compte d'un incident hors du SOC : à la direction, au client MSSP (rapport initial puis final), à l'équipe DFIR (notes de passation), et rédiger avec l'IA sans s'y fier aveuglément."
tags: [rapport, soc-l2, communication, dfir, mssp]
updated: 2026-11-27
draft: false
order: 5
---

Le L1 communique presque uniquement au sein de l'équipe : commentaires de tickets, escalades, passations (200 à 500 caractères par alerte, voir [Rapport et escalade](rapport-et-escalade.md)). Le L2 fait le lien entre le SOC et l'extérieur : il transforme les notes du SOC en un résumé précis sur lequel des collègues, un client ou la direction peuvent agir. Le rapport est l'image du SOC à l'extérieur : il doit être crédible et professionnel. Un rapport clair peut décider si une intrusion est stoppée à temps.

## Destinataires

En temps normal, le L2 s'en tient lui aussi aux commentaires d'alertes. Quand un incident grave survient, il rédige des rapports plus formels, et adapte son style au destinataire :

| Destinataire | Rapport |
| --- | --- |
| Direction (CTO, CISO, CEO) | Résumé de l'incident, ou rapport trimestriel du SOC : orienté métier, non technique. |
| Client MSSP | E-mail formel : ce qui s'est passé et ce qu'il faut faire ensuite. |
| Équipes DFIR, CTI, sécurité | Notes de passation : les constats du SIEM et de l'EDR et les indicateurs de l'attaque. |

## Canaux

| Canal | Usage |
| --- | --- |
| Appel | Situations urgentes qui demandent une réaction immédiate. Toujours suivi d'un e-mail de synthèse, pour la traçabilité. |
| E-mail | Toute mise à jour de sécurité et tout incident, avec toutes les parties concernées en copie : une trace écrite partagée. |
| Ticketing | Les grands MSSP ont un outil de tickets et un portail client (Jira ITSM, par exemple) qui remplacent les échanges d'e-mails. |
| Messagerie interne | Discussions internes et informelles. Comme pour un appel, les décisions et les constats se résument ensuite par e-mail. |

Chaque entreprise a ses propres circuits : ce tableau ne s'applique pas à tous les SOC.

## Rendre compte à la direction

Le SOC interne rend compte à la direction (CTO, CISO ou CEO) quand une intrusion traitée ou manquée a un impact sur l'activité. Aussi pour un rapport périodique sur l'efficacité du SOC, ou une demande d'achat ou de remplacement d'un outil de sécurité.

- **Parler métier** : ce qui compte pour l'entreprise, pas seulement pour le SOC.
- **Ton formel** : s'exprimer en expert indépendant, pas en vieil ami.
- **Rester simple** : pas de jargon, le public n'est pas technique.
- **S'appuyer sur des faits** : garder les preuves de chaque affirmation (captures, liens).
- **Ne pas paniquer** : pendant un incident, montrer que la situation est sous le contrôle du SOC.

## Prévenir un client MSSP

Signaler une menace à un client est l'une des tâches les plus fréquentes du L2 en MSSP. Toujours par un canal officiel, en général l'e-mail, avec des collègues du SOC et les représentants du client en copie.

Exemple : le L1 escalade une alerte critique de *data stealer* sur `LPT-007`. L'analyse montre que les clés d'accès AWS stockées sur le portable d'un développeur ont été volées. On supprime le malware et on isole la machine, mais on ne peut pas « dé-voler » les clés : il faut prévenir le client d'urgence et lui expliquer comment les invalider.

### Le rapport initial

But : lancer le **confinement** au plus vite, dans le SLA. Il n'explique pas tout l'incident, il réunit ce qu'on sait déjà :

:::etapes
1. **Souligner l'urgence**
   Dès l'objet et la première phrase.
2. **Résumer le cas**
   Ce qui a été détecté, quand, sur quelle machine, avec quel impact.
3. **Proposer des actions au client**
   Ce qu'il doit faire, lui, pour stopper la menace.
4. **Annoncer la suite**
   Ce que fait le SOC, et quand le client aura des nouvelles.
:::

> **Objet :** [Incident SOC] Infection par un data stealer sur LPT-007
>
> Madame, Monsieur,
>
> Nous vous informons d'un incident de sécurité critique dans votre environnement. Aujourd'hui à 17:15 UTC, notre SOC a détecté et confirmé une infection par le data stealer AMOS sur LPT-007, poste de Bob Phisher, développeur backend principal. Le malware a été mis en quarantaine, mais il a exfiltré auparavant les clés d'accès AWS stockées sur le poste. Sans réaction rapide, elles pourraient servir à consulter ou modifier les données de votre environnement AWS ; l'étendue exacte est en cours d'analyse.
>
> **Actions recommandées**
> - Prévenir Bob Phisher que son portable est temporairement isolé du réseau.
> - Désactiver toutes ses clés d'accès AWS, sur tous les comptes AWS.
>
> **De notre côté**
> - La menace est en quarantaine et la machine isolée.
> - Nous analysons l'étendue de l'exfiltration.
> - Nous vous transmettrons des détails supplémentaires d'ici 30 minutes.
>
> Merci de traiter ces actions en urgence. Nous sommes disponibles pour un appel dès que possible.

Le rapport initial envoyé, l'analyse **continue**, et l'équipe SOC reste informée des échanges avec le client.

### Le rapport final

La communication se poursuit ensuite : le SOC partage ses nouveaux constats, le client apporte son contexte. Le rapport final, une fois tout réuni, est la preuve formelle que le travail sur l'incident est terminé. Il répond à toutes les questions que le client peut se poser :

- comment l'attaque a-t-elle commencé ?
- qui ou quoi a été touché ?
- l'attaque est-elle toujours en cours ?
- quel est l'impact connu ?
- pourquoi le SOC ne l'a-t-il pas empêchée ?
- que va faire le SOC ensuite ?
- comment éviter une réinfection ?

Il suit trois parties :

| Partie | Contenu dans l'exemple |
| --- | --- |
| Résumé de l'incident | La date et l'heure de détection, l'origine (site de phishing remonté par empoisonnement des résultats de recherche, faux installateur Discord), ce qui a été exfiltré et ce que les clés auraient permis, ce qui a été fait (isolation, nettoyage, rotation des clés par le client), l'absence d'autre impact et la levée de l'isolation. |
| Analyse des causes | L'utilisateur n'a pas reconnu le domaine de phishing et a voulu installer un logiciel non approuvé par l'IT ; le SOC a détecté le stealer mais ne l'a pas bloqué en temps réel, et va revoir les politiques de prévention de l'EDR avec les ingénieurs. |
| Recommandations à long terme | Sensibiliser tous les employés ; imposer le contrôle des applications via la solution MDM ; contrôler strictement l'accès à l'environnement des données de cartes ; auditer les comptes AWS privilégiés et retirer les rôles inutiles. |

## Passer la main à la DFIR

L'équipe DFIR (*Digital Forensics and Incident Response*) est comme les pompiers : quand un incident majeur survient et que les journaux habituels ne suffisent plus, elle rejoint l'effort et prend souvent la main sur l'incident. Dans une petite entreprise, SOC et DFIR ne font qu'un et l'échange est informel ; dans une grande, ce sont deux équipes indépendantes, et l'échange devient formel.

Exemple : le MSSP vient de commencer l'intégration d'un client et ne surveille que 10 % de son réseau AD. Une alerte critique de rançongiciel tombe, et tout indique que l'ensemble du réseau est en cours de chiffrement. On isole ce qu'on peut, on appelle le client et on lui conseille d'éteindre tous ses serveurs. Le client fait appel à une équipe DFIR externe, à qui il faut transmettre tous les constats et indicateurs du SIEM.

Une équipe DFIR attend des faits et des preuves, pas du style : des TTP et des artefacts exploitables, pour reprendre là où le SOC s'est arrêté. Une page de constats du SIEM vaut mieux que dix pages de remplissage. Pas de recommandations génériques : ce sont des experts.

| Partie | Contenu |
| --- | --- |
| Contexte | Comment tout a commencé, et quelles sources de journaux le SOC surveille. |
| Timeline de l'attaque | Quand et où l'attaque a commencé, puis chaque étape dans l'ordre. |
| Périmètre | Tout ce qu'on sait des machines, comptes et autres actifs touchés. |
| Actions réalisées | Les mesures de réponse déjà prises, par le SOC ou par le client. |
| Indicateurs bruts | IP, domaines, hashes, scripts, outils et autres IOC identifiés. |

Avec une équipe externe, on passe par l'**e-mail**, pour la traçabilité et pour des raisons juridiques. Des notes de passation doivent être **chronologiques**, **exploitables** et **concises**. Format d'une entrée de la timeline et des indicateurs, tiré de l'exemple de la room :

> **6 mars, 07:32 UTC | WEB-01**
> L'attaquant a exploité une faille d'envoi de fichiers sans restriction dans `/feedback/form.php` pour déposer un web shell PHP (`shell.php`) par HTTP POST. Le web shell a servi à lancer des commandes de découverte (`whoami`, `ipconfig`, `systeminfo`) et à déposer un binaire C2 non identifié (`beacon.exe`) dans `C:\Windows\`.
>
> **Indicateurs**
> - Fichier du web shell : `shell.php`
> - Fichier C2 : `C:\Windows\beacon.exe`
> - Persistance du C2 (tâche) : `\TelemetryService`

Le reste de l'exemple suit la même logique : un résumé du cas avec les liens utiles (schémas du réseau, outils de surveillance en place, alertes reçues), la timeline complète, la réponse du SOC, puis tous les indicateurs avec leurs hashes et IP.

## Rédiger avec l'IA

Mettre une chaîne d'attaque en forme de rapport peut prendre une demi-heure ou plus. Une IA générative fait gagner ce temps : on lui donne ses notes et les exigences du rapport, elle rend un rapport structuré. La qualité dépend du modèle et surtout du **contexte** fourni, avec des consignes de style et de longueur :

| Contexte | Exemple |
| --- | --- |
| Profil du client | Secteur, taille, accords particuliers du contrat MSSP. |
| Actifs | Rôle du serveur, poste de l'employé touché. |
| Threat intelligence | Rapports d'enrichissement sur les indicateurs observés. |
| Historique | Résumés et conclusions d'incidents similaires passés. |
| Notes de surveillance | Faux positifs notables, particularités du SIEM. |

Le résultat doit toujours être vérifié, surtout s'il sort de l'équipe : envoyer un rapport juste reste la responsabilité de l'analyste.

| Piège | Ce qui se passe |
| --- | --- |
| Fuite de données sensibles | Tout ce qu'on colle dans un service en ligne échappe à notre contrôle. Avec une IA dans le cloud, ne jamais y mettre de données confidentielles, surtout celles des clients MSSP et les identifiants en dur (dans une ligne de commande, par exemple). |
| Texte de remplissage | Le lecteur veut des instructions exploitables, pas du volume. Dix pages sans indicateurs ni recommandations applicables, c'est un mauvais rapport. |
| Hallucinations | Un outil légitime qui lit les hashes des mots de passe du domaine pour les comparer aux fuites publiques : sans sa documentation, l'IA y verra un vol d'identifiants et recommandera d'isoler la machine. |
| Confinement destructeur | Un malware injecté dans la mémoire de l'Explorateur Windows : l'IA propose de mettre `explorer.exe` en quarantaine, ce qui casse le système sans supprimer la menace. Se méfier de ses conseils de confinement et d'éradication. |

:::piege
L'IA aide à rédiger, mais c'est l'analyste qui décide : jamais l'inverse.
:::
