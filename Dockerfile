FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files first (for layer caching)
COPY package.json pnpm-lock.yaml* ./

# Install ALL dependencies
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build the frontend with Vite
RUN pnpm exec vite build

# Verify the build output
RUN echo "=== dist/public ===" && ls -la dist/public/

# Set environment
ENV NODE_ENV=production

# Railway assigns PORT automatically
EXPOSE 3000

# Start the server
CMD ["pnpm", "exec", "tsx", "server/_core/index.ts"]
