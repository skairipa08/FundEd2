import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Campaign, User } from '@/lib/models';
import { requireRole, handleError } from '@/lib/auth-helpers';

// GET /api/admin/campaigns - List all campaigns (admin view)
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);
    
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }
    
    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    // Get student details
    const studentIds = [...new Set(campaigns.map(c => c.studentId.toString()))];
    const students = await User.find({ _id: { $in: studentIds } }).lean();
    const studentMap = new Map(students.map(s => [s._id.toString(), s]));
    
    const data = campaigns.map(campaign => {
      const student = studentMap.get(campaign.studentId.toString());
      return {
        id: campaign._id.toString(),
        title: campaign.title,
        story: campaign.story,
        category: campaign.category,
        targetAmount: campaign.targetAmount,
        raisedAmount: campaign.raisedAmount,
        donorCount: campaign.donorCount,
        status: campaign.status,
        createdAt: campaign.createdAt,
        student: student ? {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          image: student.image,
        } : null,
        studentProfile: student?.studentProfile,
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
