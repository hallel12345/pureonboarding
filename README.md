# Pure Pest Onboarding Portal

Production-ready onboarding portal rebuilt from scratch for Vercel.

## Architecture

- `app/page.tsx` + `components/onboarding-wizard.tsx`
  - Single guided onboarding flow (welcome -> worker type -> entity/location -> profile -> required forms -> review/submit)
- `app/api/blob/upload/route.ts`
  - Single Vercel Blob browser-upload token route using `handleUpload`
  - Validates size/type/extension before issuing upload token
- `app/api/submit/route.ts`
  - Single final submit route
  - Validates payload + required uploads, then sends SMTP email
- `lib/config.ts`
  - Centralized worker types, entities, locations, required forms, preview/download URLs, upload limits
- `lib/schema.ts`
  - Shared Zod schemas for profile, uploads, and final submission
- `lib/email.ts`
  - SMTP send logic (server-only)

## Required Environment Variables

- `BLOB_READ_WRITE_TOKEN`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_EMAIL`
- `ACCOUNTANT_EMAIL`
- `INTERNAL_CC_EMAILS`

Copy `.env.example` to `.env.local` and fill values.

## Exactly Where To Set Accountant + Internal CC Emails

Set these in `.env.local` (local) and in Vercel Project Settings -> Environment Variables (production):

- `ACCOUNTANT_EMAIL=paige@pandaaccounting.com`
- `INTERNAL_CC_EMAILS=purepest.ut@gmail.com,purepest.id@mail.com`

The final submit route always sends:

- TO -> `ACCOUNTANT_EMAIL`
- CC -> every email in `INTERNAL_CC_EMAILS`

## Configure Forms / Worker Rules / Entities / Locations

Edit `lib/config.ts`:

- `WORKER_TYPE_OPTIONS`
- `EMPLOYER_ENTITY_OPTIONS`
- `WORK_LOCATION_OPTIONS`
- `REQUIRED_FORMS` (form titles, URLs, and `requiredFor` worker types)

Current defaults:

- `1099`: W-9 + Direct Deposit
- `W-2`: W-4 + I-9 + Direct Deposit

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Add env vars:

```bash
cp .env.example .env.local
```

3. Start app:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

5. Local test commands:

```bash
npm run test
npm run lint
npm run build
```

## Vercel Production Test Steps

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Add all environment variables in Vercel settings.
4. Deploy.
5. Open deployed URL and run both flows:
   - 1099 flow: upload W-9 + Direct Deposit
   - W-2 flow: upload W-4 + I-9 + Direct Deposit
6. Confirm submit stays disabled until:
   - required fields complete
   - required uploads done
   - confirmation checkbox checked
7. Submit and verify:
   - Email received at accountant (`ACCOUNTANT_EMAIL`)
   - Internal CC addresses receive copy
   - Email body includes all profile fields and Blob URLs

## Notes

- Secrets are server-side only.
- Blob uploads use one production-safe pipeline.
- Success page appears only after successful SMTP send.
