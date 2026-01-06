from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
from pathlib import Path
from datetime import datetime, timezone
import uuid

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'funded_db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app
app = FastAPI(
    title="FundEd API",
    version="2.0.0",
    description="Educational crowdfunding platform API"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import routes
from routes.auth import router as auth_router
from routes.campaigns import router as campaigns_router
from routes.donations import router as donations_router
from routes.admin import router as admin_router
from routes.static_data import router as static_data_router
from routes.uploads import router as uploads_router
from routes.webhooks import router as webhooks_router

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(campaigns_router)
api_router.include_router(donations_router)
api_router.include_router(admin_router)
api_router.include_router(static_data_router)
api_router.include_router(uploads_router)
api_router.include_router(webhooks_router)


# Health check endpoints
@api_router.get("/")
async def root():
    return {
        "message": "FundEd API is running",
        "version": "2.0.0",
        "docs": "/docs"
    }


@api_router.get("/health")
async def health_check():
    # Check MongoDB connection
    try:
        await db.command("ping")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# Include the router in the main app
app.include_router(api_router)


# Store db reference in app state
@app.on_event("startup")
async def startup_event():
    app.state.db = db
    await create_indexes()
    await seed_initial_admin()
    logger.info("FundEd API started successfully")


async def create_indexes():
    """Create MongoDB indexes for performance."""
    try:
        # Users
        await db.users.create_index("user_id", unique=True)
        await db.users.create_index("email", unique=True)
        await db.users.create_index("role")
        
        # Sessions
        await db.user_sessions.create_index("session_token", unique=True)
        await db.user_sessions.create_index("user_id")
        await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
        
        # Campaigns
        await db.campaigns.create_index("campaign_id", unique=True)
        await db.campaigns.create_index("student_id")
        await db.campaigns.create_index("status")
        await db.campaigns.create_index([("title", "text"), ("story", "text")])
        
        # Donations
        await db.donations.create_index("donation_id", unique=True)
        await db.donations.create_index("campaign_id")
        await db.donations.create_index("donor_id")
        await db.donations.create_index("stripe_session_id", unique=True, sparse=True)
        
        # Transactions
        await db.payment_transactions.create_index("session_id", unique=True)
        await db.payment_transactions.create_index("idempotency_key", unique=True, sparse=True)
        
        # Student profiles
        await db.student_profiles.create_index("user_id", unique=True)
        await db.student_profiles.create_index("verification_status")
        
        logger.info("Database indexes created")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")


async def seed_initial_admin():
    """
    Seed initial admin from INITIAL_ADMIN_EMAIL environment variable.
    Only creates if no admins exist.
    """
    initial_admin_email = os.environ.get("INITIAL_ADMIN_EMAIL", "").strip().lower()
    
    # Check if any admin exists
    existing_admin = await db.users.find_one({"role": "admin"}, {"_id": 0})
    
    if existing_admin:
        logger.info(f"Admin account exists: {existing_admin['email']}")
        return
    
    if not initial_admin_email:
        logger.warning(
            "No INITIAL_ADMIN_EMAIL set and no admin exists. "
            "Set INITIAL_ADMIN_EMAIL to create initial admin on first login."
        )
        return
    
    # Check if user with this email already exists
    existing_user = await db.users.find_one({"email": initial_admin_email}, {"_id": 0})
    
    if existing_user:
        # Promote existing user to admin
        await db.users.update_one(
            {"email": initial_admin_email},
            {"$set": {"role": "admin", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        logger.info(f"Promoted existing user to admin: {initial_admin_email}")
    else:
        logger.info(f"Initial admin will be created on first login: {initial_admin_email}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("Database connection closed")


# CORS Configuration
def get_cors_origins():
    """Get CORS origins from environment."""
    cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
    if cors_origins == "*":
        return ["*"]
    return [origin.strip() for origin in cors_origins.split(",")]


environment = os.environ.get("ENVIRONMENT", "development")

if environment == "production":
    # Production: strict CORS
    cors_origins = get_cors_origins()
    if "*" in cors_origins:
        logger.warning("Using wildcard CORS in production is not recommended!")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        max_age=86400,  # Cache preflight for 24 hours
    )
else:
    # Development: permissive CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Request validation middleware
@app.middleware("http")
async def validate_content_type(request: Request, call_next):
    # Skip validation for webhooks and GET requests
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return await call_next(request)
    
    if "/webhook" in request.url.path:
        return await call_next(request)
    
    # Require JSON content type for POST/PUT/DELETE
    content_type = request.headers.get("content-type", "")
    if request.method in ["POST", "PUT", "DELETE"]:
        if content_type and "application/json" not in content_type and "multipart/form-data" not in content_type:
            return HTTPException(status_code=415, detail="Unsupported Media Type")
    
    return await call_next(request)
