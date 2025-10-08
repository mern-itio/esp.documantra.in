FROM node:20

WORKDIR /app


COPY packages/auth-lib/package*.json ./packages/auth-lib/
COPY packages/validators/package*.json ./packages/validators/


COPY services/subscription-service/package*.json ./services/subscription-service/

COPY packages/auth-lib ./packages/auth-lib
COPY packages/validators ./packages/validators
COPY services/subscription-service ./services/subscription-service

WORKDIR /app/packages/auth-lib
RUN npm install

WORKDIR /app/packages/validators
RUN npm install
 

WORKDIR /app/services/subscription-service
RUN npm install --legacy-peer-deps

EXPOSE 2110

CMD ["npm", "run", "dev"]
