# PVRS HUB — Handover (Next.js + Express + Postgres)

**Stack:** Next.js 16 (frontend, Vercel) · Express 5 API (Render) · PostgreSQL (Neon). Data persists in Postgres; uploads are stored in the DB too.

## 1. Go-live checklist (client side)
| # | Task | Where |
|---|------|-------|
| 1 | Deploy backend + frontend | Render / Vercel (`NEXT_PUBLIC_API_URL` = backend URL) |
| 2 | `DATABASE_URL` (Neon), `JWT_SECRET`, `ADMIN_PHONE`, `FRONTEND_URL` | Render env |
| 3 | Gmail SMTP: `SMTP_USER=pvrshub@gmail.com`, `SMTP_PASS=<app password>`, `MAIL_FROM`, `ADMIN_EMAIL` | Render env → Admin › System › Send test email |
| 4 | Firebase phone auth: `OTP_MODE=firebase`, `FIREBASE_API_KEY` | Render env (until then OTP is test code 123456) |
| 5 | Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Render env (until then payments are mock) |
| 6 | WhatsApp Cloud API: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Render env |
| 7 | Replace `legal@yourdomain.in` / `support@yourdomain.in` with real Grievance Officer details | Admin › Legal |
| 8 | Admin › System › "Remove demo analytics data" | once, before launch |
| 9 | Set `NEXT_PUBLIC_SITE_URL` to the final domain (sitemap) | Vercel env |

## 2. Spec coverage (requirements brief v3)
- Justdial-style mobile + desktop UI: pinned header, dual search (location + keyword), sticky category tabs, 2-column pill grid, bottom bar (Home | Search/B2B | News/Feed | More), 8+ column desktop grid, sub-category buckets, right-edge Advertise / Free Listing tabs, #0055FF / #FF6600 palette.
- 3-level category tree with all brief categories & sub-categories (admin editable).
- Free plan: Call/WhatsApp hidden (shown as `XXXXXXXXXX`), exactly one image. Premium: contacts, gallery, banner, YouTube/Facebook/Instagram embeds.
- Pay-per-day homepage banner slots, video ad block, behaviour-ranked Featured loop (premium only), "List your business FREE" CTA, Order Online bottom sheet (Swiggy/Zomato), "Claim it now" badge, WhatsApp lead alerts.
- Mandatory licence upload (JPG/PNG/PDF, file-signature checked); global manual approval queue (new signups + every edit); public keeps old verified data until Approve.
- Plan & licence expiry tracking with email alerts; 7-day grace then auto-suspend.
- Legal pages (Disclaimer 3-possibility rule, Privacy, Terms, Grievance Officer). Mobile-number OTP login only (no email registration).

## 3. Added beyond the brief
Admin console (analytics, team & roles, feature switches, migrations/system, backups, CSV export, restore deleted business) · reviews/grievances/reports only for OTP-logged-in users with admin reply visible to customer (Contact › My complaints) · day-wise business hours with Open-now badge · duplicate-listing detection · rate limiting, security headers, input validation · account data download/delete · payment receipts · sitemap/robots/structured data · consent notice · 404/error pages.

## 4. Admin switches (Admin › Feature Controls)
Customer login, vendor signup, vendor OTP, reviews, enquiries, favourites, claims, banner booking, premium upgrade, report listing (default OFF), complaint tab (default OFF), order online, maintenance mode.

## 5. Acceptance test (from the brief)
1. Mobile login with OTP → 2. Upload licence on Free Listing → appears in Admin › Approval Queue → Approve → 3. Check on phone + desktop.

## 6. Known notes
- In-memory rate limits reset when the server restarts (fine at this scale).
- Render free tier sleeps when idle; use a paid instance for production.
