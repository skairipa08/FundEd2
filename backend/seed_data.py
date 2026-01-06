"""
Seed script to populate FundEd with test data.
Run with: python seed_data.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Sample data matching frontend mockData.js
SAMPLE_STUDENTS = [
    {
        "name": "Sarah Johnson",
        "email": "sarah.j@email.com",
        "picture": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        "country": "Kenya",
        "field_of_study": "Computer Science",
        "university": "University of Nairobi",
        "verification_status": "verified",
        "campaign": {
            "title": "Help me complete my Computer Science degree",
            "story": "I am a final-year computer science student passionate about building solutions for rural communities. Coming from a small village, I understand the challenges of limited access to technology and education. My dream is to create educational platforms that can reach underserved areas.",
            "category": "tuition",
            "target_amount": 5000.0,
            "raised_amount": 3200.0,
            "donor_count": 6,
            "timeline": "6 months",
            "impact_log": "Will complete my degree and develop educational software for rural schools"
        },
        "donations": [
            {"name": "John Doe", "amount": 500.0, "anonymous": False},
            {"name": "Anonymous", "amount": 200.0, "anonymous": True},
            {"name": "Tech Foundation", "amount": 1000.0, "anonymous": False},
            {"name": "Maria Garcia", "amount": 300.0, "anonymous": False},
            {"name": "Anonymous", "amount": 150.0, "anonymous": True},
            {"name": "David Chen", "amount": 1050.0, "anonymous": False}
        ]
    },
    {
        "name": "Raj Patel",
        "email": "raj.p@email.com",
        "picture": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        "country": "India",
        "field_of_study": "Medicine",
        "university": "All India Institute of Medical Sciences",
        "verification_status": "verified",
        "campaign": {
            "title": "Support my journey to become a rural doctor",
            "story": "Growing up in a rural area with limited healthcare facilities, I witnessed firsthand the importance of accessible medical care. I am dedicated to becoming a doctor who can serve underserved communities and make healthcare a reality for everyone.",
            "category": "tuition",
            "target_amount": 8000.0,
            "raised_amount": 5600.0,
            "donor_count": 4,
            "timeline": "12 months",
            "impact_log": "Will serve in rural healthcare after graduation"
        },
        "donations": [
            {"name": "Health Alliance", "amount": 2000.0, "anonymous": False},
            {"name": "Anonymous", "amount": 500.0, "anonymous": True},
            {"name": "Dr. Smith", "amount": 1500.0, "anonymous": False},
            {"name": "Community Fund", "amount": 1600.0, "anonymous": False}
        ]
    },
    {
        "name": "Emily Chen",
        "email": "emily.c@email.com",
        "picture": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
        "country": "United States",
        "field_of_study": "Engineering",
        "university": "MIT",
        "verification_status": "pending",
        "campaign": {
            "title": "Help fund my aerospace engineering research",
            "story": "As a first-generation college student, I am pursuing my dream of becoming an aerospace engineer. I need support to purchase essential equipment and materials for my research project on sustainable aviation.",
            "category": "laptop",
            "target_amount": 3500.0,
            "raised_amount": 800.0,
            "donor_count": 2,
            "timeline": "4 months",
            "impact_log": "Research on sustainable aviation technologies"
        },
        "donations": [
            {"name": "Aviation Corp", "amount": 500.0, "anonymous": False},
            {"name": "Anonymous", "amount": 300.0, "anonymous": True}
        ]
    },
    {
        "name": "Ahmed Hassan",
        "email": "ahmed.h@email.com",
        "picture": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        "country": "Nigeria",
        "field_of_study": "Business",
        "university": "University of Lagos",
        "verification_status": "verified",
        "campaign": {
            "title": "Support my social entrepreneurship education",
            "story": "I am passionate about social entrepreneurship and want to create businesses that solve local problems while generating employment. I need help covering my tuition and books for my final year.",
            "category": "tuition",
            "target_amount": 4000.0,
            "raised_amount": 4000.0,
            "donor_count": 3,
            "timeline": "8 months",
            "impact_log": "Will establish social enterprises creating 50+ jobs",
            "status": "completed"
        },
        "donations": [
            {"name": "Impact Investors", "amount": 2000.0, "anonymous": False},
            {"name": "Anonymous", "amount": 1000.0, "anonymous": True},
            {"name": "Business Angels", "amount": 1000.0, "anonymous": False}
        ]
    },
    {
        "name": "Maria Rodriguez",
        "email": "maria.r@email.com",
        "picture": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
        "country": "Mexico",
        "field_of_study": "Arts",
        "university": "Universidad Nacional Autónoma de México",
        "verification_status": "verified",
        "campaign": {
            "title": "Help me preserve Mexican art traditions digitally",
            "story": "I am studying digital arts and design to preserve and modernize traditional Mexican art forms. I need assistance with purchasing a professional laptop and design software to complete my thesis project.",
            "category": "laptop",
            "target_amount": 2500.0,
            "raised_amount": 1800.0,
            "donor_count": 3,
            "timeline": "3 months",
            "impact_log": "Digital preservation of indigenous art forms"
        },
        "donations": [
            {"name": "Arts Foundation", "amount": 800.0, "anonymous": False},
            {"name": "Anonymous", "amount": 500.0, "anonymous": True},
            {"name": "Cultural Society", "amount": 500.0, "anonymous": False}
        ]
    },
    {
        "name": "David Kim",
        "email": "david.k@email.com",
        "picture": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
        "country": "Canada",
        "field_of_study": "Economics",
        "university": "University of Toronto",
        "verification_status": "pending",
        "campaign": {
            "title": "Support my sustainable development research",
            "story": "I am researching economic models for sustainable development in developing nations. I need help with housing costs while I complete my research fellowship.",
            "category": "housing",
            "target_amount": 6000.0,
            "raised_amount": 1200.0,
            "donor_count": 1,
            "timeline": "6 months",
            "impact_log": "Economic development models for sustainable growth"
        },
        "donations": [
            {"name": "Anonymous", "amount": 1200.0, "anonymous": True}
        ]
    }
]


async def seed_data():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Clearing existing data...")
    await db.users.delete_many({"role": "student"})
    await db.student_profiles.delete_many({})
    await db.campaigns.delete_many({})
    await db.donations.delete_many({})
    
    print("Seeding students, campaigns, and donations...")
    
    for student_data in SAMPLE_STUDENTS:
        # Create user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": student_data["email"],
            "name": student_data["name"],
            "picture": student_data["picture"],
            "role": "student",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
        print(f"  Created user: {student_data['name']}")
        
        # Create student profile
        profile_id = f"profile_{uuid.uuid4().hex[:12]}"
        profile = {
            "profile_id": profile_id,
            "user_id": user_id,
            "country": student_data["country"],
            "field_of_study": student_data["field_of_study"],
            "university": student_data["university"],
            "verification_status": student_data["verification_status"],
            "verification_documents": [
                {"type": "Student ID", "url": None, "verified": student_data["verification_status"] == "verified"},
                {"type": "Acceptance Letter", "url": None, "verified": student_data["verification_status"] == "verified"}
            ],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.student_profiles.insert_one(profile)
        
        # Create campaign
        campaign_data = student_data["campaign"]
        campaign_id = f"campaign_{uuid.uuid4().hex[:12]}"
        campaign = {
            "campaign_id": campaign_id,
            "student_id": user_id,
            "title": campaign_data["title"],
            "story": campaign_data["story"],
            "category": campaign_data["category"],
            "target_amount": campaign_data["target_amount"],
            "raised_amount": campaign_data["raised_amount"],
            "donor_count": campaign_data["donor_count"],
            "timeline": campaign_data["timeline"],
            "impact_log": campaign_data["impact_log"],
            "status": campaign_data.get("status", "active"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.campaigns.insert_one(campaign)
        print(f"  Created campaign: {campaign_data['title'][:50]}...")
        
        # Create donations
        for donation_data in student_data.get("donations", []):
            donation_id = f"donation_{uuid.uuid4().hex[:12]}"
            donation = {
                "donation_id": donation_id,
                "campaign_id": campaign_id,
                "donor_id": None,
                "donor_name": donation_data["name"],
                "donor_email": None,
                "amount": donation_data["amount"],
                "anonymous": donation_data["anonymous"],
                "stripe_session_id": f"mock_session_{uuid.uuid4().hex[:8]}",
                "payment_status": "paid",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.donations.insert_one(donation)
    
    print("\nSeed data complete!")
    print(f"  - {len(SAMPLE_STUDENTS)} students")
    print(f"  - {len(SAMPLE_STUDENTS)} campaigns")
    print(f"  - {sum(len(s.get('donations', [])) for s in SAMPLE_STUDENTS)} donations")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_data())
