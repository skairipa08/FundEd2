# FundEd - Educational Crowdfunding Platform

FundEd is a self-hostable crowdfunding platform for verified students to raise funds for educational needs. Built with React, FastAPI, and MongoDB.

## Features

- 🎓 **Student Verification** - Admin-verified student profiles ensure authenticity
- 💳 **Stripe Payments** - Secure donation processing with webhooks
- 🔐 **Google OAuth** - Standard OAuth 2.0 authentication
- 📊 **Admin Dashboard** - Verify students, manage users, view statistics
- 🌍 **Campaign Filters** - Browse by category, country, field of study
- 💝 **Donor Wall** - Public recognition with anonymous option
- 📁 **File Uploads** - Cloudinary integration for images and documents
- 🔒 **Security** - Rate limiting, CORS protection, input validation

## Tech Stack

- **Frontend**: React 19, TailwindCSS, shadcn/ui
- **Backend**: FastAPI (Python 3.11+), Motor (async MongoDB)
- **Database**: MongoDB
- **Payments**: Stripe (with webhook verification)
- **Auth**: Google OAuth 2.0
- **Storage**: Cloudinary
- **CI/CD**: GitHub Actions

---

## Quick Start

### Prerequisites

- Docker & Docker Compose (recommended) OR:
  - Node.js 18+ with Yarn
  - Python 3.11+
  - MongoDB

### Required External Services

You'll need accounts for:
1. **Google Cloud Console** - For OAuth (free)
2. **Stripe** - For payments (free test mode)
3. **Cloudinary** - For file uploads (free tier: 25GB)

---

## Setup Instructions

### Step 1: Clone and Configure

```bash
git clone <your-repo-url>
cd funded

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Step 2: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
7. Add **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
8. Copy **Client ID** and **Client Secret**
9. Add to both `.env` files:
   ```
   # backend/.env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
   
   # frontend/.env
   REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

### Step 3: Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Go to **Developers** > **API keys**
3. Copy **Secret key** (starts with `sk_test_`)
4. Add to `backend/.env`:
   ```
   STRIPE_API_KEY=sk_test_your_secret_key
   ```

**Webhook Setup (for payment verification):**
1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Enter URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `charge.refunded`
5. Copy **Signing secret** (starts with `whsec_`)
6. Add to `backend/.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Use any future date and any CVC

### Step 4: Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Go to **Dashboard**
3. Copy **Cloud name**, **API Key**, and **API Secret**
4. Add to both `.env` files:
   ```
   # backend/.env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # frontend/.env
   REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
   ```

### Step 5: Set Initial Admin

Add your email to `backend/.env`:
```
INITIAL_ADMIN_EMAIL=your-email@example.com
```

The first user to log in with this email will be assigned admin role.

---

## Running the Application

### Option 1: Docker Compose (Recommended)

```bash
# Start all services (MongoDB, Backend, Frontend)
docker compose up --build

# Or run in background
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api
- API Docs: http://localhost:8001/docs

### Option 2: Local Development

**Terminal 1 - MongoDB:**
```bash
# Using Docker
docker run -d -p 27017:27017 --name funded-mongo mongo:7.0

# Or install MongoDB locally
```

**Terminal 2 - Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 3 - Frontend:**
```bash
cd frontend

# Install dependencies
yarn install

# Run development server
yarn start
```

---

## Admin Management

### Initial Admin

Set `INITIAL_ADMIN_EMAIL` in `backend/.env` before first deployment. The user logging in with this email becomes admin.

### Promoting Users to Admin

**Via API:**
```bash
# First, get admin auth (login and copy session token)
# Then use the admin endpoint:
curl -X PUT "http://localhost:8001/api/admin/users/{user_id}/role" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=your_session_token" \
  -d '{"role": "admin"}'
```

**Via MongoDB:**
```javascript
// Connect to MongoDB
use funded_db

// Promote user by email
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

### Demoting Admins

Same process, set `role` to `"donor"` instead.

---

## API Documentation

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Health check |
| GET | `/api/health` | Detailed health status |
| GET | `/api/categories` | Campaign categories |
| GET | `/api/countries` | Supported countries |
| GET | `/api/fields-of-study` | Fields of study |
| GET | `/api/campaigns` | List campaigns (with filters) |
| GET | `/api/campaigns/{id}` | Campaign details |
| POST | `/api/donations/checkout` | Create Stripe checkout |
| GET | `/api/donations/status/{session_id}` | Payment status |
| GET | `/api/auth/config` | OAuth configuration |
| POST | `/api/auth/google/callback` | OAuth callback |

### Authenticated Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/auth/me` | Current user | Any |
| POST | `/api/auth/logout` | Logout | Any |
| POST | `/api/campaigns` | Create campaign | Verified Student |
| PUT | `/api/campaigns/{id}` | Update campaign | Owner |
| GET | `/api/campaigns/my` | My campaigns | Student |
| GET | `/api/donations/my` | My donations | Any |
| POST | `/api/uploads/image` | Upload image | Any |
| POST | `/api/uploads/document` | Upload document | Any |
| POST | `/api/admin/students/profile` | Create student profile | Any |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/{id}/role` | Update user role |
| DELETE | `/api/admin/users/{id}` | Delete user |
| GET | `/api/admin/students/pending` | Pending verifications |
| GET | `/api/admin/students` | All student profiles |
| PUT | `/api/admin/students/{id}/verify` | Approve/reject student |
| GET | `/api/admin/campaigns` | All campaigns |
| PUT | `/api/admin/campaigns/{id}/status` | Update campaign status |

### Webhook

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe/webhook` | Stripe webhook handler |

---

## User Roles & Permissions

| Role | Can Do |
|------|--------|
| **Donor** | Browse, donate, view history |
| **Student** | Above + create profile, create campaigns (after verification) |
| **Admin** | Everything + verify students, manage users, view stats |

### User Flow

1. **Sign up** → Default role: `donor`
2. **Create student profile** → Role changes to `student`, status: `pending`
3. **Admin verifies** → Status: `verified`
4. **Create campaigns** → Only verified students can create

---

## Running Tests

### Backend Tests

```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/ -v

# With coverage
pip install pytest-cov
pytest tests/ --cov=. --cov-report=html
```

### Frontend Tests

```bash
cd frontend
yarn test
```

---

## Production Deployment

### Environment Variables (Production)

```bash
# backend/.env
ENVIRONMENT=production
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/funded_db
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback
STRIPE_API_KEY=sk_live_...  # Use live key!
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CORS_ORIGINS=https://yourdomain.com
INITIAL_ADMIN_EMAIL=admin@yourdomain.com
SECRET_KEY=generate-a-strong-random-key

# frontend/.env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
REACT_APP_GOOGLE_CLIENT_ID=...
REACT_APP_CLOUDINARY_CLOUD_NAME=...
```

### Using Docker Compose

```bash
# Production build
docker compose -f docker-compose.prod.yml up -d --build
```

### Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure specific CORS origins (no wildcards)
- [ ] Use production Stripe keys
- [ ] Set strong `SECRET_KEY`
- [ ] Enable Stripe webhook signature verification
- [ ] Use MongoDB Atlas or secured MongoDB instance
- [ ] Regular backups

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed:**
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Or check local MongoDB
mongosh --eval "db.runCommand('ping')"
```

**Google OAuth Error:**
- Verify redirect URI matches exactly
- Check client ID is correct in both frontend and backend
- Ensure OAuth consent screen is configured

**Stripe Webhook Not Working:**
- For local testing, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
  ```bash
  stripe listen --forward-to localhost:8001/api/stripe/webhook
  ```
- Verify webhook secret is correct
- Check webhook events are enabled

**File Upload Failed:**
- Verify Cloudinary credentials
- Check file size limits (10MB images, 20MB documents)
- Verify file type is allowed

---

## Project Structure

```
funded/
├── backend/
│   ├── models/          # Pydantic data models
│   ├── routes/          # API endpoints
│   │   ├── auth.py      # Authentication
│   │   ├── campaigns.py # Campaign CRUD
│   │   ├── donations.py # Donation handling
│   │   ├── admin.py     # Admin endpoints
│   │   ├── uploads.py   # File uploads
│   │   └── webhooks.py  # Stripe webhooks
│   ├── utils/           # Helpers
│   ├── tests/           # Test files
│   ├── server.py        # FastAPI app
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API clients
│   │   └── hooks/       # Custom hooks
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml       # GitHub Actions
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

## License

MIT License - see LICENSE file for details.

---

## Support

For issues and feature requests, please open a GitHub issue.
