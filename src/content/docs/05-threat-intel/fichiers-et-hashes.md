---
title: "Fichiers et hashes"
description: "Enrichir un fichier suspect : indices dans le chemin et le nom, calcul du hash, lecture d'un rapport VirusTotal, MalwareBazaar, et ce qu'une sandbox apporte et ne voit pas."
tags: [cti, hash, virustotal, malwarebazaar, sandbox]
updated: 2026-11-23
draft: false
order: 2
---

## Indices dans le chemin et le nom

Seuls, ils ne prouvent rien ; vus avec méfiance, ils révèlent les habitudes de l'attaquant.

| Emplacement | Pourquoi l'attaquant l'utilise |
| --- | --- |
| `C:\` | Racine du disque système, cible fréquente pour la persistance. |
| `C:\Users\Public` | Accessible à tous les utilisateurs. `Public Downloads` est très fréquenté et souvent peu surveillé. |
| `C:\Windows\Temp\` | Charges temporaires. |
| `C:\ProgramData\` | Dossier système accessible en écriture : persistance discrète. |

| Indice dans le nom | Exemple | Ce que ça cache |
| --- | --- | --- |
| Double extension | `invoice.pdf.exe` | Windows masque par défaut les extensions connues. |
| Imitation d'un binaire système | `scvhost.exe` | Joue sur la familiarité avec les processus de Windows. Mettre en liste blanche les emplacements légitimes des processus système, pas leurs seuls noms. |
| Nom aléatoire | `jh8F21.exe` | Packing ou génération automatique, courant dans les campagnes de phishing à fort renouvellement. |
| Camouflage | `backup-2300.exe` | Se fond parmi les fichiers courants ; ou un seul caractère changé, qui trompe l'œil. |

## Le hash

Les attaquants renomment sans cesse leurs fichiers ; le hash (SHA256, MD5) identifie le fichier quel que soit son nom. Travailler sur un fichier suspect dans un environnement isolé.

| Système | Commande |
| --- | --- |
| CMD | `certutil -hashfile bl0gger.exe SHA256` |
| PowerShell | `Get-FileHash -Algorithm SHA256 bl0gger.exe` |
| Linux | `sha256sum bl0gger.exe` |

- Noter les hashes **en minuscules**, pour éviter les fausses différences.
- Hasher ce qui compte : un malware dans un zip, hasher l'archive **et** le fichier extrait.
- Toujours noter le contexte : où et quand le fichier a été trouvé.
- Un seul octet modifié change le hash.

## Lire un rapport VirusTotal

| Partie | Signaux d'alerte | À garder en tête |
| --- | --- | --- |
| Score et étiquettes | Cinq éditeurs sérieux ou plus ; classements contradictoires (« Trojan » contre « PUA ») ; pas d'accord entre les trois principaux. | Un malware récent est peu détecté au début : revérifier après 24 h. Regarder le nom de famille ou de capacité donné. |
| Date de soumission | Soumis il y a sept jours avec plus de 10 détections ; pic soudain de détections après des jours ou des semaines. | Les éditeurs mettent 48 à 72 h pour une analyse complète. |
| Signature | Certificat absent ou invalide ; délivré à une entité sans rapport. | Un certificat valide peut être volé. Vérifier la chaîne et les dates d'expiration. |
| Propriétés | Compilé à une heure étrange (3 h du matin) ; entropie au-dessus de 7,5 pour un fichier qui n'est pas un média. | Certains packers légitimes (UPX) augmentent l'entropie. Comparer avec une version saine connue. |
| Relations | IP connues comme malveillantes ; domaines qui ressemblent à du DGA (`xk8f92.xyz`). | Un CDN légitime peut héberger un malware. Vérifier les ports ouverts dans Shodan. |
| Comportement | Modifie des clés de registre critiques ; tente une injection de processus. | Des outils d'administration modifient aussi le registre. Corréler avec les journaux du poste. |

On y trouve aussi les règles de détection qui ont réagi (YARA, heuristiques, comportement), les domaines et IP contenus, et les fichiers déposés pendant l'exécution.

## MalwareBazaar

Base de données d'échantillons de malwares, alimentée par la communauté. Recherche : `sha256:<hash>`.

- **Famille** : un fichier détecté par 5 antivirus sur 70 dans VirusTotal mais étiqueté `#IcedID` dans MalwareBazaar doit être traité comme malveillant.
- **Règles YARA** : souvent jointes aux échantillons, à reprendre dans l'EDR ou le SIEM pour chercher des échantillons proches.
- **Campagne** : une étiquette de groupe (`#TA551`) relie un incident à un attaquant connu, et aide à repérer une attaque coordonnée.
- **Échantillons** téléchargeables, pour les réanalyser en sandbox.

## Ce qu'apporte une sandbox

Pour le SOC, une sandbox sert à **confirmer l'exécution** (s'il ne se passe rien, l'alerte est peut-être un leurre), à **extraire des IOC d'exécution** (domaines, mutex, fichiers déposés) et à **relier aux techniques ATT&CK**. Au L1, surtout la recherche par hash ; le reste revient aux analystes plus expérimentés.

- **Hybrid Analysis** : arbre des comportements et carte ATT&CK claire, bien pour un résumé rapide.
- **Joe Sandbox** : plus profond (appels système, chaînes, vidages mémoire), pour l'analyse et l'ingénierie de détection.

Ses limites, qui peuvent mener à un faux négatif :

- **Évasion** : le malware détecte la VM, le débogueur ou des identifiants matériels propres aux sandboxes.
- **Durée** : la plupart arrêtent l'analyse après 2 à 5 minutes ; un malware en plusieurs étapes ou à retardement n'a pas le temps d'agir. Recouper avec d'autres sources.
- **Trafic chiffré** : sans déchiffrement TLS, un C2 en HTTPS n'est pas lisible ; un tunnel DNS peut cacher des données.
- **Sans fichier** : PowerShell et persistance WMI échappent à l'analyse classique.

Voir aussi : [analyse de malware](../01-fondamentaux/analyse-de-malware.md), [enrichir un indicateur](enrichir-un-indicateur.md).
