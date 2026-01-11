import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { requireRole, handleError } from '@/lib/auth-helpers';

// GET /api/admin/students/pending - List pending students
export async function GET() {
  try {
    await requireRole(['admin']);
    
    await connectDB();
    
    const pendingStudents = await User.find({
      'studentProfile.verificationStatus': 'pending',
      deleted: { $ne: true },
    })
      .sort({ 'studentProfile.createdAt': -1 })
      .lean();
    
    const data = pendingStudents.map(student => ({
      id: student._id.toString(),
      email: student.email,
      name: student.name,
      image: student.image,
      role: student.role,
      studentProfile: student.studentProfile,
      createdAt: student.createdAt,
    }));
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(error);
  }
}
