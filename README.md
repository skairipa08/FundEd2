# FundEd - Educational Crowdfunding Platform

A full-stack Next.js application for educational crowdfunding with verified students, Stripe payments, and admin verification workflows. Fully deployable on Vercel.

## Features

- **User Authentication**: Google OAuth via NextAuth.js
- **Role-Based Access**: Student, Donor, Admin, Institution roles
- **Campaign Management**: Students create campaigns after verification
- **Payment Processing**: Stripe Checkout with webhooks
- **Admin Dashboard**: Verify students, manage campaigns
- **Donor Wall**: Track donations and supporters

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: MongoDB Atlas with Mongoose
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Payments**: Stripe Checkout & Webhooks
- **Styling**: TailwindCSS + shadcn/ui
- **Deployment**: Vercel

---

## Quick Start (Local Development)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd funded
yarn install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values (see Configuration section below).

### 3. Run Development Server

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Configuration

### MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster (free tier works fine)
3. Create a database user with read/write access
4. Get connection string from "Connect" > "Connect your application"
5. Set `MONGODB_URI` in your environment

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** > **Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add Authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-app.vercel.app/api/auth/callback/google`
6. Copy Client ID and Secret to your environment

### Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get API keys from **Developers** > **API keys**
3. For webhooks:
   - Go to **Developers** > **Webhooks**
   - Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `checkout.session.expired`
     - `charge.refunded`
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### NextAuth Secret

Generate a secure secret:

```bash
openssl rand -base64 32
```

Set this as `AUTH_SECRET`.

---

## Vercel Deployment

### Quick Deploy Checklist

Use this checklist when deploying to Vercel:

- [ ] **MongoDB Atlas**: Create cluster, get connection string
- [ ] **Environment Variables**: Add all 9 required vars in Vercel dashboard
- [ ] **Google OAuth**: Add redirect URI `https://YOUR-APP.vercel.app/api/auth/callback/google`
- [ ] **Stripe Webhook**: Create endpoint `https://YOUR-APP.vercel.app/api/stripe/webhook`
- [ ] **Deploy**: Import repo and deploy
- [ ] **Test Login**: Verify Google OAuth works
- [ ] **Test Payment**: Make test donation with card `4242 4242 4242 4242`

### Step-by-Step

#### 1. Import Project

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **Add New...** > **Project**
4. Import your GitHub repository

#### 2. Configure Environment Variables (ALL REQUIRED)

In Vercel project settings > Environment Variables, add:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `AUTH_SECRET` | ✅ | Run `openssl rand -base64 32` to generate |
| `AUTH_URL` | ✅ | Your Vercel URL: `https://your-app.vercel.app` |
| `GOOGLE_CLIENT_ID` | ✅ | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ✅ | From Google Cloud Console |
| `STRIPE_API_KEY` | ✅ | Stripe Secret Key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe Publishable Key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ | From Stripe Webhook settings (`whsec_...`) |
| `INITIAL_ADMIN_EMAIL` | ✅ | Email that becomes admin on first login |

#### 3. Configure Google OAuth Redirect URIs

In [Google Cloud Console](https://console.cloud.google.com) > APIs & Services > Credentials:

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google          (local dev)
https://your-app.vercel.app/api/auth/callback/google    (production)
```

#### 4. Configure Stripe Webhook

In [Stripe Dashboard](https://dashboard.stripe.com) > Developers > Webhooks:

1. Click **Add endpoint**
2. **Endpoint URL**: `https://your-app.vercel.app/api/stripe/webhook`
3. **Events to send** (select all):
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
4. Copy the **Signing secret** (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`

#### 5. Deploy

Click **Deploy** in Vercel. Future pushes auto-deploy.

#### 6. Post-Deploy Verification

1. Visit your app URL
2. Click "Sign In" and test Google OAuth
3. Check that user appears in MongoDB `users` collection
4. Browse campaigns page loads
5. Test a donation flow with Stripe test card

---

## Database Schema

### Users
```typescript
{
  email: string;
  name: string;
  image?: string;
  role: 'student' | 'donor' | 'institution' | 'admin';
  studentProfile?: {
    country: string;
    fieldOfStudy: string;
    university: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    verificationDocuments: Array<{ type: string; url?: string; verified: boolean }>;
  };
}
```

### Campaigns
```typescript
{
  studentId: ObjectId;
  title: string;
  story: string;
  category: 'tuition' | 'books' | 'laptop' | 'housing' | 'travel' | 'emergency';
  targetAmount: number;
  raisedAmount: number;
  donorCount: number;
  timeline: string;
  impactLog?: string;
  status: 'active' | 'completed' | 'cancelled' | 'suspended';
}
```

### Donations
```typescript
{
  campaignId: ObjectId;
  donorId?: ObjectId;
  donorName: string;
  amount: number;
  anonymous: boolean;
  stripeSessionId: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
  idempotencyKey?: string;
}
```

---

## API Routes

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handlers
- `GET /api/auth/me` - Get current user

### Campaigns
- `GET /api/campaigns` - List campaigns (with filters)
- `POST /api/campaigns` - Create campaign (verified students)
- `GET /api/campaigns/[id]` - Get campaign details
- `PUT /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Cancel campaign
- `GET /api/campaigns/my` - Get user's campaigns

### Donations
- `POST /api/donations/checkout` - Create Stripe checkout
- `GET /api/donations/status/[sessionId]` - Check payment status
- `GET /api/donations/my` - Get user's donations

### Stripe Webhook
- `POST /api/stripe/webhook` - Handle Stripe events

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/[id]/role` - Update user role
- `GET /api/admin/students` - List students
- `GET /api/admin/students/pending` - List pending students
- `PUT /api/admin/students/[id]/verify` - Approve/reject student
- `GET /api/admin/campaigns` - List all campaigns
- `PUT /api/admin/campaigns/[id]/status` - Update campaign status

### Static Data
- `GET /api/categories` - Campaign categories
- `GET /api/countries` - Supported countries
- `GET /api/fields-of-study` - Fields of study

---

## User Flow

### For Students
1. Sign in with Google
2. Complete student profile (country, university, field of study)
3. Upload verification documents
4. Wait for admin approval
5. Once verified, create a campaign
6. Share campaign link, receive donations

### For Donors
1. Sign in with Google (optional)
2. Browse campaigns
3. Select campaign and donation amount
4. Complete payment via Stripe
5. Appear on donor wall (unless anonymous)

### For Admins
1. Sign in with the INITIAL_ADMIN_EMAIL
2. View pending student verifications
3. Approve or reject students
4. Monitor campaign activity and donations

---

## Security Features

- **Webhook Signature Verification**: All Stripe webhooks verified with STRIPE_WEBHOOK_SECRET
- **Idempotency**: Donation records use idempotency keys to prevent duplicates
- **Role-Based Access**: API routes check user roles before allowing actions
- **CSRF Protection**: NextAuth.js handles CSRF automatically
- **Secure Sessions**: JWT-based sessions with AUTH_SECRET

---

## Testing

### Stripe Test Mode

Use Stripe test keys and test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- [More test cards](https://stripe.com/docs/testing)

### Local Webhook Testing

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## License

MIT

---

## Support

For issues, please open a GitHub issue.
