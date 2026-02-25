# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install build tools and dependencies so native modules compile on Linux
RUN apk add --no-cache build-base python3 git
RUN npm install --omit=dev

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install runtime deps (no build tools needed)
COPY package.json package-lock.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Expose port (backend expects 3001 by default)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start server
CMD ["npm", "start"]
