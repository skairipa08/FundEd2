import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Donation } from '@/lib/models';
import { handleError } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// GET /api/donations/status/[sessionId] - Get payment status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    
    await connectDB();
    
    const donation = await Donation.findOne({ stripeSessionId: sessionId }).lean();
    
    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId: donation.stripeSessionId,
        campaignId: donation.campaignId.toString(),
        amount: donation.amount,
        paymentStatus: donation.paymentStatus,
        donorName: donation.anonymous ? 'Anonymous' : donation.donorName,
        createdAt: donation.createdAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
