# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/

# Install ALL dependencies (devDeps needed for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the app (Vite frontend → dist/public + esbuild backend → dist/index.js)
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

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "dist/index.js"]
