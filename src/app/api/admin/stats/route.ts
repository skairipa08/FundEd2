import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User, Campaign, Donation } from '@/lib/models';
import { requireRole, handleError } from '@/lib/auth-helpers';

// GET /api/admin/stats - Get platform statistics
export async function GET() {
  try {
    await requireRole(['admin']);
    
    await connectDB();
    
    const [
      totalUsers,
      totalStudents,
      totalDonors,
      totalAdmins,
      pendingVerifications,
      verifiedStudents,
      rejectedStudents,
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      donationStats,
    ] = await Promise.all([
      User.countDocuments({ deleted: { $ne: true } }),
      User.countDocuments({ role: 'student', deleted: { $ne: true } }),
      User.countDocuments({ role: 'donor', deleted: { $ne: true } }),
      User.countDocuments({ role: 'admin', deleted: { $ne: true } }),
      User.countDocuments({ 'studentProfile.verificationStatus': 'pending' }),
      User.countDocuments({ 'studentProfile.verificationStatus': 'verified' }),
      User.countDocuments({ 'studentProfile.verificationStatus': 'rejected' }),
      Campaign.countDocuments({}),
      Campaign.countDocuments({ status: 'active' }),
      Campaign.countDocuments({ status: 'completed' }),
      Donation.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalDonations: { $sum: 1 },
        }},
      ]),
    ]);
    
    const totalRaised = donationStats[0]?.totalAmount || 0;
    const totalDonations = donationStats[0]?.totalDonations || 0;
    
    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          students: totalStudents,
          donors: totalDonors,
          admins: totalAdmins,
        },
        verifications: {
          pending: pendingVerifications,
          verified: verifiedStudents,
          rejected: rejectedStudents,
        },
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
          completed: completedCampaigns,
        },
        donations: {
          totalAmount: totalRaised,
          totalCount: totalDonations,
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
