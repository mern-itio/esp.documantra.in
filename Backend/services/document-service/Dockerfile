FROM node:20

WORKDIR /app

# Copy package.json and package-lock.json for local packages first
COPY packages/auth-lib/package*.json ./packages/auth-lib/
COPY packages/validators/package*.json ./packages/validators/

# Copy package.json and package-lock.json for service
COPY services/document-service/package*.json ./services/document-service/

# Copy all code after package.json (to leverage docker cache)
COPY packages/auth-lib ./packages/auth-lib
COPY packages/validators ./packages/validators
COPY services/document-service ./services/document-service

# Install dependencies inside local packages
WORKDIR /app/packages/auth-lib
RUN npm install

WORKDIR /app/packages/validators
RUN npm install

# Install service dependencies (links local packages)
WORKDIR /app/services/document-service
RUN npm install --legacy-peer-deps

EXPOSE 4000

CMD ["npm", "run", "dev"]
