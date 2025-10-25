# --- Stage 1: Build the React App ---
FROM node:lts-alpine AS build

WORKDIR /app

# Copy package files and install pnpm
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy the rest of the source code and build
COPY . .
RUN pnpm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Copy the built static files from the 'build' stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (nginx's default port)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]