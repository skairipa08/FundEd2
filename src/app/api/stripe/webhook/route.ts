import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/db';
import { Donation, Campaign } from '@/lib/models';

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// IMPORTANT: This route must read the raw body for signature verification
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // MUST reject if webhook secret is not configured
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }
  
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }
  
  // Read raw body for signature verification
  const rawBody = await request.text();
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }
  
  await connectDB();
  
  console.log(`Processing webhook event: ${event.type}`);
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid') {
          await processSuccessfulPayment(session);
        }
        break;
      }
      
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        await processSuccessfulPayment(session);
        break;
      }
      
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await processPaymentFailure(session.id);
        break;
      }
      
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await Donation.findOneAndUpdate(
          { stripeSessionId: session.id },
          { paymentStatus: 'expired' }
        );
        break;
      }
      
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const refundAmount = (charge.amount_refunded || 0) / 100;
        await processRefund(charge.payment_intent as string, refundAmount);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true, event: event.type });
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    // Return 200 to prevent Stripe retries for processing errors
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

async function processSuccessfulPayment(session: Stripe.Checkout.Session) {
  const donation = await Donation.findOne({ stripeSessionId: session.id });
  
  if (!donation) {
    console.error(`No donation found for session ${session.id}`);
    return;
  }
  
  // Prevent duplicate processing
  if (donation.paymentStatus === 'paid') {
    console.log(`Donation ${session.id} already processed`);
    return;
  }
  
  // Update donation
  donation.paymentStatus = 'paid';
  donation.stripePaymentIntent = session.payment_intent as string;
  await donation.save();
  
  // Update campaign totals
  await Campaign.findByIdAndUpdate(
    donation.campaignId,
    {
      $inc: {
        raisedAmount: donation.amount,
        donorCount: 1,
      },
    }
  );
  
  // Check if campaign reached target
  const campaign = await Campaign.findById(donation.campaignId);
  if (campaign && campaign.raisedAmount >= campaign.targetAmount) {
    campaign.status = 'completed';
    await campaign.save();
  }
  
  console.log(`Successfully processed payment for session ${session.id}`);
}

async function processPaymentFailure(sessionId: string) {
  await Donation.findOneAndUpdate(
    { stripeSessionId: sessionId },
    { paymentStatus: 'failed' }
  );
  console.log(`Marked payment ${sessionId} as failed`);
}

async function processRefund(paymentIntentId: string, refundAmount: number) {
  const donation = await Donation.findOne({ stripePaymentIntent: paymentIntentId });
  
  if (!donation) {
    console.warn(`No donation found for refunded payment intent ${paymentIntentId}`);
    return;
  }
  
  // Update donation status
  donation.paymentStatus = 'refunded';
  donation.refundAmount = refundAmount;
  donation.refundedAt = new Date();
  await donation.save();
  
  // Update campaign totals
  await Campaign.findByIdAndUpdate(
    donation.campaignId,
    {
      $inc: {
        raisedAmount: -refundAmount,
        donorCount: -1,
      },
    }
  );
  
  console.log(`Processed refund for payment intent ${paymentIntentId}`);
}
