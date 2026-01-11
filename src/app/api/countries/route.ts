import { NextResponse } from 'next/server';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'India', 'Australia',
  'Germany', 'France', 'Nigeria', 'Kenya', 'Brazil', 'Mexico',
];

// GET /api/countries
export async function GET() {
  return NextResponse.json({
    success: true,
    data: COUNTRIES,
  });
}
