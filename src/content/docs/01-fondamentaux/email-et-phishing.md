---
title: "E-mail et phishing"
description: "Comment un e-mail est construit et acheminé (adresse, SMTP, POP3, IMAP, en-tête, corps, pièces jointes), les types d'e-mails malveillants et les signes d'un phishing."
tags: [phishing, email, smtp, imap, pop3]
updated: 2026-11-27
draft: false
order: 5
---

Le spam est souvent peu risqué ; le phishing, lui, pousse l'utilisateur à livrer des informations sensibles ou à installer un malware sans le savoir. Un seul clic sur un lien ou une pièce jointe peut donner à l'attaquant un premier accès au réseau. Pour juger un e-mail malveillant ou non, il faut savoir comment il est fait. Les outils pour l'analyser sont dans [Phishing — outils d'analyse](../02-outils/analyse-de-phishing.md).

## L'adresse e-mail

| Partie | Rôle |
| --- | --- |
| Nom d'utilisateur | La boîte du destinataire sur le serveur de messagerie. |
| `@` | Sépare l'utilisateur du domaine, et indique où acheminer l'e-mail. |
| Domaine | Le serveur de messagerie chargé de recevoir le message. |

Dans `david@tryhackme.com`, l'utilisateur est `david`, le domaine `tryhackme.com`. Comme une adresse postale : le domaine est la rue ou l'immeuble, l'utilisateur la boîte aux lettres.

## Les protocoles

| Protocole | Rôle |
| --- | --- |
| SMTP | Envoyer les e-mails. |
| POP3 | Télécharger les e-mails sur un appareil. |
| IMAP | Synchroniser les e-mails entre plusieurs appareils. |

Pour recevoir, la boîte utilise POP3 ou IMAP selon sa configuration :

| Aspect | POP3 | IMAP |
| --- | --- | --- |
| Stockage | Téléchargés et stockés sur un seul appareil. | Stockés sur le serveur, téléchargeables sur plusieurs appareils. |
| Messages envoyés | Sur l'appareil qui les a envoyés. | Sur le serveur. |
| Accès | Depuis un seul appareil. | Synchronisés entre plusieurs appareils. |
| Sur le serveur | Supprimés en général après téléchargement. | Conservés, sauf suppression explicite. |

## Le trajet d'un e-mail

:::etapes
1. **L'utilisateur envoie l'e-mail**
   Son client le transmet à son serveur de messagerie, en SMTP.
2. **Le serveur interroge le DNS**
   Il demande quel est le serveur de messagerie du domaine destinataire.
3. **Le DNS répond**
   Avec l'adresse de ce serveur.
4. **L'e-mail est livré**
   Il traverse Internet jusqu'au serveur du destinataire.
5. **Le destinataire relève sa boîte**
   Son client se connecte à son serveur de messagerie.
6. **L'e-mail est récupéré**
   Téléchargé (POP3) ou synchronisé (IMAP) sur son appareil.
:::

## En-tête et corps

Un e-mail a deux parties : l'**en-tête**, les métadonnées (expéditeur, serveurs traversés pendant l'acheminement), et le **corps**, le message lui-même, en texte brut ou en HTML.

| Champ de l'en-tête | Contenu |
| --- | --- |
| From | L'adresse de l'expéditeur. |
| To | L'adresse du destinataire. |
| Reply-To | L'adresse où partent les réponses (facultatif). |
| Subject | L'objet. |
| Date | La date et l'heure d'envoi. |

La **source du message** (dans Thunderbird : **View › Message Source**, ou `Ctrl+U`) affiche le message brut complet : tous les champs de l'en-tête et le corps. Elle révèle des détails invisibles dans la boîte de réception, comme l'IP d'origine (`X-Originating-IP`) ou le serveur qui a vérifié l'authentification de l'e-mail (`Authentication-Results`).

## Le corps HTML

La plupart des clients affichent le corps HTML mis en forme (images, liens, styles). Sa source montre comment le message est construit : liens, images et autres éléments qu'on ne voit pas forcément dans le rendu. Thunderbird bloque par défaut certaines images : la source les montre quand même.

## Les pièces jointes dans la source

Une pièce jointe est stockée dans le message lui-même. Dans la source, trois en-têtes la décrivent :

| En-tête | Ce qu'il indique |
| --- | --- |
| `Content-Type` | Le type de fichier, par exemple `application/pdf`. |
| `Content-Disposition` | Que c'est une pièce jointe, et son nom de fichier. |
| `Content-Transfer-Encoding` | Son encodage, en général `base64`. |

Le bloc Base64 qui suit est le fichier lui-même : le décoder (CyberChef, recette **From Base64**, ou un convertisseur Base64 vers PDF) reconstitue la pièce jointe d'origine.

## Types d'e-mails malveillants

| Type | Ce que c'est |
| --- | --- |
| Spam | E-mails non sollicités envoyés en masse. Sa forme malveillante : le *malspam*. |
| Phishing | Se fait passer pour une entité de confiance pour obtenir des informations sensibles. |
| Spear phishing | Phishing ciblé sur une personne ou une organisation, souvent avec des informations personnalisées. |
| Whaling | Spear phishing qui vise les dirigeants (CEO, CFO), pour des données sensibles ou un accès financier. |
| Smishing | Phishing par SMS, sur les téléphones. |
| Vishing | Phishing par appel vocal : ingénierie sociale au téléphone. |

## Les signes d'un phishing

Quel que soit le but (identifiants, malware, accès), les techniques se ressemblent :

| Signe | Exemple |
| --- | --- |
| Expéditeur usurpé | Une adresse qui imite une entité de confiance : `noreply@microsof.com`. |
| Urgence | « Votre compte sera bloqué dans 24 heures. » |
| Usurpation de marque | Logos et couleurs d'une vraie entreprise. |
| Fautes | Tournures maladroites ou peu naturelles ; plus rares depuis l'IA. |
| Message générique | « Cher client » au lieu du nom du destinataire. |
| Liens cachés ou raccourcis | La vraie destination est masquée : `bit.ly/secure-login`. |
| Pièce jointe déguisée | Un exécutable présenté comme un document : `invoice.pdf.exe`. |

## Défanger les indicateurs

Pendant l'analyse, un clic accidentel sur un lien ou une pièce jointe peut suffire à une compromission. On **défange** les URL, domaines, adresses e-mail et IP : on remplace les caractères spéciaux pour les rendre non cliquables.

| Avant | Après |
| --- | --- |
| `http://www.suspiciousdomain.com` | `hxxp[://]www[.]suspiciousdomain[.]com` |

CyberChef le fait avec les recettes **Defang URL** et **Defang IP Addresses**.
