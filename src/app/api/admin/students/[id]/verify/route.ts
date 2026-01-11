import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { requireRole, handleError } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/students/[id]/verify - Approve or reject student
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requireRole(['admin']);
    
    const body = await request.json();
    const { action, reason } = body;
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const user = await User.findById(id);
    if (!user || !user.studentProfile) {
      return NextResponse.json(
        { success: false, error: 'Student profile not found' },
        { status: 404 }
      );
    }
    
    const newStatus = action === 'approve' ? 'verified' : 'rejected';
    
    user.studentProfile.verificationStatus = newStatus;
    
    if (action === 'approve') {
      user.studentProfile.verifiedAt = new Date();
      user.studentProfile.rejectionReason = undefined;
      // Mark documents as verified
      user.studentProfile.verificationDocuments = user.studentProfile.verificationDocuments.map(doc => ({
        ...doc,
        verified: true,
      }));
    } else {
      user.studentProfile.rejectionReason = reason || undefined;
    }
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: `Student ${action}d successfully`,
    });
  } catch (error) {
    return handleError(error);
  }
}
