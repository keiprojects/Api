# Coolify Alignment Changes (Summary)

## What was done
- Added Docker build support with a root `Dockerfile` and `.dockerignore`.
- Added Coolify cron entry points and npm scripts for scheduled tasks.
- Updated runtime port handling to support `PORT` fallback for `SERVER_PORT`.
- Enabled `MAIL_SYSTEM` overrides so SMTP providers like Resend work in production.
- Added `.env` with Coolify-ready production variables and module DB connection strings.
- Added a Coolify readiness check script and npm task (`check:coolify`).
- Adjusted timer handler types to avoid build failure when `ScheduledEvent` is unavailable.
- Added a Dockerfile healthcheck that calls `/health` on port 8084.
- Allowed overriding module API URLs via environment variables (e.g., `API_URL`, `MESSAGING_API`).
- Reworked `COOLIFY_DEPLOYMENT_GUIDE.md` to align with a single MySQL instance, correct env vars, WebSocket setup, and cron jobs.

## Why these changes were made
- **Docker build**: Coolify deploys best with a deterministic container build.
- **Cron jobs**: AWS EventBridge timers were replaced by Coolify cron jobs to keep schedules functional outside AWS.
- **Port fallback**: Coolify commonly sets `PORT`, so we now honor it if `SERVER_PORT` isn't set.
- **SMTP override**: `MAIL_SYSTEM=SMTP` now correctly switches the email provider away from SES (needed for Resend SMTP).
- **Runtime config**: A production `.env` was created to align local/coolify settings with required env vars.
- **Readiness check**: Validates critical env vars and prevents accidental default config usage before deploy.
- **Healthcheck**: Coolify/Docker can now detect app health via the `/health` endpoint.
- **Production guard**: The API now fails fast if required env vars are missing or default ChurchApps URLs are detected in prod.
- **API URL overrides**: Non-ChurchApps deployments can now set base/module URLs without editing `config/prod.json`.
- **Single MySQL instance**: Matches your target architecture and reduces memory usage.
- **Environment variable alignment**: The app reads `*_CONNECTION_STRING` and related keys; docs now match reality.
- **WebSockets**: Messaging requires local WS in Coolify, so guide now covers `DELIVERY_PROVIDER`, `SOCKET_PORT`, and `SOCKET_URL`.

## Files affected
- `Dockerfile`
- `.dockerignore`
- `package.json`
- `src/shared/helpers/Environment.ts`
- `src/cron/timer-15min.ts`
- `src/cron/timer-midnight.ts`
- `src/cron/timer-scheduled-tasks.ts`
- `COOLIFY_DEPLOYMENT_GUIDE.md`
- .env
- `Dockerfile`
- `tools/check-coolify-ready.ts`






