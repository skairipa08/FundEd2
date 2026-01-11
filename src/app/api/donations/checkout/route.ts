import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/db';
import { Campaign, Donation } from '@/lib/models';
import { getCurrentUser, handleError } from '@/lib/auth-helpers';
import { randomUUID } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// POST /api/donations/checkout - Create Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, amount, donorName, donorEmail, anonymous, originUrl, idempotencyKey } = body;
    
    // Validate required fields
    if (!campaignId || !amount) {
      return NextResponse.json(
        { success: false, error: 'campaignId and amount are required' },
        { status: 400 }
      );
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      return NextResponse.json(
        { success: false, error: 'Amount must be between $0.01 and $100,000' },
        { status: 400 }
      );
    }
    
    if (!originUrl) {
      return NextResponse.json(
        { success: false, error: 'originUrl is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Generate idempotency key if not provided
    const idemKey = idempotencyKey || `${campaignId}_${amount}_${randomUUID().slice(0, 16)}`;
    
    // Check for existing donation with same idempotency key
    const existingDonation = await Donation.findOne({ idempotencyKey: idemKey });
    if (existingDonation) {
      // Return existing session URL if available
      return NextResponse.json({
        success: true,
        data: {
          sessionId: existingDonation.stripeSessionId,
        },
        message: 'Existing checkout session returned',
      });
    }
    
    // Verify campaign exists and is active
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    if (campaign.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Campaign is not accepting donations' },
        { status: 400 }
      );
    }
    
    // Get current user if authenticated
    const currentUser = await getCurrentUser();
    const donorId = currentUser?._id || null;
    const finalDonorEmail = donorEmail || currentUser?.email || null;
    
    const successUrl = `${originUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}&campaign_id=${campaignId}`;
    const cancelUrl = `${originUrl}/campaign/${campaignId}`;
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Donation: ${campaign.title.slice(0, 50)}`,
            description: 'Supporting education',
          },
          unit_amount: Math.round(parsedAmount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: finalDonorEmail || undefined,
      metadata: {
        campaignId: campaignId,
        donorId: donorId?.toString() || '',
        donorName: donorName || 'Anonymous',
        anonymous: anonymous ? 'true' : 'false',
        idempotencyKey: idemKey,
      },
    }, {
      idempotencyKey: idemKey,
    });
    
    // Create donation record
    await Donation.create({
      campaignId: campaign._id,
      donorId: donorId,
      donorName: donorName || 'Anonymous',
      donorEmail: finalDonorEmail,
      amount: parsedAmount,
      anonymous: anonymous || false,
      stripeSessionId: session.id,
      paymentStatus: 'pending',
      idempotencyKey: idemKey,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        url: session.url,
        sessionId: session.id,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
