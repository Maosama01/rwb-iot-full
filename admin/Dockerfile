# Stage 1: Build the admin React app
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (cached unless package files change)
COPY package*.json ./
RUN npm install

# Copy the rest of the source and build the static bundle
COPY . .
RUN npm run build

# Stage 2: Serve the built static files with Nginx
FROM nginx:alpine

# Static build output from stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA-aware Nginx config (so client-side routes don't 404 on refresh)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
