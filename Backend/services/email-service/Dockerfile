FROM node:20

WORKDIR /app

COPY packages/auth-lib/package*.json ./packages/auth-lib/
COPY packages/email-lib/package*.json ./packages/email-lib/
COPY packages/validators/package*.json ./packages/validators/

COPY services/email-service/package*.json ./services/email-service/

COPY packages/auth-lib ./packages/auth-lib
COPY packages/email-lib ./packages/email-lib
COPY packages/validators ./packages/validators
COPY services/email-service ./services/email-service

WORKDIR /app/packages/auth-lib
RUN npm install

WORKDIR /app/packages/email-lib
RUN npm install

WORKDIR /app/packages/validators
RUN npm install

WORKDIR /app/services/email-service
RUN npm install --legacy-peer-deps

EXPOSE 2112

CMD ["npm", "run", "dev"]
