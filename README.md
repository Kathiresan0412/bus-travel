# RouteLedger · Bus Finance Manager

A mobile-first finance workspace for small bus operators, built to replace the notebook used for daily income and expense tracking.

## Project status

### Done — Phase 1: foundation, authentication and access

- Next.js App Router, TypeScript, Tailwind CSS and MongoDB/Mongoose setup.
- Cached Mongoose connection for serverless deployments.
- Credentials sign-in with bcrypt password hashes, JWT sessions, secure HTTP-only cookies and an eight-hour session lifetime.
- Login-attempt throttling and server-side password validation for accounts created through the owner interface and seed.
- Database models for users, roles, permissions, audit logs, settings and login attempts.
- Seeded Owner, Manager/Accountant, Driver/Conductor and Viewer roles, permissions and the initial owner account.
- Owner dashboard, team list and account creation screen.
- Permission-guard helper and owner-protected user and role read routes.
- Local setup and Vercel deployment instructions.

### In progress — Phase 2: daily bus operations

- Bus and employee create/list screens, daily income and expense entry, categories and shared expense allocation.
- Driver records are server-scoped to their assigned bus and today's Colombo date.
- Editing/restoring records, receipt uploads, quick-add defaults and owner date unlock are still pending.

### In progress — Phase 3: dashboard and reports

- Dashboard totals, month comparison, bus ranking and charts.
- Aggregation reports for daily, monthly, yearly, bus-wise, category and fuel summaries; bus comparison and CSV/Excel/PDF/print exports.
- Category/employee/date-preset filters are available. Report verification against broader real-world data remains pending.

### In progress — Phase 4: operations and reminders

- Salary and advance records, monthly bus loan installments, maintenance schedules, document expiry records and due-date reminders.
- Paid salary and loan amounts are not yet included in profit/loss totals; reminder email is also pending.

### In progress — Phase 5: import and finishing work

- CSV/XLSX notebook import with column mapping, preview, server validation and row-level results.
- Audit history browsing with filters and change details; search, sorting and pagination for fleet and finance tables.
- English/Sinhala/Tamil translation dictionaries are in place; applying translations across the UI and record restore flows remain.

See [FEATURE.md](./FEATURE.md) for the current done/not-done checklist. Run `npm run seed` after permission changes so the database receives the new `imports.manage` permission; users should sign out and back in afterward.

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
Run `npm run seed` again after permission or category updates to sync those changes to MongoDB. Set `SEED_SAMPLE_BUSES=true` if you want four clearly labeled demo buses for a test database. Existing users should sign out and back in after role permissions are updated.

## Deploy to Vercel

1. Push this repository to GitHub and import it into Vercel.
2. In Project Settings → Environment Variables, add `MONGODB_URI`, `AUTH_SECRET`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` for the environments you use. Add `BLOB_READ_WRITE_TOKEN` later if receipt uploads are enabled.
3. Ensure your MongoDB Atlas network access permits connections from the Vercel deployment. Atlas does not provide stable outbound Vercel IPs on standard plans; broad `0.0.0.0/0` access is commonly needed. Use a dedicated least-privilege DB user and a strong secret.
4. Deploy. For a new database, run `npm run seed` once from a trusted environment using the same production environment variables. Do not expose the seed credentials in client code.
5. Verify the deployment by signing in, creating a non-owner account, and confirming the account’s role controls access.

## Data and security notes

Database access uses a cached Mongoose connection suitable for serverless reuse. Protected reads and writes must call the permission guard in the server handler/service; hiding controls in the UI is not authorization. Money records in later phases will use integer smallest-currency units. Never commit `.env.local` or production secrets.
