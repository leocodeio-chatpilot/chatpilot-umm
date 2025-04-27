# Build Stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json ./

# Install npm and dependencies
RUN npm install --no-frozen-lockfile

# Copy source files
COPY . .

# Generate Prisma client and build the application
RUN npx prisma generate
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

# Install OpenSSL in the runner stage too
RUN apk add --no-cache openssl

WORKDIR /app

# Copy ALL necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Generate Prisma Client for the target platform
ENV NODE_ENV=production
RUN npx prisma generate

# Make sure node user has access to all files
RUN chown -R node:node /app

# Use non-root user for security
USER node

EXPOSE 3001

# Use the start script from package.json
CMD ["npm", "run", "start"]