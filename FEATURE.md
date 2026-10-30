# RouteLedger feature tracker

This file reflects the features currently present in the application code.
Last reviewed: 2026-10-30.

## Status summary

- **Phase 1 — Done:** application foundation, sign-in and role-based access.
- **Phase 2 — In progress:** fleet setup and daily income/expense entry are implemented for create/list flows; record updates and several workflow details remain.
- **Phase 3 — In progress:** dashboard, aggregation reports, charts, filters and exports are implemented; final report verification remains.
- **Phase 4 — In progress:** salary, loan, maintenance, document and reminder flows are implemented; linking payroll/loan payments into P&L and email alerts remain.
- **Phase 5 — In progress:** notebook import, audit history and table navigation improvements are implemented; restore workflows and final polish remain.

## Phase 1 — Foundation and access

- [x] Next.js App Router, TypeScript, Tailwind CSS and cached MongoDB/Mongoose connection.
- [x] Auth.js credentials sign-in with bcrypt password hashes, JWT sessions, secure cookies and eight-hour session lifetime.
- [x] Login-attempt throttling and server-side password validation.
- [x] MongoDB models for users, roles, permissions, audit logs, settings and login attempts.
- [x] Owner, Manager/Accountant, Driver/Conductor and Viewer roles and permission seed.
- [x] Owner account seed and owner-managed team account creation.
- [x] Server permission guard and owner-protected user/role APIs.
- [x] README with local setup and Vercel deployment guidance.

## Phase 2 — Buses, employees and daily entries (in progress)

### Done

- [x] Bus schema and owner create/list screen, with registration number, route, seats, status and odometer fields.
- [x] Employee schema and owner create/list screen for drivers and conductors, with contact, license, assigned bus and salary details.
- [x] Driver login account creation requires an assigned bus.
- [x] Daily income create/list, with multiple trips per bus, ticket collection and other income.
- [x] Capture assigned driver/conductor on income entries with server-side role/bus validation.
- [x] Expense create/list, payment details, fuel details and notes.
- [x] Default expense categories seeded; owner can add categories through the expense screen.
- [x] Shared expenses can be split evenly across selected buses; integer allocations add up to the full expense amount.
- [x] Monetary entries validate on the server and store amounts as integer minor currency units.
- [x] Creation of buses, employees, income, expenses and categories writes an audit log entry.
- [x] Driver income and expense access is restricted server-side to their assigned bus and the current Asia/Colombo business date.
- [x] Driver entry lists are scoped to the assigned bus and current business date.

### Not done yet

- [ ] Edit, deactivate, soft-delete and restore buses, employees, income and expenses.
- [ ] Use the previous income entry as a quick-add default and remember the last selected bus.
- [ ] Upload receipt photos to Vercel Blob or Cloudinary.
- [ ] Add sample income and expense records for the demo buses.
- [ ] Let an owner explicitly unlock a driver to enter a past or future date.

The seed supports four optional demo buses when `SEED_SAMPLE_BUSES=true`; demo financial entries are not seeded yet.

## Phase 3 — Dashboard and reports (in progress)

The Phase 3 code compiles successfully with `npm run build`. Report calculations still need validation against a broader set of real and edge-case records before this phase is marked complete.

### Done

- [x] Dashboard income, expense and profit for today, plus active bus count.
- [x] Current-month profit compared with last month, and best/worst bus by profit.
- [x] Income/expense trend and bus profit charts.
- [x] MongoDB aggregation reports for daily, monthly, yearly, bus-wise and compare-buses views.
- [x] Expense category report and pie chart.
- [x] Fuel litres and cost report; km/L is estimated from odometer readings recorded on fuel expenses.
- [x] Report filters for custom date range, bus, employee and expense category where applicable.
- [x] Date presets for today, yesterday, this week, this month, last month, this year and custom range.
- [x] CSV, Excel, PDF and browser print export for report rows.
- [x] Server-side report permission checks; drivers do not receive report access by default.

### Not done yet

- [ ] Validate aggregation results against a larger set of real and edge-case records.
- [ ] Add upcoming document expiry details to the dashboard after Phase 4 document records exist.

## Phase 4 — Salaries, loans and reminders (in progress)

The Phase 4 implementation passes `npm run build`. New role permissions were synced to the configured database; users should sign out and back in to refresh their session permissions.

### Done

- [x] Monthly salary records with gross, advances/other deductions, net pay and paid/draft status.
- [x] Employee advances and deductions with dated records.
- [x] Monthly salary totals for gross pay, deductions and net pay.
- [x] Bus loan records with principal, installment amount, remaining balance and payment totals.
- [x] Installment payments reduce the balance and reject payments above the remaining amount.
- [x] Maintenance history supports service date and odometer schedules; recorded maintenance cost is added to bus expenses.
- [x] Bus and employee documents include expiry and configurable reminder windows.
- [x] Reminder list and notification bell show expired/upcoming documents, driver license expiry, and service date/odometer reminders.
- [x] Server-side permission checks for salary, loan, maintenance, document and reminder routes.

### Not done yet

- [ ] Include paid salary and loan installments in bus and combined profit/loss reports.
- [ ] Optional email delivery for reminders.
- [ ] Persistent notification history and dismiss/read state.

## Phase 5 — Import and launch polish (in progress)

### Done

- [x] CSV and XLSX import with column mapping, sample preview, date format selection, server validation and row-level result reporting.
- [x] Import limits for file size, row count and column count; imported records are attributed to the signed-in user in the audit log.
- [x] Audit history page with actor, resource, action, date and text filters, pagination and old/new value details.
- [x] Search, sorting and pagination for fleet and finance tables.
- [x] English, Sinhala and Tamil translation dictionaries established for subsequent UI localization.
- [x] Responsive dashboard navigation includes a mobile sign-out control.
- [x] Production build passes after the Phase 5 additions.

### Not done yet

- [ ] Record edit, restore and soft-delete workflows.
- [ ] Apply translations throughout the application UI.
- [ ] Add date-range controls to audit history and broaden table navigation to the remaining lists.
- [ ] Complete a broader mobile/accessibility review and production deployment checklist.
- [ ] Verify import and audit flows against a test database with representative CSV/XLSX files.
- [ ] Resolve the production dependency advisories before launch.

## Current setup notes

- Income and expense amounts are entered in LKR with two decimal places and stored in cents. Configurable currency is not implemented yet.
- Run `npm run seed` after future permission or category changes to update MongoDB. Phase 5 adds the `imports.manage` permission; after syncing it, users should sign out and back in to refresh their JWT session.
- Receipt uploads and record editing/restoration are not implemented yet.
- `npm audit --omit=dev` reported 7 production dependency advisories: 3 moderate, 2 high and 2 critical. Resolve the Auth.js and other affected dependency issues before production deployment.
