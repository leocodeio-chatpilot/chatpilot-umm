# 🔹 Stage 1: Builder
FROM node:23-alpine AS builder

# Install dependencies including specific openssl version
RUN apk add --no-cache openssl openssl-dev

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy application source code
COPY . .

# Ensure proper permissions for Prisma
RUN mkdir -p node_modules/@prisma/engines
RUN chmod -R 777 node_modules/@prisma

# Generate Prisma client & build application
RUN npx prisma generate
RUN npm run build

# Remove development dependencies to reduce image size
RUN npm prune --production

# 🔹 Stage 2: Runner
FROM node:23-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy necessary built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Ensure proper permissions in the runner stage
RUN mkdir -p /app/node_modules/@prisma/engines
RUN chmod -R 777 /app/node_modules/@prisma
RUN chown -R node:node /app

# Use non-root user for security
USER node

# Expose the required port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start"]
