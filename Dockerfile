FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Cloud Run은 PORT 환경변수를 자동 주입함 (기본 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
