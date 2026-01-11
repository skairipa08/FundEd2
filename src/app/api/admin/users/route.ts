import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { requireRole, handleError } from '@/lib/auth-helpers';

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);
    
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    
    const query: Record<string, unknown> = { deleted: { $ne: true } };
    if (role) {
      query.role = role;
    }
    
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(query),
    ]);
    
    const data = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      studentProfile: user.studentProfile,
      createdAt: user.createdAt,
    }));
    
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
