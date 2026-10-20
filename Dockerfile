FROM oven/bun:1.4-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS test
COPY . .
RUN bun test && bun run typecheck

FROM oven/bun:1.4-slim AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

FROM oven/bun:1.4-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json tsconfig.json drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src ./src

RUN mkdir -p /data && chown -R bun:bun /data /app
VOLUME ["/data"]
USER bun

ENV DATABASE_PATH=/data/shrtl.db
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "src/index.ts"]
