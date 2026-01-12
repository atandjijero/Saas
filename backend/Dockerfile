FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN npm rebuild bcrypt

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/src/main"]