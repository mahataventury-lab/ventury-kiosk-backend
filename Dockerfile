FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN mkdir -p /app/data /app/configs

ENV NODE_ENV=production \
    PORT=3000 \
    BASE_URL=http://localhost:3000 \
    DB_PATH=/app/data/kiosk.db

EXPOSE 3000

CMD ["sh", "-c", "mkdir -p /app/data /app/configs && npm run init-db && npm start"]
