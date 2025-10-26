# --- Stage 1: Build ---
# Use the official Node.js LTS (Long Term Support) image
FROM node:lts-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install pnpm and then install dependencies
# This creates a 'node_modules' folder
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of your application code
COPY . .

# --- Stage 2: Production ---
# Use a smaller, more secure Node.js image for the final product
FROM node:lts-alpine

WORKDIR /app

# Copy the dependencies from the 'build' stage
COPY --from=build /app/node_modules ./node_modules

# Copy the application code from the 'build' stage
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/src ./src

# Expose the port your server runs on
EXPOSE 5001

# The command to start your server
CMD ["node", "src/server.js"]