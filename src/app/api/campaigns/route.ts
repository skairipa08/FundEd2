import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Campaign, User } from '@/lib/models';
import { requireRole, handleError, getCurrentUser } from '@/lib/auth-helpers';

// GET /api/campaigns - List all active campaigns with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const country = searchParams.get('country');
    const fieldOfStudy = searchParams.get('fieldOfStudy');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    
    // Build query for campaigns
    const query: Record<string, unknown> = { status: 'active' };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { story: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Get campaigns with pagination
    const skip = (page - 1) * limit;
    let campaigns = await Campaign.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
    
    // Filter by country/fieldOfStudy if specified (requires student profile lookup)
    if (country || fieldOfStudy) {
      const studentIds = campaigns.map(c => c.studentId);
      const students = await User.find({ _id: { $in: studentIds } }).lean();
      const studentMap = new Map(students.map(s => [s._id.toString(), s]));
      
      campaigns = campaigns.filter(campaign => {
        const student = studentMap.get(campaign.studentId.toString());
        if (!student?.studentProfile) return false;
        if (country && student.studentProfile.country !== country) return false;
        if (fieldOfStudy && student.studentProfile.fieldOfStudy !== fieldOfStudy) return false;
        return true;
      });
    }
    
    // Enrich campaigns with student data
    const studentIds = campaigns.map(c => c.studentId);
    const students = await User.find({ _id: { $in: studentIds } }).lean();
    const studentMap = new Map(students.map(s => [s._id.toString(), s]));
    
    const enrichedCampaigns = campaigns.map(campaign => {
      const student = studentMap.get(campaign.studentId.toString());
      return {
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
        student: student ? {
          id: student._id.toString(),
          name: student.name,
          image: student.image,
          country: student.studentProfile?.country,
          fieldOfStudy: student.studentProfile?.fieldOfStudy,
          university: student.studentProfile?.university,
          verificationStatus: student.studentProfile?.verificationStatus,
        } : null,
      };
    });
    
    // Get total count for pagination
    const total = await Campaign.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: enrichedCampaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/campaigns - Create a new campaign (verified students only)
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(['student']);
    
    // Verify student is verified
    if (!user.studentProfile || user.studentProfile.verificationStatus !== 'verified') {
      return NextResponse.json(
        { success: false, error: 'Only verified students can create campaigns' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { title, story, category, targetAmount, timeline, impactLog } = body;
    
    // Validate required fields
    if (!title || !story || !category || !targetAmount || !timeline) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate category
    const validCategories = ['tuition', 'books', 'laptop', 'housing', 'travel', 'emergency'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const campaign = await Campaign.create({
      studentId: user._id,
      title,
      story,
      category,
      targetAmount: parseFloat(targetAmount),
      timeline,
      impactLog: impactLog || null,
    });
    
    return NextResponse.json({
      success: true,
      data: {
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
      },
      message: 'Campaign created successfully',
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
