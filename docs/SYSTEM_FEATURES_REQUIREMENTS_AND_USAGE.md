# E-Loyalty System Features, Requirements, Specifications, and Usage Guide

This document summarizes what the current E-Loyalty system can do, what it needs to run, the main specifications already implemented, and how each user role uses the system.

## 1. System Overview

E-Loyalty is a web-based digital loyalty card system built with Next.js. Customers get a secure QR loyalty card, cashiers scan the QR code during store visits, and admins manage members, branches, rewards, approvals, staff, reports, and system settings.

Main user roles:

- `CUSTOMER`: Uses the loyalty card, rewards, visit history, branches, notifications, and profile pages.
- `CASHIER`: Scans customer QR cards and records loyalty visits.
- `BRANCH_ADMIN`: Manages assigned branch operations such as approvals, members, staff, branches, and reports depending on permissions.
- `SUPER_ADMIN`: Has full system access, including global settings, rewards, tiers, roles, permissions, and maintenance mode.

## 2. Features

### Public and Authentication

- Public landing page for the loyalty program.
- Customer sign up with email and password.
- Google sign in/sign up through Neon Auth.
- Password login using email, username, or mobile identifier.
- Email OTP sign in.
- Forgot password and OTP-based password reset.
- Complete-profile flow for accounts created through external auth.
- Forced password change flow for staff accounts when required.
- Logout and protected route handling.

### Customer Features

- Digital loyalty card with QR code.
- Card number and secure QR token.
- Current points balance.
- Earned visit count.
- Loyalty tier display.
- Tier progress and multiplier display.
- Next reward progress.
- Visit eligibility status for the day.
- Last approved visit display.
- Rewards page with available, locked, and redeemed rewards.
- Visit and redemption history.
- Branch locator/list for active branches.
- Account profile page.
- Update full name, username, and mobile number.
- Change password using email OTP.
- Notification inbox with read/unread state.

### Cashier Features

- QR scanner page for customer loyalty cards.
- Branch-aware scanning based on staff assignment.
- Recent scan attempt list.
- Scan result page for approved, pending, or blocked scans.
- Auto-approval for eligible visits.
- Pending review flow for suspicious/manual-review scans.
- Blocked scan handling for invalid QR, duplicate visit, inactive branch, blocked card, inactive customer, or unauthorized cashier.

### Admin and Branch Admin Features

- Admin dashboard with:
  - Total members.
  - Staff user count.
  - Visits today.
  - Approved and rejected visit counts.
  - Pending review count.
  - Redemption rate.
  - Branch performance.
  - Recent activity.
  - Visit and points charts.
- Member management:
  - Search and filter members.
  - Filter by profile status, branch, card status, tier, and date range.
  - View member details.
  - Monitor points, visits, card number, and last visit.
  - Export member data.
- Approval management:
  - Review pending scans.
  - Approve or reject visits.
  - Filter by status, search text, and date range.
  - Export approval data.
- Staff management:
  - Create staff accounts.
  - Assign existing staff to branches.
  - Edit staff assignment, role, branch, and status.
  - Restrict branch admins to scoped staff management.
- Branch management:
  - Create branches as super admin.
  - Edit visible branches when authorized.
  - Delete branches as super admin.
  - Track active branch counts.
  - Store branch address, phone, email, and coordinates.
  - Export branch data.
- Reports:
  - Branch-scoped report metrics.
  - Total visits, points issued, redemptions, and average points per visit.
  - Charts for visit trends and points distribution.
  - Export report data.
- Activity log:
  - Searchable audit trail for system and loyalty activity.
  - Shows action, actor, subject, branch, and reference.

### Super Admin Features

- General system settings:
  - System name.
  - Support email.
  - Business timezone.
  - Date format.
  - Currency.
  - Maintenance mode.
  - Maintenance message.
  - System update status check.
- Points and rewards settings:
  - Configure points per approved visit.
  - Create, update, disable, and reorder reward milestones by points.
  - Configure loyalty tiers, thresholds, multipliers, and colors.
- Roles and permissions:
  - View protected system roles.
  - Create custom roles.
  - Edit role descriptions, status, default landing module, and module access.
  - Duplicate roles.
  - Disable custom roles.
- Maintenance access rules:
  - Customers and cashiers are blocked during maintenance.
  - Admin and super admin pages remain available based on role.

### Security and Controls

- Server-side authentication checks on protected routes and actions.
- Role-based and module-based access control.
- Branch-scoped admin access for branch admins.
- Server-side validation with Zod for important forms and settings.
- Prisma ORM for safe database access.
- Audit events for login, signup, scans, approvals, profile updates, and system actions.
- Scan attempts are recorded, including blocked and suspicious attempts.
- QR token preview/hash is used for scan-attempt tracking instead of exposing the full QR token in logs.
- Safe user-facing errors are returned for most route handlers.
- Environment secrets are kept in `.env` and not committed.

## 3. System Requirements

### Local Development Requirements

- Windows, macOS, or Linux.
- Node.js `20.x` or newer.
- npm.
- PostgreSQL database. Hosted PostgreSQL such as Neon is supported.
- Neon Auth project or compatible local Neon Auth endpoint.
- Browser with modern JavaScript support.
- Camera-capable browser/device for cashier QR scanning.

### Production Requirements

- Vercel or another Node-compatible hosting platform that supports Next.js.
- Node.js `20.x` or newer.
- PostgreSQL database with SSL enabled.
- Neon Auth configured with trusted production and preview origins.
- HTTPS domain. Camera-based QR scanning requires HTTPS in production browsers.
- Environment variables configured securely in the hosting platform.

### Required Environment Variables

Use `.env.example` as the template:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
NEON_AUTH_BASE_URL="https://your-neon-auth-host/neondb/auth"
NEON_AUTH_COOKIE_SECRET="replace-with-a-long-random-secret"
NEON_AUTH_COOKIE_DOMAIN=""
```

Optional seed variables:

```env
SEED_SUPER_ADMIN_EMAILS=""
SEED_BRANCH_ADMIN_EMAILS=""
SEED_CASHIER_EMAILS=""
SEED_BRANCH_CODE="MAIN"
SEED_BRANCH_NAME="Main Branch"
```

## 4. System Specifications

### Technology Stack

- Framework: Next.js `16.2.4` with App Router.
- UI: React `19.2.4`, Tailwind CSS `4`, Lucide icons, Radix UI dialogs/menus.
- Database: PostgreSQL.
- ORM: Prisma `7.8.0`.
- Auth: Neon Auth with email/password, Google, and email OTP flows.
- Validation: Zod.
- Charts: Recharts.
- QR scanning: `html5-qrcode`.
- QR display: `next-qrcode`.
- Tests: Vitest.

### Core Data Models

- `UserProfile`: Customer and staff profile, roles, status, contact details.
- `LoyaltyCard`: Card number, QR token, card status, tier, visits, and points.
- `Branch`: Branch details, status, contact fields, and coordinates.
- `StaffAssignment`: Staff-to-branch assignment with role and status.
- `AccessRole` and `RolePermission`: Custom role and module permission system.
- `Visit`: Customer scan/visit record with approval state and points awarded.
- `PointLedger`: Earn, redeem, and adjustment ledger records.
- `RewardMilestone`: Rewards customers can unlock or redeem.
- `RewardRedemption`: Customer reward redemption history.
- `ScanAttempt`: Record of successful, pending, rejected, invalid, or suspicious scans.
- `AuditEvent`: Audit log for important system actions.
- `SystemSetting`: Configurable system settings.
- `Notification`: User notifications.

### Loyalty Rules

- Default points per approved visit: `100`.
- Points per visit can be changed by super admin.
- Business timezone default: `Asia/Manila`.
- A customer can earn from one approved visit per business day.
- Duplicate same-day scans are blocked.
- Scans at another branch on the same business day are blocked after an approved visit.
- Blocked, inactive, or unauthorized users/cards/branches cannot earn points.
- Suspicious/manual-review scans can be sent to admin approval instead of auto-approval.
- Approved visits create point ledger entries and update card totals.

### Default Loyalty Tiers

- Starter: `0` points, `1.0x` multiplier.
- Silver: `1,000` points, `1.1x` multiplier.
- Gold: `5,000` points, `1.2x` multiplier.
- Platinum: `10,000` points, `1.5x` multiplier.

Tiers are configurable in Super Admin settings.

### Default Seed Rewards

- Free Drink: `1,000` points required.
- Premium Upgrade: `2,500` points required, `500` points cost.
- VIP Bundle: `5,000` points required, `1,000` points cost.

Rewards are configurable in Super Admin settings.

### Status Values

- User status: `ACTIVE`, `INACTIVE`, `SUSPENDED`.
- Card status: `ACTIVE`, `BLOCKED`.
- Branch status: `ACTIVE`, `INACTIVE`, `MAINTENANCE`.
- Staff assignment status: `ACTIVE`, `INACTIVE`, `REVOKED`.
- Visit status: `PENDING`, `AUTO_APPROVED`, `APPROVED`, `REJECTED`.
- Approval status: `NOT_REQUIRED`, `REQUIRED`, `APPROVED`, `REJECTED`, `OVERRIDDEN`.
- Ledger type: `EARN`, `REDEEM`, `ADJUST`.
- Reward status: `LOCKED`, `AVAILABLE`, `REDEEMED`, `EXPIRED`, `DISABLED`.

### Implemented Admin Modules

- Overview.
- Members.
- Approvals.
- Staff.
- Branches.
- Reports.
- System Reports.
- Settings.
- Scan.
- Roles and Permissions.

Note: Some visual cards under Super Admin `System`, `Security`, and `Notifications` tabs are prepared UI placeholders. The currently wired settings are general settings, maintenance mode, rewards, tiers, and roles/permissions.

## 5. How to Run the System Locally

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill in the required values.

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run database migrations:

```bash
npm run prisma:migrate
```

5. Seed initial settings, default roles, default branch, and default rewards:

```bash
npm run prisma:seed
```

6. Start the development server:

```bash
npm run dev
```

7. Open the app:

```text
http://localhost:3000
```

## 6. How to Use the System

### Customer Flow

1. Go to `/signup`.
2. Create an account using email/password or Google.
3. After login, open `/card` to view the loyalty card.
4. Tap the card to show the QR code.
5. Present the QR code to the cashier during a store visit.
6. Check points, tier progress, and next reward on the card page.
7. Open `/rewards` to view available rewards.
8. Open `/history` to view earned points and redemptions.
9. Open `/branches` to find active branches.
10. Open `/profile` to update account details or change password.
11. Open `/notifications` to view system updates and alerts.

### Cashier Flow

1. Log in using a cashier account.
2. Open `/cashier/scan`.
3. Allow camera permission in the browser.
4. Scan the customer's loyalty QR code.
5. Review the result:
   - Auto-approved: points are added immediately.
   - Pending: admin approval is required.
   - Blocked: the system shows the reason.
6. Use the recent scan list to monitor latest activity.

### Branch Admin Flow

1. Log in using a branch admin account.
2. Use `/admin/dashboard` for branch metrics and activity.
3. Use `/admin/approvals` to approve or reject pending scans.
4. Use `/admin/members` to search, filter, view, and export member data.
5. Use `/admin/staff` to manage allowed staff assignments.
6. Use `/admin/branches` to view or update branches within allowed access.
7. Use `/admin/reports` to view branch-scoped reports and exports.
8. Use `/admin/activity` to review the audit log.

### Super Admin Flow

1. Log in using a super admin account.
2. Use `/admin/dashboard` for platform-wide dashboard access.
3. Use `/super-admin/settings` to manage system settings.
4. In General settings, update system name, support email, timezone, date format, currency, and maintenance mode.
5. In Points & Rewards, update points per visit, rewards, and loyalty tiers.
6. In Roles & Permissions, create or update custom roles and module access.
7. Use branch, staff, member, approval, report, and activity pages for full operational management.

## 7. Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run reset:accounts
```

## 8. Manual Testing Checklist

- Sign up as a customer.
- Log in with email/password.
- Log in with Google if configured.
- Log in with email OTP if configured.
- Complete a profile for a new external-auth account.
- View customer QR card.
- Scan a valid QR as cashier.
- Confirm points are added for an eligible scan.
- Try a duplicate same-day scan and confirm it is blocked.
- Create a suspicious/manual-review scan and approve it as admin.
- Export members, approvals, branches, or reports.
- Update points per visit and confirm new scans use the new value.
- Update rewards and tiers in Super Admin settings.
- Enable maintenance mode and confirm customers/cashiers are blocked while admins remain allowed.
- Check audit activity after important actions.

## 9. Current Limitations and Follow-Up Improvements

- Super Admin `System`, `Security`, and `Notifications` setting cards are UI placeholders and need backend actions before they become operational controls.
- The system handles loyalty points and rewards, not payment processing.
- Production backup, cache clearing, and operational background job controls are not fully implemented yet.
- For production, configure trusted Neon Auth origins before testing login and staff account flows.
- Camera QR scanning must be tested on real devices and HTTPS production URLs, not only desktop local development.
