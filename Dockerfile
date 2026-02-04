FROM node:22-alpine AS build

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-maxtimeout 600000 \
  && npm ci --include=dev

COPY . .
RUN npm run build:prod \
  && npm run build:tools \
  && mkdir -p dist/tools \
  && cp -r tools/dbScripts dist/tools/dbScripts

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/config ./config

EXPOSE 8084 8087

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8084/health || exit 1

CMD ["node", "dist/index.js"]
