FROM node:20-alpine AS dev

WORKDIR /usr/src/app

# Copie o package.json + package-lock.json primeiro (camada de cache)
COPY package*.json ./

# Instale dependências (dentro do container)
RUN npm ci

# Agora copie o resto do código fonte
COPY . .

EXPOSE 3000

# script padrão para iniciar (entrypoint)
CMD ["npm", "run", "start:dev"]