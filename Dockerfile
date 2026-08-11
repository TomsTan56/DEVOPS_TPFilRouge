# Utiliser une image de base officielle Node.js
FROM node:24.13.1-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier seulement les fichiers de dépendances d'abord pour optimiser le cache Docker
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le code de l'application
COPY . ./

# Exposer le port utilisé par l'application
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start"]