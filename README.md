# CaseBridge MVP

CaseBridge is a shelter casework operating system for caseworkers, SSA/supervisors, managers, and admins.

## Requirements

Create `.env.local` with:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL=admin@your-org.org
NEXT_PUBLIC_BOOTSTRAP_ADMIN_UID=
```

## Login setup (simple flow)

- Create your own Firebase Auth user for the admin email first.
- Set `NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL` to that same email **or** set `NEXT_PUBLIC_BOOTSTRAP_ADMIN_UID` to the Firebase Auth UID you want to bootstrap as admin.
- First login with the matching bootstrap email/UID auto-creates the admin profile in `users`.
- After that, staff accounts should only log in after an admin creates their profile and assigns a role.

## Run locally

```bash
npm install
npm run dev
```

## Seed demo data

The repository includes `scripts/seed-demo-data.ts` for realistic fictional shelter data:

- 1 organization
- 2 sites
- 1 admin
- 1 manager
- 1 SSA
- 4 caseworkers
- 15 clients with notes, tasks, referrals, risk flags, safety plans, supervisor reviews, and audit logs

Run:

```bash
npx tsx scripts/seed-demo-data.ts
```

## Current MVP workflows

- Role-based login and route access
- Firestore-backed caseworker dashboard and client list
- Client profile with timeline activity
- AI-assisted case-note workflow at `/clients/[id]/notes/new`
- Optional task/referral/risk creation from note save
- Audit log writes for sensitive service operations
- Firestore rules + index baseline
