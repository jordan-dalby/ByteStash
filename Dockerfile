# Build stage for client
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package.json ./
RUN npm install --package-lock-only
RUN npm ci
COPY client/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy server source and dependencies
WORKDIR /app
COPY server/package.json ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ gcc && \
      npm install --omit=dev && \
      apk del .build-deps

COPY server/src ./src

# Copy client build
COPY --from=client-build /app/client/build /client/build

# Create output directory
RUN mkdir -p ./data/snippets

EXPOSE 5000

CMD ["node", "src/app.js"]