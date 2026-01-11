import { NextResponse } from 'next/server';

const FIELDS_OF_STUDY = [
  'Computer Science', 'Engineering', 'Medicine', 'Business', 'Arts',
  'Mathematics', 'Physics', 'Biology', 'Economics', 'Psychology',
];

// GET /api/fields-of-study
export async function GET() {
  return NextResponse.json({
    success: true,
    data: FIELDS_OF_STUDY,
  });
}
