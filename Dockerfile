# Build Nuxt (Nitro node-server → dist/)
FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Copy build output to target container
FROM node:24-bookworm-slim AS target

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --chown=node:node --from=build /app/dist ./dist
USER node

EXPOSE 3000

CMD ["node", "dist/server/index.mjs"]
