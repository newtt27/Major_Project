FROM node:20-alpine

WORKDIR /app

# Cài bash
RUN apk add --no-cache bash

# Copy package.json để cache dependencies
COPY package*.json tsconfig.json ./
RUN npm install

# Copy source code
COPY ./src ./src

EXPOSE 5000

# CMD chỉ chạy Node backend
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'development' ]; then npx ts-node-dev --respawn --transpile-only src/app.ts; else npx tsc && node dist/app.js; fi"]
