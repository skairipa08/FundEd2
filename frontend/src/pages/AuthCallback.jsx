import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { exchangeCodeForSession, verifyState } from '../services/auth';

const AuthCallback = ({ onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`Google authentication failed: ${errorParam}`);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      // Verify state for CSRF protection
      if (state && !verifyState(state)) {
        setError('Invalid state parameter. Please try again.');
        return;
      }

      try {
        const result = await exchangeCodeForSession(code);
        
        if (result.success && result.data) {
          onLogin(result.data);
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [searchParams, navigate, onLogin]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Signing you in...</h1>
          <p className="text-gray-600">Please wait while we complete your authentication.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
