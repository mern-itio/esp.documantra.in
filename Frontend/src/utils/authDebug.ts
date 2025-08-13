// Utility to debug authentication token storage
export const debugAuthStorage = () => {
  console.log('🔍 Debugging Authentication Storage...');
  
  const userData = localStorage.getItem('userData');
  const accessToken = localStorage.getItem('accessToken');
  const token = localStorage.getItem('token');
  const userToken = localStorage.getItem('userToken');
  
  console.log('📱 localStorage contents:');
  console.log('- userData:', userData ? JSON.parse(userData) : 'null');
  console.log('- accessToken:', accessToken || 'null');
  console.log('- token:', token || 'null');
  console.log('- userToken:', userToken || 'null');
  
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      console.log('🔑 Parsed userData fields:', Object.keys(parsed));
      console.log('🔑 userData.token:', parsed.token || 'undefined');
      console.log('🔑 userData.accessToken:', parsed.accessToken || 'undefined');
      console.log('🔑 userData.userToken:', parsed.userToken || 'undefined');
    } catch (error) {
      console.error('❌ Error parsing userData:', error);
    }
  }
  
  // Check if any token exists
  const hasAnyToken = accessToken || token || userToken || 
    (userData && (() => {
      try {
        const parsed = JSON.parse(userData);
        return parsed.token || parsed.accessToken || parsed.userToken;
      } catch {
        return null;
      }
    })());
  
  if (hasAnyToken) {
    console.log('✅ Token found in one of the locations');
  } else {
    console.log('❌ No token found in any location');
    console.log('💡 You need to store a JWT token in one of these locations:');
    console.log('   - localStorage.accessToken');
    console.log('   - localStorage.token');
    console.log('   - localStorage.userToken');
    console.log('   - localStorage.userData.token');
    console.log('   - localStorage.userData.accessToken');
    console.log('   - localStorage.userData.userToken');
  }
  
  return hasAnyToken;
};

// Function to manually set a token for testing
export const setTestToken = (token: string, location: 'accessToken' | 'token' | 'userToken' = 'accessToken') => {
  localStorage.setItem(location, token);
  console.log(`✅ Test token set in localStorage.${location}`);
  debugAuthStorage();
};

// Function to clear all tokens
export const clearAllTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userToken');
  
  const userData = localStorage.getItem('userData');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      delete parsed.token;
      delete parsed.accessToken;
      delete parsed.userToken;
      localStorage.setItem('userData', JSON.stringify(parsed));
    } catch (error) {
      console.error('Error updating userData:', error);
    }
  }
  
  console.log('🗑️ All tokens cleared');
};
