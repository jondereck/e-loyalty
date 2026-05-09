# Vercel Production Plan

## Current Status

- Framework: Next.js 16.2.4 App Router.
- Runtime target: Vercel, Node.js serverless functions.
- Database: PostgreSQL through Prisma.
- Auth: Neon Auth via `@neondatabase/auth`.
- Production checks: `npm run lint`, `npm test`, and `npm run build`.

## Required Vercel Settings

- Framework preset: Next.js.
- Root directory: repository root.
- Install command: `npm install`.
- Build command: `npm run build`.
- Output directory: leave empty/default for Next.js.
- Node.js version: 20.x or newer.

## Required Environment Variables

Add these in Vercel Project Settings for Production and Preview:

- `DATABASE_URL`: production PostgreSQL connection string. Use SSL for hosted Postgres.
- `NEON_AUTH_BASE_URL`: deployed app origin, for example `https://app.example.com`.
- `NEON_AUTH_COOKIE_SECRET`: long random secret. Do not reuse the development value.
- `NEON_AUTH_COOKIE_DOMAIN`: optional. Leave unset unless auth cookies must be shared across subdomains, for example `.example.com`.

Seed variables are optional and should only be configured for controlled seed runs:

- `SEED_SUPER_ADMIN_EMAILS`
- `SEED_BRANCH_ADMIN_EMAILS`
- `SEED_CASHIER_EMAILS`
- `SEED_BRANCH_CODE`
- `SEED_BRANCH_NAME`

## Database Release Flow

1. Create or choose the production Postgres database.
2. Set `DATABASE_URL` in Vercel.
3. Apply migrations before production traffic uses the deployment:

```bash
npm run prisma:migrate:deploy
```

4. Seed only when intentionally initializing a fresh environment:

```bash
npm run prisma:seed
```

Do not use `prisma migrate dev` against production.

## Deployment Flow

1. Push the branch to GitHub and let Vercel create a Preview Deployment.
2. Verify the preview with production-like environment variables.
3. Run local checks before promotion:

```bash
npm run lint
npm test
npm run build
```

4. Promote the validated preview to production from Vercel, or merge to the production branch if Git integration is configured that way.
5. After deploy, test login, signup, profile completion, QR card display, cashier scan, admin approvals, and super-admin settings.

## Rollback Plan

- If the deployment fails before release, keep the previous production deployment active.
- If production breaks after release, use Vercel rollback to restore the previous deployment.
- If a database migration is involved, prepare a forward-fix migration. Do not assume schema rollbacks are safe after users have written data.

## Production Notes

- `src/proxy.ts` protects authenticated routes and is detected by Next.js during build.
- Authorization must still be checked in server-side data access and route handlers; Proxy should not be the only protection layer.
- `.env` is ignored by Git. Use `.env.example` as the template for Vercel variables.
