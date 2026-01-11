import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User, IUser, UserRole } from '@/lib/models/user';
import { NextResponse } from 'next/server';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
}

export interface AuthResult {
  user: IUser;
  sessionUser: SessionUser;
}

/**
 * Require authentication for an API route
 * Returns the authenticated user or throws an error response
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  
  if (!user || user.deleted) {
    throw NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  return { user, sessionUser: session.user as SessionUser };
}

/**
 * Require specific role(s) for an API route
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthResult> {
  const result = await requireAuth();
  
  if (!allowedRoles.includes(result.user.role)) {
    throw NextResponse.json(
      { success: false, error: 'Forbidden - insufficient permissions' },
      { status: 403 }
    );
  }

  return result;
}

/**
 * Get current user if authenticated, returns null otherwise
 */
export async function getCurrentUser(): Promise<IUser | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    
    if (!user || user.deleted) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Helper to create JSON response
 */
export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Helper to handle errors in API routes
 */
export function handleError(error: unknown) {
  console.error('API Error:', error);
  
  // If it's already a NextResponse, return it
  if (error instanceof NextResponse) {
    return error;
  }
  
  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  );
}
