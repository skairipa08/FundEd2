import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Donation, Campaign } from '@/lib/models';
import { requireAuth, handleError } from '@/lib/auth-helpers';

// GET /api/donations/my - Get current user's donations
export async function GET() {
  try {
    const { user } = await requireAuth();
    
    await connectDB();
    
    const donations = await Donation.find({ 
      donorId: user._id,
      paymentStatus: 'paid',
    })
      .sort({ createdAt: -1 })
      .lean();
    
    // Get campaign details for each donation
    const campaignIds = [...new Set(donations.map(d => d.campaignId.toString()))];
    const campaigns = await Campaign.find({ _id: { $in: campaignIds } }).lean();
    const campaignMap = new Map(campaigns.map(c => [c._id.toString(), c]));
    
    const data = donations.map(donation => {
      const campaign = campaignMap.get(donation.campaignId.toString());
      return {
        id: donation._id.toString(),
        amount: donation.amount,
        anonymous: donation.anonymous,
        paymentStatus: donation.paymentStatus,
        createdAt: donation.createdAt,
        campaign: campaign ? {
          id: campaign._id.toString(),
          title: campaign.title,
          category: campaign.category,
        } : null,
      };
    });
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(error);
  }
}
