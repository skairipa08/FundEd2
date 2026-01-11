import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Campaign } from '@/lib/models';
import { requireRole, handleError } from '@/lib/auth-helpers';

// GET /api/campaigns/my - Get current user's campaigns
export async function GET() {
  try {
    const { user } = await requireRole(['student', 'admin']);
    
    await connectDB();
    
    const campaigns = await Campaign.find({ studentId: user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    const data = campaigns.map(campaign => ({
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
    }));
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(error);
  }
}
