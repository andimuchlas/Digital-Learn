FROM oven/bun:1-slim

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy application files
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Start standalone socket server
CMD ["bun", "socket-server.ts"]
