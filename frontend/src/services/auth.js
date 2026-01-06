// Authentication service for FundEd
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

/**
 * Get Google OAuth authorization URL
 */
export async function getGoogleAuthUrl() {
  // If we have client ID in frontend, build URL directly
  if (GOOGLE_CLIENT_ID) {
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'openid email profile';
    const state = generateState();
    
    // Store state for CSRF verification
    sessionStorage.setItem('oauth_state', state);
    
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }
  
  // Fallback: get config from backend
  const response = await fetch(`${BACKEND_URL}/api/auth/config`);
  if (!response.ok) {
    throw new Error('Failed to get auth configuration');
  }
  const data = await response.json();
  
  // Store state for CSRF verification
  sessionStorage.setItem('oauth_state', data.data.state);
  
  return data.data.auth_url;
}

/**
 * Exchange authorization code for session
 */
export async function exchangeCodeForSession(code) {
  const response = await fetch(`${BACKEND_URL}/api/auth/google/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Authentication failed');
  }
  
  return response.json();
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    throw new Error('Failed to get user');
  }
  
  return response.json();
}

/**
 * Logout
 */
export async function logout() {
  const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  
  return response.json();
}

/**
 * Generate random state for CSRF protection
 */
function generateState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify OAuth state (CSRF protection)
 */
export function verifyState(receivedState) {
  const storedState = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state');
  return storedState === receivedState;
}

export default {
  getGoogleAuthUrl,
  exchangeCodeForSession,
  getCurrentUser,
  logout,
  verifyState,
};
