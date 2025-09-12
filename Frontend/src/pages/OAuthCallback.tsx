import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('Processing authorization...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const serviceId = searchParams.get('service') || 'unknown';

        if (error) {
          setStatus('error');
          setMessage(`Authorization failed: ${error}`);
          
          // Send error message to parent window
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({
                type: 'OAUTH_ERROR',
                error: error
              }, window.location.origin);
            }
          } catch (error) {
            console.log('Could not send error message to parent window');
          }
          return;
        }

        if (!code || !state) {
          setStatus('error');
          setMessage('Missing authorization code or state');
          return;
        }

        // Send success message to parent window
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'OAUTH_SUCCESS',
              code,
              state
            }, window.location.origin);
            
            setStatus('success');
            setMessage('Authorization successful! Closing window...');
            
            // Close window after a short delay
            setTimeout(() => {
              window.close();
            }, 1500);
          } else {
            // Fallback: try to communicate via localStorage
            setStatus('success');
            setMessage('Authorization successful! Processing...');
            
            // Store OAuth data in localStorage for parent window to pick up
            localStorage.setItem('oauthCallback', JSON.stringify({
              type: 'OAUTH_SUCCESS',
              code,
              state,
              timestamp: Date.now()
            }));
            
            // Try to close window
            setTimeout(() => {
              try {
                window.close();
              } catch (e) {
                // If can't close, redirect to main app
                window.location.href = `${window.location.origin}/pdf-tools?oauth=success&service=${serviceId || 'unknown'}`;
              }
            }, 1500);
          }
        } catch (error) {
          // COOP policy might block access to opener
          setStatus('success');
          setMessage('Authorization successful! Processing...');
          
          // Store OAuth data in localStorage for parent window to pick up
          localStorage.setItem('oauthCallback', JSON.stringify({
            type: 'OAUTH_SUCCESS',
            code,
            state,
            timestamp: Date.now()
          }));
          
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {
              window.location.href = `${window.location.origin}/pdf-tools?oauth=success&service=${serviceId || 'unknown'}`;
            }
          }, 1500);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage('An error occurred during authorization');
        
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'OAUTH_ERROR',
              error: 'Authorization failed'
            }, window.location.origin);
          }
        } catch (error) {
          // COOP policy might block access to opener
          console.log('Could not send error message to parent window');
        }
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Authorization</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authorization Failed</h2>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
