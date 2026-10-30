# RouteLedger · Bus Finance Manager

A mobile-first finance workspace for small bus operators. Phase 1 establishes the Next.js application, MongoDB models, credentials authentication, database-backed roles and permissions, and owner-managed team access. Daily bus operations are delivered in the following phases.

## Requirements

- Node.js 20 or newer
- MongoDB Atlas cluster (M0 is sufficient to get started)

## Local setup

1. Create a MongoDB Atlas project and an M0 cluster. Create a database user with a strong password. In **Network Access**, allow your development IP. For a Vercel hosted Atlas connection, configure the Atlas network access list for your deployment; `0.0.0.0/0` is the broad allow-all option and should only be used with strong database credentials.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI`, a random `AUTH_SECRET` (for example `openssl rand -base64 32`), and the owner email/password. The owner password needs 12+ characters, upper and lowercase letters, a number, and a symbol.
3. Install dependencies and seed the database:

   ```bash
   npm install
   npm run seed
   npm run dev
   ```

4. Open `http://localhost:3000` and sign in with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

The seed is repeatable: it upserts system roles and permissions and creates the owner only if that email does not already exist. It does not overwrite an existing owner password.

## Phase 1 features

- Auth.js credentials login with bcrypt password hashes, JWT sessions, secure HTTP-only cookies and an eight-hour session lifetime.
- MongoDB-backed users, roles, permissions, audit logs and business settings schemas.
- Server-side `requirePermission` guard for protected route handlers, with owner-only user and role inspection endpoints.
- Owner team page for creating manager, driver and viewer accounts.
- Seeded role and permission matrix. Driver bus/day scoping is enforced alongside operational endpoints as those arrive in Phase 2.

## Deploy to Vercel

1. Push this repository to GitHub and import it into Vercel.
2. In Project Settings → Environment Variables, add `MONGODB_URI`, `AUTH_SECRET`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` for the environments you use. Add `BLOB_READ_WRITE_TOKEN` later if receipt uploads are enabled.
3. Ensure your MongoDB Atlas network access permits connections from the Vercel deployment. Atlas does not provide stable outbound Vercel IPs on standard plans; broad `0.0.0.0/0` access is commonly needed. Use a dedicated least-privilege DB user and a strong secret.
4. Deploy. For a new database, run `npm run seed` once from a trusted environment using the same production environment variables. Do not expose the seed credentials in client code.
5. Verify the deployment by signing in, creating a non-owner account, and confirming the account’s role controls access.

## Data and security notes

Database access uses a cached Mongoose connection suitable for serverless reuse. Protected reads and writes must call the permission guard in the server handler/service; hiding controls in the UI is not authorization. Money records in later phases will use integer smallest-currency units. Never commit `.env.local` or production secrets.
