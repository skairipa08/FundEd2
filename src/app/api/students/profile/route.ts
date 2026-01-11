import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { requireAuth, handleError } from '@/lib/auth-helpers';

// POST /api/students/profile - Create student profile
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    
    // Check if user already has a student profile
    if (user.studentProfile) {
      return NextResponse.json(
        { success: false, error: 'Student profile already exists' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { country, fieldOfStudy, university, verificationDocuments } = body;
    
    // Validate required fields
    if (!country || !fieldOfStudy || !university) {
      return NextResponse.json(
        { success: false, error: 'country, fieldOfStudy, and university are required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Update user with student profile
    user.studentProfile = {
      country,
      fieldOfStudy,
      university,
      verificationStatus: 'pending',
      verificationDocuments: verificationDocuments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    user.role = 'student';
    await user.save();
    
    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        studentProfile: user.studentProfile,
      },
      message: 'Student profile created. Awaiting verification.',
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
