FROM node:20

# No system dependencies needed for pdf-image

WORKDIR /app

# Copy package.json and package-lock.json for local packages first
COPY packages/auth-lib/package*.json ./packages/auth-lib/
COPY packages/validators/package*.json ./packages/validators/

# Copy package.json and package-lock.json for service
COPY services/pdf-service/package*.json ./services/pdf-service/

# Copy all code after package.json (to leverage docker cache)
COPY packages/auth-lib ./packages/auth-lib
COPY packages/validators ./packages/validators
COPY services/pdf-service ./services/pdf-service

# Install dependencies inside local packages
WORKDIR /app/packages/auth-lib
RUN npm install

WORKDIR /app/packages/validators
RUN npm install

# Install service dependencies (links local packages)
WORKDIR /app/services/pdf-service
RUN npm install --legacy-peer-deps && npm install -g nodemon

EXPOSE 2104

CMD ["npm", "run", "dev"]
