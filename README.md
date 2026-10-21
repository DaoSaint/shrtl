# shrtl

A self-hosted URL shortener with exactly one account.

Links are **public** under `/p/<slug>` — anyone with the URL is redirected — or
**private** under `/r/<slug>`, which only redirects a visitor holding a valid
session and answers `404` to everyone else.

The account is created once through `/setup`, which then stops existing. There
is no registration, no user list, no password reset: one owner, one password.

## Stack

- **Bun** runs the TypeScript sources directly; no server build step.
- **Hono** for routing, with `hono/jsx` for server rendering.
- **Drizzle + SQLite** (`bun:sqlite`), migrations committed under `drizzle/`.
- **argon2id** (`@node-rs/argon2`) for the password.
- **UnoCSS** for styles.
- The dashboard is a `hono/jsx/dom` component: rendered on the server, then
  hydrated from a bundle built by `Bun.build`.

## Requirements

Bun ≥ 1.4, or Docker.

## Run

```bash
bun install
bun run dev
```

`dev` applies pending migrations on boot, watches the sources and rebuilds the
CSS and the browser bundle. The server listens on `http://localhost:3000`.

`/setup` creates the account; afterwards the page returns `404`.

## Configuration

| variable        | meaning                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_PATH` | SQLite file, default `./data/shrtl.db`; its directory is created when missing                                                                                |
| `PORT`          | listen port, default `3000`                                                                                                                                  |
| `HOST`          | bind address, default `0.0.0.0`                                                                                                                              |
| `TRUST_PROXY`   | set to `1` only behind a proxy you control: the client address then comes from `X-Forwarded-For`, otherwise the socket address is used and cannot be spoofed |

## Commands

| command                           | what it does                                         |
| --------------------------------- | ---------------------------------------------------- |
| `bun run dev`                     | watch mode: server, CSS and browser bundle           |
| `bun run start`                   | plain run, assets expected to exist in `public/`     |
| `bun test`                        | test suites (`node:test`, no extra dependency)       |
| `bun run typecheck`               | `tsc` for the server and the client tree separately  |
| `bun run format` / `format:check` | Prettier, 4 spaces                                   |
| `bun run css` / `client`          | one-shot build of `public/uno.css` / `dashboard.js`  |
| `bun run db:generate`             | generate a migration from `src/lib/db/schema.ts`     |
| `bun run db:migrate`              | apply pending migrations                             |
| `bun run docker:test`             | run tests and typecheck inside the image             |
| `bun run docker:smoke`            | build the runtime image, start it, assert `/healthz` |

## Routes

| route                                  | behaviour                                         |
| -------------------------------------- | ------------------------------------------------- |
| `GET /`                                | dashboard, or `302` to `/login` without a session |
| `GET /login` · `POST /login`           | password form; sets a session cookie              |
| `GET /setup` · `POST /setup`           | one-shot account creation, `404` afterwards       |
| `POST /links`                          | create a redirection                              |
| `POST /links/update` · `/links/delete` | edit or remove one, from the dashboard            |
| `GET /links/page`                      | JSON page of links for search, filter and scroll  |
| `GET /p/:slug`                         | public redirect                                   |
| `GET /r/:slug`                         | redirect for a session, `404` otherwise           |
| `POST /logout`                         | drop the session                                  |
| `GET /healthz`                         | `{ "status": "ok" }`                              |

## Layout

```
src/app.tsx        middleware and route table
src/index.ts       entrypoint: migrations, then Bun.serve
src/routes/        one module per route group
src/views/         pages and components, server and client
src/client/        the hydrated dashboard entry and its tsconfig
src/lib/           account, sessions, links, rate limiting, database
drizzle/           generated SQL migrations (committed)
test/              node:test suites
scripts/           asset builders and Docker helpers
```

Anything with rules worth testing on its own — URL validation, slug generation,
password hashing, rate limiting — lives in `src/lib` as plain functions without
a request object.

## Security

- Password hashed with argon2id; the stored session id is the SHA-256 of the
  cookie token, so the database never holds a usable session value.
- Login is limited to 5 failures per address per 15 minutes.
- Cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` when the request arrived
  over HTTPS.
- CSP, `nosniff`, `no-referrer`, `frame-ancestors 'none'` and a 32 KB body limit
  are applied to every response.
- Targets accept `http` and `https` only; query strings and fragments are kept
  as given.
- The dashboard is `no-store`; private links answer `404` rather than `403`, so
  their existence is not disclosed.

## Tests

`bun test` runs the suites through Hono's `app.request()`, so no port is opened
and tests never touch a running server. Each suite builds its own database in
memory and applies the real migrations.

The container chain is separate: `docker:test` runs tests and typecheck during
the image build, and `docker:smoke` starts the runtime image and waits for
`/healthz`.

## Contributing

`main` takes no direct pushes. Open a pull request; it is squashed on merge. CI
runs format check, typecheck, tests and a container build on every pull request.

## Licence

MIT
