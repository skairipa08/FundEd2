import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Campaign } from '@/lib/models';
import { requireRole, handleError } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/campaigns/[id]/status - Update campaign status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await requireRole(['admin']);
    
    const body = await request.json();
    const { status, reason } = body;
    
    const validStatuses = ['active', 'suspended', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    campaign.status = status;
    campaign.statusReason = reason || undefined;
    await campaign.save();
    
    return NextResponse.json({
      success: true,
      message: `Campaign status updated to ${status}`,
    });
  } catch (error) {
    return handleError(error);
  }
}
