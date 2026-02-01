# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runtime
WORKDIR /app

# Copy built files
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=4321
ENV DATABASE_PATH=/app/data/adr.db
ENV NODE_ENV=production
ENV PUBLIC_URL=http://localhost:4321

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
