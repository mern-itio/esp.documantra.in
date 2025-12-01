FROM node:20

WORKDIR /app

# Copy package files for local packages first
COPY packages/auth-lib/package*.json ./packages/auth-lib/
COPY packages/validators/package*.json ./packages/validators/

# Copy package files for service
COPY services/support-service/package*.json ./services/support-service/

# Copy all code after package.json (to leverage docker cache)
COPY packages/auth-lib ./packages/auth-lib
COPY packages/validators ./packages/validators
COPY services/support-service ./services/support-service

# Install dependencies inside local packages
WORKDIR /app/packages/auth-lib
RUN npm install

WORKDIR /app/packages/validators
RUN npm install

# Install service dependencies (links local packages)
WORKDIR /app/services/support-service
RUN npm install --legacy-peer-deps

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 2107

CMD ["npm", "run", "dev"]

