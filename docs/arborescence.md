# Arborescence du contenu

Organisation prévue de `src/content/docs/`. Les sections et les tactiques sont fixées ;
la liste des pages de chaque section reste **à compléter** au fil des entraînements.

## Sections

| Dossier | Section | Contenu | Type de page |
| --- | --- | --- | --- |
| `00-methodologie/` | Méthodologie SOC | À compléter | page générique |
| `01-fondamentaux/` | Fondamentaux | À compléter | page générique |
| `02-outils/` | Outils | À compléter | cheat sheet |
| `03-menaces-detection/` | Menaces & détection | Un sous-dossier par tactique ATT&CK | technique |
| `04-playbooks/` | Playbooks | À compléter | page générique |
| `05-threat-intel/` | Threat Intelligence | À compléter | page générique |
| `06-write-ups/` | Write-ups | Un sous-dossier par plateforme | write-up |
| `07-lab/` | Lab | À compléter | page générique |
| `08-ressources/` | Ressources | À compléter | page générique |

## `03-menaces-detection/` — tactiques MITRE ATT&CK (Enterprise)

| Sous-dossier | Tactique | ID |
| --- | --- | --- |
| `reconnaissance/` | Reconnaissance | TA0043 |
| `resource-development/` | Resource Development | TA0042 |
| `initial-access/` | Initial Access | TA0001 |
| `execution/` | Execution | TA0002 |
| `persistence/` | Persistence | TA0003 |
| `privilege-escalation/` | Privilege Escalation | TA0004 |
| `defense-evasion/` | Defense Evasion | TA0005 |
| `credential-access/` | Credential Access | TA0006 |
| `discovery/` | Discovery | TA0007 |
| `lateral-movement/` | Lateral Movement | TA0008 |
| `collection/` | Collection | TA0009 |
| `command-and-control/` | Command and Control | TA0011 |
| `exfiltration/` | Exfiltration | TA0010 |
| `impact/` | Impact | TA0040 |

Le nom du sous-dossier est la valeur attendue du champ `tactic` du frontmatter.

## Conventions

- Un fichier par page, nommé en minuscules avec des tirets (`kerberoasting.md`).
- `index.md` à la racine de chaque section pour sa page d'accueil.
- Les numéros de section (`00` à `08`) n'apparaissent que dans les noms de dossier.
