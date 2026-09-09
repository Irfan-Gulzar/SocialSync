# SocialSync Pro

A unified social inbox built as a final year project. SocialSync brings Facebook Messenger and Instagram conversations into one dashboard, allowing an operator to read messages, send text replies, and view activity statistics.

The frontend also uses **OmniQuery** as its header label. Both names refer to this application.

## Project scope

| Capability | Status |
| --- | --- |
| Facebook Messenger inbound messages and text replies | Implemented; requires configured Meta credentials and subscriptions |
| Instagram inbound messages and text replies | Implemented using Instagram Login; requires configured credentials and subscriptions |
| Unified conversation list and platform inboxes | Implemented |
| Live inbound updates and session-local unread badges | Implemented with Socket.IO |
| Message totals, response rate, platform distribution, weekly charts | Computed from PostgreSQL |
| Incoming attachment metadata and text placeholders | Implemented; media is not downloaded or rendered |
| WhatsApp and TikTok | Future integrations; tabs and fictional demo data only |
| Social Bot | Placeholder panel; no AI integration |

This is an academic prototype. Authentication, access control, and account onboarding are not implemented. Keep the dashboard and API on a trusted local network during demonstrations. See [limitations and future work](docs/architecture.md#limitations-and-future-work) for the remaining work.

## Technology

- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Socket.IO client.
- **Backend:** Node.js, Express 4, Socket.IO, Axios.
- **Database:** PostgreSQL with parameterized queries through `pg`.
- **Tests:** Node.js built-in test runner, injected provider/database doubles, and local HTTP route tests.

## Run locally

Prerequisites: Node.js 22 and npm, a running PostgreSQL server, and `psql`/`createdb` on your PATH. Validation for this cleanup used Node.js 22.14.0 and npm 10.9.2. A local dashboard demonstration does not require Meta credentials.

Run these commands from the project root:

```powershell
npm ci --prefix backend
npm ci --prefix frontend
Copy-Item backend/.env.example backend/.env
```

Copy the template only for a new checkout; preserve an existing `.env`. Set the `DB_*` values in `backend/.env` to match your local PostgreSQL installation.

For a **new database**:

```powershell
createdb -U postgres socialsync
psql -U postgres -d socialsync -v ON_ERROR_STOP=1 -f database/schema.sql
```

Optionally populate a **disposable demonstration database**:

```powershell
psql -U postgres -d socialsync -v ON_ERROR_STOP=1 -f database/seed.sql
```

The seed script **clears existing customers, conversations, and messages**. It includes fictional data for all four dashboard platforms. These external IDs cannot receive real replies; use incoming messages from your configured Meta accounts to demonstrate sending.

Start each service in a separate terminal, from the project root:

```powershell
npm run dev --prefix backend
```

```powershell
npm run dev --prefix frontend
```

Open **http://localhost:3000**. The backend listens on **http://localhost:5000**. Vite proxies `/api` and `/socket.io` to port 5000. If you change `PORT`, also update the targets in `frontend/vite.config.js`.

For an existing database, do not rerun the fresh schema. Follow the [migration instructions](docs/architecture.md#database-setup-and-migrations).

## Connect real accounts

Follow [Meta webhook setup](docs/meta-webhooks.md). Configure each provider's account ID, access token, signing secret, and the shared verification token in `backend/.env`. The application reads credentials from the environment; it does not offer a login or token-management screen.

## Validation and build

```powershell
npm test --prefix backend
npm run build --prefix frontend
```

The frontend build produces `frontend/dist`, which is ignored by Git. Express does not serve this directory. A deployed build needs a static host with `/api` and `/socket.io` routed to the backend; the Vite development proxy is not a production deployment configuration.

Neither package currently defines `lint` or `typecheck`. Those commands were attempted during cleanup and reported missing scripts. The production build is not a typecheck. See [testing and demonstration](docs/testing.md) for verified results, coverage boundaries, and a presentation walkthrough.

## Documentation

- [Architecture, database model, and limitations](docs/architecture.md)
- [REST API and Socket.IO reference](docs/api.md)
- [Meta webhook configuration](docs/meta-webhooks.md)
- [Tests and professor demonstration guide](docs/testing.md)

## Publishing to GitHub

Commit source files, documentation, SQL, both `package-lock.json` files, and the blank `.env.example`. The root `.gitignore` excludes secrets, dependencies, generated builds, logs, and local database exports.

This checkout did not contain a `.git` directory during cleanup. When you create the repository, inspect the staged files before committing:

```powershell
git init
git add .
git status --short
git diff --cached --stat
git check-ignore backend/.env backend/node_modules frontend/node_modules frontend/dist
```

Confirm that `backend/.env` is ignored and that no credentials, real message exports, or database backups are staged. Then create your commit and connect your own GitHub repository. No repository, commit, or push is created by this cleanup.
