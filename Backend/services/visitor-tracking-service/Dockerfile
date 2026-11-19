FROM node:20

WORKDIR /app

COPY services/visitor-tracking-service/package*.json ./services/visitor-tracking-service/
WORKDIR /app/services/visitor-tracking-service
RUN npm install --legacy-peer-deps

COPY services/visitor-tracking-service ./

EXPOSE 2116

CMD ["npm", "run", "dev"]
