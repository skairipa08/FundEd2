import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type CampaignCategory = 'tuition' | 'books' | 'laptop' | 'housing' | 'travel' | 'emergency';
export type CampaignStatus = 'active' | 'completed' | 'cancelled' | 'suspended';

export interface ICampaign extends Document {
  studentId: Types.ObjectId;
  title: string;
  story: string;
  category: CampaignCategory;
  targetAmount: number;
  raisedAmount: number;
  donorCount: number;
  timeline: string;
  impactLog?: string;
  status: CampaignStatus;
  statusReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  story: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['tuition', 'books', 'laptop', 'housing', 'travel', 'emergency'],
    required: true 
  },
  targetAmount: { type: Number, required: true },
  raisedAmount: { type: Number, default: 0 },
  donorCount: { type: Number, default: 0 },
  timeline: { type: String, required: true },
  impactLog: { type: String },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled', 'suspended'],
    default: 'active'
  },
  statusReason: { type: String },
}, { timestamps: true });

// Indexes
CampaignSchema.index({ studentId: 1 });
CampaignSchema.index({ status: 1 });
CampaignSchema.index({ category: 1 });
CampaignSchema.index({ title: 'text', story: 'text' });

export const Campaign: Model<ICampaign> = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
