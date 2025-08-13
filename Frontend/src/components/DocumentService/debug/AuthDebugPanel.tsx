import { useState } from 'react';
import { debugAuthStorage, setTestToken, clearAllTokens } from '../../../utils/authDebug';

export function AuthDebugPanel() {
  const [testToken, setTestTokenValue] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODk5ZTk5NWQzMjBhYzM1ZjJiM2MxY2QiLCJlbWFpbCI6InNuZWhhdGl3YXJpMDYyMEBnbWFpbC5jb20iLCJpYXQiOjE3MzQ5NjgwMDAsImV4cCI6MTczNTA1NDQwMH0.test-signature');
  const [tokenLocation, setTokenLocation] = useState<'accessToken' | 'token' | 'userToken'>('accessToken');

  const handleDebugStorage = () => {
    debugAuthStorage();
  };

  const handleSetTestToken = () => {
    setTestToken(testToken, tokenLocation);
  };

  const handleClearTokens = () => {
    clearAllTokens();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">🔐 Auth Debug Panel</h3>
      
      <div className="space-y-3">
        <button
          onClick={handleDebugStorage}
          className="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Debug Storage
        </button>
        
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">
            Test Token:
          </label>
          <input
            type="text"
            value={testToken}
            onChange={(e) => setTestTokenValue(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="Enter JWT token for testing"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">
            Token Location:
          </label>
          <select
            value={tokenLocation}
            onChange={(e) => setTokenLocation(e.target.value as any)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          >
            <option value="accessToken">localStorage.accessToken</option>
            <option value="token">localStorage.token</option>
            <option value="userToken">localStorage.userToken</option>
          </select>
        </div>
        
        <button
          onClick={handleSetTestToken}
          className="w-full px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          Set Test Token
        </button>
        
        <button
          onClick={handleClearTokens}
          className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear All Tokens
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <p>💡 Check browser console for debug info</p>
        <p>🔑 Token will be used for API requests</p>
      </div>
    </div>
  );
}
