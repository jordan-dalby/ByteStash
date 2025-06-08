# Build stage for client
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY client/ ./
RUN pnpm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app

# Copy server source and dependencies
WORKDIR /app
COPY server/package.json pnpm-lock.yaml ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ gcc && \
    pnpm install --frozen-lockfile --prod && \
    apk del .build-deps

COPY server/src ./src
COPY server/docs ./docs

# Copy client build
COPY --from=client-build /app/client/build /client/build

# Create output directory
RUN mkdir -p ./data/snippets

EXPOSE 5000

CMD ["node", "src/app.js"]
