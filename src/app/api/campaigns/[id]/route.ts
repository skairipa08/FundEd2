import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Campaign, User, Donation } from '@/lib/models';
import { requireAuth, handleError, getCurrentUser } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/campaigns/[id] - Get campaign details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectDB();
    
    const campaign = await Campaign.findById(id).lean();
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Get student data
    const student = await User.findById(campaign.studentId).lean();
    
    // Get recent donors (donor wall)
    const donations = await Donation.find({
      campaignId: campaign._id,
      paymentStatus: 'paid',
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    const donorWall = donations.map(d => ({
      name: d.anonymous ? 'Anonymous' : d.donorName,
      amount: d.amount,
      date: d.createdAt,
      anonymous: d.anonymous,
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        id: campaign._id.toString(),
        title: campaign.title,
        story: campaign.story,
        category: campaign.category,
        targetAmount: campaign.targetAmount,
        raisedAmount: campaign.raisedAmount,
        donorCount: campaign.donorCount,
        timeline: campaign.timeline,
        impactLog: campaign.impactLog,
        status: campaign.status,
        createdAt: campaign.createdAt,
        student: student ? {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          image: student.image,
          country: student.studentProfile?.country,
          fieldOfStudy: student.studentProfile?.fieldOfStudy,
          university: student.studentProfile?.university,
          verificationStatus: student.studentProfile?.verificationStatus,
          verificationDocuments: student.studentProfile?.verificationDocuments,
        } : null,
        donors: donorWall,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/campaigns/[id] - Update campaign (owner or admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user } = await requireAuth();
    
    await connectDB();
    
    const campaign = await Campaign.findById(id);
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Check ownership or admin
    if (campaign.studentId.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this campaign' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const allowedFields = ['title', 'story', 'category', 'targetAmount', 'timeline', 'impactLog'] as const;
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Use type assertion to safely update fields
        (campaign as unknown as Record<string, unknown>)[field] = body[field];
      }
    }
    
    await campaign.save();
    
    return NextResponse.json({
      success: true,
      data: {
        id: campaign._id.toString(),
        title: campaign.title,
        story: campaign.story,
        category: campaign.category,
        targetAmount: campaign.targetAmount,
        raisedAmount: campaign.raisedAmount,
        donorCount: campaign.donorCount,
        timeline: campaign.timeline,
        impactLog: campaign.impactLog,
        status: campaign.status,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      },
      message: 'Campaign updated successfully',
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/campaigns/[id] - Cancel campaign (owner or admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { user } = await requireAuth();
    
    await connectDB();
    
    const campaign = await Campaign.findById(id);
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    // Check ownership or admin
    if (campaign.studentId.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not authorized to cancel this campaign' },
        { status: 403 }
      );
    }
    
    // Soft delete - change status to cancelled
    campaign.status = 'cancelled';
    await campaign.save();
    
    return NextResponse.json({
      success: true,
      message: 'Campaign cancelled successfully',
    });
  } catch (error) {
    return handleError(error);
  }
}
