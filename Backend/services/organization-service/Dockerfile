FROM node:20

WORKDIR /app

# Copy package.json and package-lock.json for local packages first
# COPY packages/auth-lib/package*.json ./packages/auth-lib/
COPY packages/auth-lib/package*.json ./packages/auth-lib/
COPY packages/validators/package*.json ./packages/validators/

# Copy package.json and package-lock.json for service
COPY services/organization-service/package*.json ./services/organization-service/

# Install dependencies inside local packages
# WORKDIR /app/packages/auth-lib
# RUN npm install

# Copy all code after package.json (to leverage docker cache)
# COPY packages/auth-lib ./packages/auth-lib
COPY packages/auth-lib ./packages/auth-lib
COPY packages/validators ./packages/validators
COPY services/organization-service ./services/organization-service

# Install dependencies inside local packages
WORKDIR /app/packages/auth-lib
RUN npm install

WORKDIR /app/packages/validators
RUN npm install
 
# Install service dependencies (links local packages)
WORKDIR /app/services/organization-service
RUN npm install --legacy-peer-deps

EXPOSE 2111

CMD ["npm", "run", "dev"]
