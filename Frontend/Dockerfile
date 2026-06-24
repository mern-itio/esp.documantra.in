# Build stage — runs in Docker with more memory than local Windows build
FROM node:20-bookworm AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG VITE_API_BASE_URL=https://esp.documantra.in/auth
ARG VITE_DOCUMENT_SERVICE_URL=https://esp.documantra.in/document
ARG VITE_ESIGN_SERVICE_URL=https://esp.documantra.in/esign
ARG VITE_PDF_SERVICE_URL=https://esp.documantra.in/pdf
ARG VITE_API_SERVICE_URL=https://esp.documantra.in/service
ARG VITE_TEMPLATE_SERVICE_URL=https://esp.documantra.in/template
ARG VITE_SUBSCRIPTION_SERVICE_URL=https://esp.documantra.in/subscription
ARG VITE_ORGANIZATION_SERVICE_URL=https://esp.documantra.in/organization
ARG VITE_ADMIN_SERVICE_URL=https://esp.documantra.in/admin
ARG VITE_SUPPORT_SERVICE_URL=https://esp.documantra.in/support
ARG VITE_AI_ASSISTANT_SERVICE_URL=https://esp.documantra.in/ai
ARG VITE_PUBLIC_APP_URL=https://esp.documantra.in

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_DOCUMENT_SERVICE_URL=$VITE_DOCUMENT_SERVICE_URL \
    VITE_ESIGN_SERVICE_URL=$VITE_ESIGN_SERVICE_URL \
    VITE_PDF_SERVICE_URL=$VITE_PDF_SERVICE_URL \
    VITE_API_SERVICE_URL=$VITE_API_SERVICE_URL \
    VITE_TEMPLATE_SERVICE_URL=$VITE_TEMPLATE_SERVICE_URL \
    VITE_SUBSCRIPTION_SERVICE_URL=$VITE_SUBSCRIPTION_SERVICE_URL \
    VITE_ORGANIZATION_SERVICE_URL=$VITE_ORGANIZATION_SERVICE_URL \
    VITE_ADMIN_SERVICE_URL=$VITE_ADMIN_SERVICE_URL \
    VITE_SUPPORT_SERVICE_URL=$VITE_SUPPORT_SERVICE_URL \
    VITE_AI_ASSISTANT_SERVICE_URL=$VITE_AI_ASSISTANT_SERVICE_URL \
    VITE_PUBLIC_APP_URL=$VITE_PUBLIC_APP_URL \
    NODE_OPTIONS=--max-old-space-size=4096

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
