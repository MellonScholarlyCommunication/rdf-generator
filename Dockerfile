FROM node:18-alpine3.20

ENV NODE_ENV=production

WORKDIR /app

COPY .env-docker ./.env

COPY package*.json ./

RUN npm install 

COPY . .

CMD scripts/update.sh