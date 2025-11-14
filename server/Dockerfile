# Stage 1: Dependencies
FROM oven/bun:latest AS dependencies

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install production dependencies only
RUN bun install --production --frozen-lockfile

# Stage 2: Build (if needed for future builds)
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install all dependencies (including dev)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build if needed (currently not necessary for Bun, but ready for future)
# RUN bun run build

# Stage 3: Production
FROM oven/bun:slim AS production

WORKDIR /app

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy package.json for scripts
COPY package.json ./

# Copy source code
COPY src ./src

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Set production environment
ENV NODE_ENV=production

# Start server
CMD ["bun", "run", "start"]

