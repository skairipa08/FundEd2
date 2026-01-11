import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/user';
import { requireAuth, handleError } from '@/lib/auth-helpers';

// GET /api/auth/me - Get current user with student profile
export async function GET() {
  try {
    const { user } = await requireAuth();
    
    // Return sanitized user data
    const userData = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      studentProfile: user.studentProfile ? {
        country: user.studentProfile.country,
        fieldOfStudy: user.studentProfile.fieldOfStudy,
        university: user.studentProfile.university,
        verificationStatus: user.studentProfile.verificationStatus,
        verificationDocuments: user.studentProfile.verificationDocuments,
        verifiedAt: user.studentProfile.verifiedAt,
      } : null,
      createdAt: user.createdAt,
    };
    
    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    return handleError(error);
  }
}
