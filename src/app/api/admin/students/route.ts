import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { requireRole, handleError } from '@/lib/auth-helpers';

// GET /api/admin/students - List all students
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);
    
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    const query: Record<string, unknown> = { 
      studentProfile: { $exists: true },
      deleted: { $ne: true },
    };
    
    if (status) {
      query['studentProfile.verificationStatus'] = status;
    }
    
    const students = await User.find(query)
      .sort({ 'studentProfile.createdAt': -1 })
      .lean();
    
    const data = students.map(student => ({
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
