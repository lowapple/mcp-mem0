# Stage 1: Build the application
FROM node:20-slim AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package manifests and config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* tsconfig.json tsup.config.ts ./

# Install all dependencies for building
RUN pnpm install --frozen-lockfile

# Copy source code
COPY src ./src

# Build the project
RUN pnpm build

# Prune dev dependencies to get only production node_modules
RUN pnpm prune --prod

# Stage 2: Create the final production image
FROM node:20-slim

# Set user to a non-root user for security
USER node
WORKDIR /home/node/app

# Copy production node_modules, built app, and package.json from builder stage
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Set environment to production
ENV NODE_ENV=production

# Command to run the server
# The MEM0_API_KEY must be provided at runtime
CMD ["node", "dist/index.js"]
