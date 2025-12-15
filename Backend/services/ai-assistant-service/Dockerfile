FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY services/ai-assistant-service/package*.json ./

# Install dependencies
RUN npm install

# Copy service code
COPY services/ai-assistant-service/ .

# Expose port
EXPOSE 2108

# Start service
CMD ["npm", "start"]

