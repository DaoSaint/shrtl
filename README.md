# shrtl

A small self-hosted URL shortener. One account, created once through `/setup`,
which stops existing afterwards. Links are either **public** — anyone with the
short URL is redirected — or **protected**, redirecting only for a logged-in
session.

## Requirements

- **Bun ≥ 1.4**, or Docker (the intended way to run it).
- No build step: Bun executes the TypeScript sources directly.
- No secret to configure: session tokens are random and stored hashed, so there
  is nothing to sign.

## Run

```bash
cp .env.example .env
bun install
mkdir -p data        # DATABASE_PATH points in here
bun run db:migrate
bun run dev          # watch mode; `bun run start` for a plain run
```

## Commands

| command                           | what it does                                                    |
| --------------------------------- | --------------------------------------------------------------- |
| `bun run start`                   | run the server                                                  |
| `bun run dev`                     | run with `--watch`, restarts on content change                  |
| `bun test`                        | unit tests (`node:test`, no extra dependency)                   |
| `bun run test:watch`              | tests in watch mode                                             |
| `bun run docker:test`             | builds the `test` stage: tests + typecheck **inside** the image |
| `bun run docker:smoke`            | builds the runtime image, starts it, asserts `/healthz`         |
| `bun run typecheck`               | `tsc --noEmit`                                                  |
| `bun run format` / `format:check` | Prettier, 4 spaces                                              |
| `bun run db:generate`             | generate a SQL migration from `src/db/schema.ts`                |
| `bun run db:migrate`              | apply pending migrations                                        |

## Configuration

| variable            | meaning                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_PATH`     | SQLite file; its directory must exist and be writable                                                                                  |
| `PUBLIC_BASE_URL`   | base used to display short links, no trailing slash                                                                                    |
| `PORT`              | listen port, default `3000`                                                                                                            |
| `HOST`              | bind address, default `0.0.0.0`                                                                                                        |
| `TRUST_PROXY`       | `1` only behind a proxy you control: takes the client IP from `X-Forwarded-For`, which is otherwise spoofable and bypasses rate limits |
| `SESSION_TTL_HOURS` | session lifetime, default `720`                                                                                                        |

## Layout

```
src/app.ts      Hono app: middleware and routes
src/index.ts    entrypoint: Bun.serve on HOST:PORT
src/db/         Drizzle schema, connection, migration runner
drizzle/        generated SQL migrations (committed)
test/           node:test suites, run by `bun test`
scripts/        docker test and smoke helpers
```

Routes stay thin — read, validate, call, respond. Anything with rules worth
testing on its own (URL validation, slug generation, password hashing, rate
limiting) belongs in plain functions without a request object.

## Testing

`bun test` runs `node:test` files. Suites exercise the app with Hono's
`app.request()`, so no port is opened and tests cannot collide with a running
server.

The container chain is separate: `docker:test` runs the tests and typecheck
during the image build, in a `test` stage on the same base as the runtime, and
`docker:smoke` builds the runtime image, starts it and asserts `/healthz`.

## Self-hosting

```bash
docker compose up -d --build
```

The container listens on `:3000` and keeps its state in `/data`; mount a volume
there or the database is lost on recreate. Set `PUBLIC_BASE_URL` to the origin
users will see:

```yaml
environment:
    PUBLIC_BASE_URL: https://sho.rt
```

Terminate TLS in front of it and forward `X-Forwarded-For`, then set
`TRUST_PROXY=1` so rate limiting sees real client addresses. `.dev` is on the
HSTS preload list: that TLD is only reachable over HTTPS with a valid
certificate, so there is no plain-HTTP fallback to develop against.

No image is published yet — building from the checkout is the supported path.

## Contributing

`main` takes no direct pushes: open a pull request and it is squashed on merge.
`ci` runs on every pull request — format check, typecheck, tests, container
build. Run `bun run format` and `bun test` before pushing.

Releases are annotated tags.

## Status

Skeleton. The only route is `GET /healthz`; the database, account setup, login
and link handling are not implemented.

## Licence

MIT
