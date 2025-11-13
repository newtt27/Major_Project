FROM node:20-bullseye

WORKDIR /app

# Cài bash (nếu cần)
RUN apt-get update && apt-get install -y bash

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'development' ]; then npm run dev; else npm run build && node .next/standalone/server.js; fi"]
