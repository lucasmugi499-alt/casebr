# CaseBridge

CaseBridge is a shelter casework operating system for caseworkers, SSAs, managers, and admins.

## 1) Environment setup

Create a local env file:

```bash
cp .env.example .env.local # if you keep an example file
```

Populate `.env.local` with Firebase client keys and Admin SDK credentials:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Option A: full JSON string
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Option B: split values
# FIREBASE_PROJECT_ID=
# FIREBASE_CLIENT_EMAIL=
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"

GEMINI_API_KEY=
DEMO_USER_PASSWORD=
```

> ⚠️ Never commit `.env.local` to source control.

## 2) Run the app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 3) First-admin setup flow (`/setup`)

For a brand-new Firebase project:

1. Open `/setup`.
2. Enter first name, last name, email, password, organization name, and primary site name.
3. CaseBridge server-side setup (Firebase Admin SDK) creates:
   - Firebase Auth user
   - organization
   - site
   - admin staff profile at `users/{uid}`
   - audit log (`setup_complete`)
4. After setup, `/setup` is locked and displays: **"Setup is already complete. Please log in."**

## 4) Login behavior (`/login`)

- Public sign-up is disabled.
- Login only uses Firebase Auth sign-in.
- If auth succeeds but `users/{uid}` does not exist, login is denied.
- If `users/{uid}` exists but status is inactive, login is denied.
- Active users are routed by role:
  - caseworker → `/dashboard`
  - ssa → `/team`
  - manager → `/management`
  - admin → `/admin/users`

## 5) Admin creates staff

Admins create staff from `/admin/users`.

Creation is server-side through Firebase Admin SDK and writes:

- Firebase Auth user
- Firestore profile at `users/{newAuthUid}`
- audit log (`create_user`)

Staff profile IDs **must** match Firebase Auth UIDs.

## 6) Seed demo data (server-side only)

Use the script (not browser seeding):

```bash
npm run seed
```

It creates:

- 1 organization (`org_casebridge_demo`)
- 2 sites (`site_downtown`, `site_east`)
- Firebase Auth + Firestore profiles for:
  - `admin@casebridge.demo`
  - `manager@casebridge.demo`
  - `ssa@casebridge.demo`
  - `caseworker1@casebridge.demo`
  - `caseworker2@casebridge.demo`
  - `caseworker3@casebridge.demo`
  - `caseworker4@casebridge.demo`
- demo clients, notes, tasks, referrals, risk flags, safety plans, supervisor reviews, audit logs

Password source:

- Uses `DEMO_USER_PASSWORD` from env
- Development-only fallback: `CaseBridgeDemo123!`

## 7) Data model rule

`users/{uid}` document ID must always equal the Firebase Auth UID for that user.

Do **not** create fake Firestore IDs for users unless Auth UID is exactly the same.
