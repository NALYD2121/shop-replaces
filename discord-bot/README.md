# Bot Discord SHOP-REPLACE

Ce bot gère la publication automatique des mods sur les canaux Discord appropriés.

## Installation

1. Installez Node.js (version 16 ou supérieure)
2. Dans le dossier `discord-bot`, exécutez :
```bash
npm install
```

## Configuration

Le fichier `.env` contient le token Discord du bot.
Le fichier `config.js` contient les IDs des canaux Discord pour chaque type de mod.

## Démarrage

Pour démarrer le bot :
```bash
npm start
```

## Fonctionnalités

- API REST pour la publication de mods
- Publication automatique dans les canaux Discord appropriés
- Support des images multiples
- Messages embed personnalisés
- Gestion des erreurs

## Endpoints API

### POST /api/publish
Publie un nouveau mod sur Discord.

Paramètres requis :
- name : Nom du mod
- category : Catégorie (ARME, VEHICULE, PERSONNAGE)
- type : Type spécifique du mod
- description : Description du mod
- mediaFireLink : Lien de téléchargement MediaFire
- images : URLs des images (max 5)
- discordChannelId : ID du canal Discord 