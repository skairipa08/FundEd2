# FundEd - Educational Crowdfunding Platform

FundEd is a GoFundMe-style crowdfunding platform specifically designed for verified students to raise funds for educational needs (tuition, books, laptops, housing, etc.).

## Features

- 🎓 **Student Verification** - Admin-verified student profiles ensure authenticity
- 💳 **Stripe Payments** - Secure donation processing with Stripe
- 🔐 **Google OAuth** - Simple authentication via Google
- 📊 **Admin Dashboard** - Verify students, view platform statistics
- 🌍 **Campaign Filters** - Browse by category, country, field of study
- 💝 **Donor Wall** - Public recognition (with anonymous option)

## Tech Stack

- **Frontend**: React 19, TailwindCSS, shadcn/ui
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **Payments**: Stripe
- **Auth**: Google OAuth (via Emergent Auth or custom implementation)

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd funded

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your credentials (see Environment Variables section)

# Start all services
docker compose up --build

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001/api
```

### Option 2: Local Development

#### Prerequisites
- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB (local or Atlas)

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your values

# Run the server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Copy and configure environment
cp .env.example .env
# Edit .env with your values

# Run the development server
yarn start
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|  
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `funded_db` |
| `STRIPE_API_KEY` | Stripe secret key (test or live) | `sk_test_...` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|  
| `REACT_APP_BACKEND_URL` | Backend API base URL | `http://localhost:8001` |

## Default Admin Account

On first startup, an admin account is automatically seeded:

- **Email**: `admin@funded.com`
- **Access**: Login via Google OAuth with this email address

### Changing Admin Email

Edit `backend/server.py`, find the `seed_admin_account()` function, and change:

```python
admin_email = "admin@funded.com"  # Change this to your email
```

Or add admins directly via MongoDB:

```javascript
db.users.insertOne({
  user_id: "user_custom_admin",
  email: "your-email@example.com",
  name: "Your Name",
  role: "admin",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})
```

## Authentication Setup

### Option A: Emergent Auth (Cloud - No Setup Required)

The app is pre-configured to use Emergent Auth for Google OAuth. This works out of the box when deployed on Emergent platform.

### Option B: Custom Google OAuth (Self-Hosted)

To use your own Google OAuth:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Set authorized redirect URIs:
   - `http://localhost:3000/dashboard` (development)
   - `https://yourdomain.com/dashboard` (production)
5. Update `frontend/src/pages/Login.jsx` to use your OAuth URL
6. Update `backend/routes/auth.py` to validate tokens with Google API

## Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. For testing, use `sk_test_...` keys
4. Add the secret key to `backend/.env`

### Test Card Numbers
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Use any future expiry date and any CVC

## API Documentation

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Health check |
| GET | `/api/categories` | Get campaign categories |
| GET | `/api/countries` | Get supported countries |
| GET | `/api/fields-of-study` | Get fields of study |
| GET | `/api/campaigns` | List campaigns (with filters) |
| GET | `/api/campaigns/{id}` | Get campaign details |
| POST | `/api/donations/checkout` | Create Stripe checkout |
| GET | `/api/donations/status/{session_id}` | Get payment status |

### Authenticated Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/auth/session` | Create session | Any |
| GET | `/api/auth/me` | Get current user | Any |
| POST | `/api/auth/logout` | Logout | Any |
| POST | `/api/campaigns` | Create campaign | Verified Student |
| GET | `/api/campaigns/my` | Get my campaigns | Student |
| GET | `/api/donations/my` | Get my donations | Any |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/students/pending` | List pending verifications |
| PUT | `/api/admin/students/{id}/verify` | Approve/reject student |
| GET | `/api/admin/stats` | Platform statistics |

## Project Structure

```
funded/
├── backend/
│   ├── models/          # Pydantic models
│   ├── routes/          # API endpoints
│   ├── utils/           # Helper functions
│   ├── tests/           # Test files
│   ├── server.py        # Main FastAPI app
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API client
│   │   └── hooks/       # Custom hooks
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── contracts.md         # API contracts
└── README.md
```

## User Roles

| Role | Permissions |
|------|-------------|
| **Donor** | Browse campaigns, donate, view donation history |
| **Student** | All donor permissions + create campaigns (after verification) |
| **Admin** | All permissions + verify students, view stats |

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/

# Frontend tests
cd frontend
yarn test
```

### Seeding Test Data

```bash
cd backend
python seed_data.py
```

This creates sample students, campaigns, and donations for development.

## Deployment

### Docker Deployment

```bash
# Build and run production containers
docker compose -f docker-compose.yml up -d --build

# View logs
docker compose logs -f
```

### Environment-Specific Settings

For production:
1. Use production Stripe keys (`sk_live_...`)
2. Set proper CORS origins
3. Use MongoDB Atlas or secured MongoDB instance
4. Enable HTTPS
5. Set secure cookie settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.
