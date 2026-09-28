# Build stage for client
# Pin to the native build platform: the client build emits arch-independent
# static assets, so building under QEMU emulation for arm/v7 is wasteful and
# OOMs Node's ~1GB 32-bit heap cap. Build once natively for every target arch.
FROM --platform=$BUILDPLATFORM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json ./
RUN npm install --package-lock-only
RUN npm ci
COPY client/ ./
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app

# Copy server source and dependencies
WORKDIR /app
COPY server/package.json ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ gcc && \
      npm install --omit=dev && \
      apk del .build-deps && \
      rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY server/src ./src
COPY server/docs ./docs

# Copy client build
COPY --from=client-build /app/client/build /client/build

# Create output directory
RUN mkdir -p ./data/snippets

EXPOSE 5000

# nosemgrep: dockerfile.security.missing-user.missing-user
CMD ["node", "src/app.js"]
