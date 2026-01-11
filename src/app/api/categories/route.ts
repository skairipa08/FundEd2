import { NextResponse } from 'next/server';

// Static data
const CATEGORIES = [
  { id: 'tuition', name: 'Tuition', icon: 'GraduationCap' },
  { id: 'books', name: 'Books & Materials', icon: 'BookOpen' },
  { id: 'laptop', name: 'Laptop & Equipment', icon: 'Laptop' },
  { id: 'housing', name: 'Housing', icon: 'Home' },
  { id: 'travel', name: 'Travel', icon: 'Plane' },
  { id: 'emergency', name: 'Emergency', icon: 'AlertCircle' },
];

// GET /api/categories
export async function GET() {
  return NextResponse.json({
    success: true,
    data: CATEGORIES,
  });
}
