# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the app (Vite frontend + esbuild backend)
RUN pnpm build

# ── Production stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "dist/index.js"]
