# PVRS HUB – Local Business Directory (Justdial-style)

Next.js 16 frontend + Express backend. JSON-file database (`backend/data/db.json`, auto-seeded) – no MongoDB needed.

## Run locally
```bash
cd backend && npm install && npm run dev        # http://localhost:5000
cd frontend && npm install && npm run dev       # http://localhost:3000
```
- Admin login: mobile = `ADMIN_PHONE` in backend/.env (default 9999999999), OTP `123456` (dev mode) → `/admin`
- Reset demo data: `cd backend && npm run seed`

## Env
backend/.env – see `.env.example` (JWT_SECRET, ADMIN_PHONE, OTP_MODE, FIREBASE_API_KEY, RAZORPAY_KEY_ID/SECRET, WHATSAPP_TOKEN/PHONE_NUMBER_ID, prices).
frontend/.env.local – `NEXT_PUBLIC_API_URL`, and for real SMS OTP: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` (+ set backend `OTP_MODE=firebase`).

## Approval rules (everything goes through admin)
| Action | What happens |
|---|---|
| Vendor signup | account `pending` until admin approves (auto-approved when first listing approved) |
| New listing | needs Trade License/FSSAI/KMC upload; hidden until admin approves |
| Any edit to a live listing | stored in `pendingUpdates`; public keeps old verified data; admin sees a diff → Approve/Reject |
| Banner ad booking | premium only, pay-per-day via Razorpay, live only after admin approval |
| Claim listing | proof upload → admin approves → ownership transferred |

## Features
Free vs Premium (contact hiding, 1-image hardlock, gallery/banner/video embeds premium-only), featured loop ranked by search demand, top/middle/promo/hero-video ads, Order Online bottom sheet (Swiggy/Zomato), claim badge, WhatsApp lead alerts, plan & licence expiry job (warn → downgrade/suspend), legal pages (editable), Razorpay (mock mode without keys), mobile bottom bar + category ribbon + 2-col pills, desktop 8-col grid + sticky Advertise/Free Listing tabs.

Admin panel tabs: Overview, Approval Queue, Businesses (pre-load unclaimed), Users, Ads, Categories, Offers/Blogs/Videos, Homepage settings, Legal pages, Payments, Notifications/Audit.

## Note vs spec
The PDF asks for WordPress + ListingPro; this repo is a custom Node/Next build implementing the same business logic. For Hostinger use a **Node.js hosting / VPS** plan (shared WordPress hosting can't run it).


## ⚠️ Data saving (IMPORTANT)
Render / Railway free instances **wipe their disk on every restart/redeploy** — that is why data (users, listings, uploads) was disappearing.
The backend now saves **everything in MongoDB** (data + uploaded images/documents via GridFS) whenever `MONGODB_URI` works.

1. Create a free cluster on MongoDB Atlas → Database Access: add user → Network Access: allow `0.0.0.0/0`.
2. Copy the connection string, e.g. `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
3. Render → backend service → Environment: set `MONGODB_URI`, `MONGODB_DB=pvrs_hub`, `JWT_SECRET`, `ADMIN_PHONE`. Redeploy.
4. Check `https://<backend>/api/health` → must show `"storage":"mongo"`. If it shows `"file"`, the URI is wrong (see Render logs).
5. Vercel → frontend → Environment: `NEXT_PUBLIC_API_URL=https://<backend>.onrender.com`, redeploy.

Locally without MongoDB it falls back to `backend/data/db.json` (fine for dev). First Mongo start auto-imports an existing `data/db.json`.

## New in this update
Reviews & ratings (admin-moderated), customer enquiry form + vendor Enquiries inbox (WhatsApp alert for premium), saved/favourite businesses (`/favorites`),
search autocomplete, filters & sort on listing pages, Google Maps directions, share button, photo lightbox, admin “Enquiries & Reviews” tab + Reviews in approval queue.

## Feature Controls (Admin → 🎛️ Feature Controls)
On/off switches, applied live: customer login (default OFF — customers browse, review, save & enquire without account/OTP), customer OTP, new business signups, vendor OTP (admin login ALWAYS needs OTP), reviews, guest reviews, enquiries, favourites, claims, report-listing, Order Online, premium purchase, banner booking, maintenance mode. Plus an announcement bar and CSV exports (businesses, users, enquiries, reviews, payments).

Other additions: “Report this listing” (Sec. 79 takedown queue in Approval Queue → Reports), bulk approve, guest favourites saved on device, redesigned login.
