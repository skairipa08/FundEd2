# FundEd - Educational Crowdfunding Platform

## Product Requirements Document

**Created:** January 2026  
**Last Updated:** January 2026

---

## Original Problem Statement

Build a GoFundMe clone named "FundEd" specifically for educational fundraising. The platform allows verified students to create campaigns to raise funds for educational needs (tuition, books, laptop, etc.) while providing donors with a secure way to contribute.

---

## Core Requirements

### User Roles
- **Student**: Can apply for verification, create campaigns (after approval)
- **Donor**: Can browse campaigns, make donations
- **Institution**: Organization role (placeholder for future features)
- **Admin**: Verify students, manage campaigns, view platform stats

### Authentication
- Google OAuth via NextAuth.js
- JWT-based sessions
- First user with `INITIAL_ADMIN_EMAIL` becomes admin

### Campaign Features
- CRUD operations for campaigns
- Categories: tuition, books, laptop, housing, travel, emergency
- Progress tracking: raisedAmount, donorCount
- Admin verification workflow: pending → verified/rejected
- Impact log field for students

### Donation System
- Stripe Checkout Sessions
- Webhook handling for payment confirmations
- Idempotency keys to prevent duplicates
- Donor wall with anonymity option
- Refund handling

### Admin Features
- Dashboard with platform statistics
- Student verification workflow
- Campaign management
- User role management

---

## Technical Architecture

### Stack
- **Frontend + Backend**: Next.js 15 App Router (TypeScript)
- **Database**: MongoDB Atlas with Mongoose
- **Authentication**: NextAuth.js v5 with Google Provider
- **Payments**: Stripe Checkout + Webhooks
- **Styling**: TailwindCSS + shadcn/ui components
- **Deployment**: Vercel-ready

### Project Structure
```
/app
├── src/
│   ├── app/
│   │   ├── api/                    # API Route Handlers
│   │   │   ├── admin/              # Admin endpoints
│   │   │   ├── auth/               # NextAuth handlers
│   │   │   ├── campaigns/          # Campaign CRUD
│   │   │   ├── donations/          # Donation + Stripe checkout
│   │   │   ├── stripe/             # Webhook handler
│   │   │   └── students/           # Student profile
│   │   ├── browse/                 # Browse campaigns page
│   │   ├── campaign/[id]/          # Campaign detail page
│   │   ├── create-campaign/        # Create campaign form
│   │   ├── dashboard/              # User dashboard
│   │   ├── donate/success/         # Payment success page
│   │   ├── login/                  # Login page
│   │   └── page.tsx                # Homepage
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── campaign-card.tsx
│   │   ├── footer.tsx
│   │   ├── navbar.tsx
│   │   └── providers.tsx
│   └── lib/
│       ├── models/                 # Mongoose models
│       │   ├── campaign.ts
│       │   ├── donation.ts
│       │   └── user.ts
│       ├── auth.ts                 # NextAuth config
│       ├── auth-helpers.ts         # Auth utility functions
│       └── db.ts                   # MongoDB connection
├── .env.example                    # Environment variables template
├── README.md                       # Deployment documentation
└── package.json
```

---

## What's Been Implemented

### January 2026 - Full Next.js Migration
- [x] Removed FastAPI backend entirely
- [x] Created Next.js App Router structure
- [x] Implemented MongoDB connection with caching for Vercel serverless
- [x] Set up NextAuth.js with Google Provider
- [x] Created all Mongoose models (User, Campaign, Donation)
- [x] Implemented all API route handlers
- [x] Created Stripe webhook with signature verification
- [x] Built all frontend pages (Home, Browse, Campaign Detail, Dashboard, Create Campaign, Login, Donate Success)
- [x] Set up responsive UI with TailwindCSS and shadcn/ui
- [x] Build passes on Vercel (`yarn build`)
- [x] Created comprehensive deployment documentation

### API Routes Implemented
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers
- `GET /api/auth/me` - Current user info
- `GET /api/campaigns` - List campaigns (with filters)
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[id]` - Campaign detail
- `PUT /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Cancel campaign
- `GET /api/campaigns/my` - User's campaigns
- `POST /api/donations/checkout` - Create Stripe checkout
- `GET /api/donations/status/[sessionId]` - Payment status
- `GET /api/donations/my` - User's donations
- `POST /api/stripe/webhook` - Stripe event handler
- `POST /api/students/profile` - Create student profile
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/[id]/role` - Update user role
- `GET /api/admin/students` - List students
- `GET /api/admin/students/pending` - Pending verifications
- `PUT /api/admin/students/[id]/verify` - Approve/reject student
- `GET /api/admin/campaigns` - All campaigns
- `PUT /api/admin/campaigns/[id]/status` - Update campaign status
- `GET /api/categories` - Campaign categories
- `GET /api/countries` - Supported countries
- `GET /api/fields-of-study` - Fields of study

---

## Environment Variables Required

```
MONGODB_URI=mongodb+srv://...
AUTH_SECRET=<random-secret>
AUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
STRIPE_API_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
INITIAL_ADMIN_EMAIL=admin@example.com
```

---

## Deployment Instructions

See `README.md` for complete Vercel deployment guide including:
- MongoDB Atlas setup
- Google OAuth configuration
- Stripe webhook setup
- Environment variable configuration

---

## Future/Backlog (P2)

- [ ] File uploads for verification documents (Cloudinary/Vercel Blob)
- [ ] Email notifications (SendGrid/Resend)
- [ ] Institution dashboard
- [ ] Advanced search/filtering
- [ ] Campaign image uploads
- [ ] Social sharing integration
- [ ] Mobile app
- [ ] Analytics dashboard

---

## Security Features

- Stripe webhook signature verification (MUST have STRIPE_WEBHOOK_SECRET)
- Role-based API route protection
- JWT session management
- Idempotency keys for donations
- CSRF protection via NextAuth.js
