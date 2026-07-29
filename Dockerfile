FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/

# Install ALL dependencies (vite needed for frontend build, tsx for runtime)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build only the frontend (Vite)
RUN NODE_ENV=production pnpm exec vite build

# Verify the build output exists
RUN ls -la dist/public/ || echo "WARNING: dist/public not found!"

# Expose port
EXPOSE 3000

# Run server with tsx (no esbuild compilation needed)
ENV NODE_ENV=production
CMD ["pnpm", "exec", "tsx", "server/_core/index.ts"]
