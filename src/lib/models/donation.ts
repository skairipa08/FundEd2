import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';

export interface IDonation extends Document {
  campaignId: Types.ObjectId;
  donorId?: Types.ObjectId;
  donorName: string;
  donorEmail?: string;
  amount: number;
  currency: string;
  anonymous: boolean;
  stripeSessionId: string;
  stripePaymentIntent?: string;
  paymentStatus: PaymentStatus;
  idempotencyKey?: string;
  refundAmount?: number;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  donorId: { type: Schema.Types.ObjectId, ref: 'User' },
  donorName: { type: String, required: true },
  donorEmail: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  anonymous: { type: Boolean, default: false },
  stripeSessionId: { type: String, required: true, unique: true },
  stripePaymentIntent: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'expired', 'refunded'],
    default: 'pending'
  },
  idempotencyKey: { type: String },
  refundAmount: { type: Number },
  refundedAt: { type: Date },
}, { timestamps: true });

// Indexes
DonationSchema.index({ campaignId: 1 });
DonationSchema.index({ donorId: 1 });
DonationSchema.index({ stripeSessionId: 1 }, { unique: true });
DonationSchema.index({ idempotencyKey: 1 });
DonationSchema.index({ paymentStatus: 1 });

export const Donation: Model<IDonation> = mongoose.models.Donation || mongoose.model<IDonation>('Donation', DonationSchema);
