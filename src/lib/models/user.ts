import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'student' | 'donor' | 'institution' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface IVerificationDocument {
  type: string;
  url?: string;
  verified: boolean;
}

export interface IStudentProfile {
  country: string;
  fieldOfStudy: string;
  university: string;
  verificationStatus: VerificationStatus;
  verificationDocuments: IVerificationDocument[];
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends Document {
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  studentProfile?: IStudentProfile;
  deleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationDocumentSchema = new Schema<IVerificationDocument>({
  type: { type: String, required: true },
  url: { type: String },
  verified: { type: Boolean, default: false },
});

const StudentProfileSchema = new Schema<IStudentProfile>({
  country: { type: String, required: true },
  fieldOfStudy: { type: String, required: true },
  university: { type: String, required: true },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationDocuments: [VerificationDocumentSchema],
  verifiedAt: { type: Date },
  rejectionReason: { type: String },
}, { timestamps: true });

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String },
  role: { 
    type: String, 
    enum: ['student', 'donor', 'institution', 'admin'],
    default: 'donor'
  },
  studentProfile: StudentProfileSchema,
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { timestamps: true });

// Indexes for faster queries (email index created by unique: true)
UserSchema.index({ role: 1 });
UserSchema.index({ 'studentProfile.verificationStatus': 1 });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
