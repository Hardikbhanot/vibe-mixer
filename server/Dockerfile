FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY . .

EXPOSE 4000
CMD ["npm", "start"]
