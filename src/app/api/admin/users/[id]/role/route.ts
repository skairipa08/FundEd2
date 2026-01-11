import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { requireRole, handleError } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/users/[id]/role - Update user role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user: admin } = await requireRole(['admin']);
    
    const body = await request.json();
    const { role } = body;
    
    const validRoles = ['donor', 'student', 'admin', 'institution'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }
    
    // Prevent self-demotion
    if (id === admin._id.toString() && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot demote yourself' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    user.role = role;
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/users/[id]/role - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user: admin } = await requireRole(['admin']);
    
    if (id === admin._id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Soft delete
    user.deleted = true;
    user.deletedAt = new Date();
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'User deleted',
    });
  } catch (error) {
    return handleError(error);
  }
}
