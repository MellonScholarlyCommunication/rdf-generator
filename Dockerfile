FROM node:18-alpine3.20

ENV NODE_ENV=production

WORKDIR /app

COPY .env-docker ./.env

COPY package*.json ./

RUN npm install 

COPY . .

RUN npm install -g pm2

COPY .env-docker ./.env

COPY ecosystem.config.js-sample ./ecosystem.config.js

EXPOSE 3006

CMD [ "pm2-runtime" , "start", "ecosystem.config.js" ]