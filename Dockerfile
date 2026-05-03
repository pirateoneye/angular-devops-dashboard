# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build:prod

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist/devops-dashboard /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Security: run as non-root
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx
USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
