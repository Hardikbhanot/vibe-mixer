FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Prisma schema must exist before npm ci because
# npm ci triggers the postinstall script.
COPY prisma ./prisma

RUN npm ci

COPY . .

EXPOSE 4000
CMD ["npm", "start"]