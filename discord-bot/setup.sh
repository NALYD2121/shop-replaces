#!/bin/bash

# Mise à jour du système
echo "Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# Installation de Node.js et npm
echo "Installation de Node.js et npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de PM2
echo "Installation de PM2..."
sudo npm install -g pm2

# Installation des dépendances du projet
echo "Installation des dépendances..."
npm install

# Création du dossier logs
mkdir -p logs

# Configuration de PM2 pour démarrer avec le système
echo "Configuration du démarrage automatique..."
pm2 startup
pm2 start ecosystem.config.js
pm2 save

# Configuration du pare-feu
echo "Configuration du pare-feu..."
sudo apt install -y ufw
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw enable

echo "Installation terminée !"
echo "Le bot est maintenant configuré pour démarrer automatiquement." 