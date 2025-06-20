FROM node:18-alpine3.20

RUN apk add --no-cache openjdk17-jre-headless

ENV JAVA_HOME="/usr/lib/jvm/java-17-openjdk"

ENV PATH="$PATH:$JAVA_HOME/bin"

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

CMD npx event_admin init --drop ; pm2-runtime start ecosystem.config.js