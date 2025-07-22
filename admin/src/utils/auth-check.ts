// Authentication check utility

export function checkAuthStatus() {
  const authToken = sessionStorage.getItem('auth_token');
  const refreshToken = sessionStorage.getItem('refresh_token');
  const userData = sessionStorage.getItem('user_data');
  
  console.log('🔍 Auth Status Check:');
  console.log('- Auth Token:', authToken ? `${authToken.substring(0, 20)}...` : 'NOT FOUND');
  console.log('- Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'NOT FOUND');
  console.log('- User Data:', userData ? JSON.parse(userData) : 'NOT FOUND');
  console.log('- SessionStorage Keys:', Object.keys(sessionStorage));
  
  return {
    hasAuthToken: !!authToken,
    hasRefreshToken: !!refreshToken,
    hasUserData: !!userData,
    authToken: authToken,
    userData: userData ? JSON.parse(userData) : null
  };
}

export function testHeaderConstruction() {
  const authToken = sessionStorage.getItem('auth_token');
  
  if (!authToken) {
    console.error('❌ No auth token found for header test');
    return null;
  }
  
  // Import the getHeaders function
  import('@/config/api').then(({ getHeaders }) => {
    const headers = getHeaders({ authToken });
    console.log('🧪 Header Construction Test:');
    console.log('- Input Token:', `${authToken.substring(0, 20)}...`);
    console.log('- Generated Headers:', headers);
    console.log('- Authorization Header:', headers.Authorization);
  });
}

export function forceLogin() {
  console.log('🔄 Redirecting to login...');
  window.location.href = '/login';
}
